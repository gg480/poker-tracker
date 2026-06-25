/**
 * 教练服务层（Coach Service）
 *
 * 职责：封装教练模块业务逻辑，协调 engine 和 CRUD 层
 */

import type {
  CoachMode,
  OpponentStyle,
  CreateSessionRequest,
  RecordDecisionRequest,
  RecordDecisionResponse,
  AdviceQuery,
  AdviceResponse,
  EquityQuery,
  EquityResponse,
  CoachSession,
  CoachDecision,
  CoachFeedback,
  CoachReviewReport,
  PaginatedResult,
  TrainingSettings,
  Street,
  GTOAdvice,
  DecisionContext,
  Position,
  FeedbackType,
  UserAction,
} from "@/lib/coach/types"
import {
  getCoachSessions,
  getCoachSessionById,
  insertCoachSession,
  updateCoachSession,
  getDecisionsBySession,
  insertCoachDecision,
  getFeedbackBySession,
  insertCoachFeedback,
} from "@/storage/database/crud"
import { getPreflopAdvice, selectRandomAdvice, getRangeByPosition } from "@/lib/coach/gto-engine"
import { calculateEquity, calculatePotOdds, calculateEV, getHandName } from "@/lib/coach/equity-engine"
import { evaluateDeviation, generateReviewReport } from "@/lib/coach/feedback-engine"
import { getOpponentDecision } from "@/lib/coach/opponent-engine"
import { getPostflopAdvice } from "@/lib/coach/postflop-strategy"

// 默认设置 (修复 OP-33: 盲注与 training-settings 保持一致)
const DEFAULT_STARTING_STACK = 1000  // 100 BB @ 5/10
const DEFAULT_BLIND_SMALL = 5
const DEFAULT_BLIND_BIG = 10
const DEFAULT_OPPONENT_STYLE: OpponentStyle = "gto"

/**
 * 创建训练会话
 */
export function createSession(req: CreateSessionRequest): CoachSession {
  const session = insertCoachSession({
    mode: req.mode,
    status: "in_progress",
    startingStack: req.startingStack ?? DEFAULT_STARTING_STACK,
    blindSmall: req.blindSmall ?? DEFAULT_BLIND_SMALL,
    blindBig: req.blindBig ?? DEFAULT_BLIND_BIG,
    opponentStyle: req.opponentStyle ?? DEFAULT_OPPONENT_STYLE,
    totalHands: 0,
    totalEv: 0,
    completedAt: null,
  })
  return session as CoachSession
}

/**
 * 获取会话列表（分页）
 */
export function listSessions(
  page: number = 1,
  limit: number = 20,
  status?: string
): PaginatedResult<CoachSession> {
  const result = getCoachSessions({ status, page, limit })
  return {
    items: result.items as CoachSession[],
    total: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages,
  }
}

/**
 * 获取会话详情
 */
export function getSession(id: string): CoachSession | null {
  const session = getCoachSessionById(id)
  return session as CoachSession | null
}

/**
 * 获取会话详情（含决策记录）
 */
export function getSessionWithDecisions(id: string): {
  session: CoachSession | null
  decisions: CoachDecision[]
  feedbacks: CoachFeedback[]
} | null {
  const session = getCoachSessionById(id)
  if (!session) return null

  const rawDecisions = getDecisionsBySession(id)
  const decisions: CoachDecision[] = rawDecisions.map((d) => {
    let holeCards: [string, string] = ['', '']
    let boardCards: string[] = []
    try {
      const parsed = JSON.parse(d.holeCards as string)
      if (Array.isArray(parsed) && parsed.length === 2) holeCards = parsed as [string, string]
    } catch { /* ignore malformed holeCards */ }
    try {
      const parsed = JSON.parse(d.boardCards as string)
      if (Array.isArray(parsed)) boardCards = parsed as string[]
    } catch { /* ignore malformed boardCards */ }

    return {
      id: d.id,
      sessionId: d.sessionId,
      handNumber: d.handNumber,
      street: d.street as Street,
      holeCards,
      boardCards,
      potSize: d.potSize,
      userStack: d.userStack,
      opponentStack: d.opponentStack,
      userAction: d.userAction as CoachDecision["userAction"],
      userBetAmount: d.userBetAmount,
      opponentAction: d.opponentAction as CoachDecision["opponentAction"],
      opponentBetAmount: d.opponentBetAmount,
      gtoRecommendation: d.gtoRecommendation as CoachDecision["gtoRecommendation"],
      gtoFrequency: d.gtoFrequency,
      equity: d.equity,
      potOdds: d.potOdds,
      ev: d.ev,
      isCorrect: d.isCorrect,
      deviation: d.deviation,
      result: d.result as CoachDecision["result"],
      netChips: d.netChips,
      createdAt: d.createdAt,
    }
  })
  const feedbacks = getFeedbackBySession(id) as CoachFeedback[]

  return {
    session: session as CoachSession,
    decisions,
    feedbacks,
  }
}

/**
 * 获取 GTO 建议（不保存）
 */
export function getAdvice(query: AdviceQuery): AdviceResponse {
  const { street, holeCards, boardCards = [], potSize = 0, position } = query

  // 计算权益和赔率
  const equityResult = calculateEquity(holeCards, boardCards)
  const callAmount = potSize * 0.5 // 简化估算
  const potOdds = calculatePotOdds(potSize, callAmount)
  const ev = calculateEV(equityResult.equity, potSize, callAmount)

  // 获取 GTO 建议
  let gtoAdvice: GTOAdvice[] = []

  if (street === "preflop" && position) {
    gtoAdvice = getPreflopAdvice(position, holeCards)
  } else {
    // Postflop 简化策略
    const advice = getPostflopAdvice(
      street as "flop" | "turn" | "river",
      equityResult.equity > 0.5 ? "top_pair_plus" : "middle_pair",
      potSize,
      0,
      false
    )
    gtoAdvice = [advice]
  }

  return {
    gtoAdvice,
    equity: equityResult.equity,
    potOdds,
    ev,
    handStrength: equityResult.equity > 0.7 ? "nut" : equityResult.equity > 0.5 ? "top_pair_plus" : "middle_pair",
    position,
  }
}

/**
 * 记录决策并返回 GTO 反馈
 */
export function recordDecision(
  sessionId: string,
  req: RecordDecisionRequest
): RecordDecisionResponse | null {
  const session = getCoachSessionById(sessionId)
  if (!session) return null

  const advice = getAdvice({
    street: req.street,
    holeCards: req.holeCards,
    boardCards: req.boardCards,
    potSize: req.potSize,
  })
  // Reuse equity from getAdvice — same inputs, same result.
  // Keep potOdds/ev recalculated with the player's actual bet (not the estimate used by getAdvice).
  const equity = advice.equity
  const potOdds = calculatePotOdds(req.potSize, req.userBetAmount)
  const ev = calculateEV(advice.equity, req.potSize, req.userBetAmount)

  const context: DecisionContext = {
    street: req.street,
    equity,
    potOdds,
    ev,
    potSize: req.potSize,
  }

  const deviationResult = evaluateDeviation(req.userAction, advice.gtoAdvice[0] || null, context)
  const isCorrect = deviationResult.feedbackType === "positive"
  const { result, netChips } = evaluateDecisionResult(req, advice)

  const opponent = calculateOpponentResponse(req, session.opponentStyle as OpponentStyle)
  const { potSizeAfter, userStackAfter, opponentStackAfter } = calculateStackAfter(req, opponent)

  const decision = persistDecisionAndFeedback(sessionId, req, advice, equity, potOdds, ev, isCorrect, deviationResult, opponent, netChips, result)

  updateSessionStats(sessionId)

  return buildResponse(decision, advice, equity, potOdds, ev, deviationResult, opponent, potSizeAfter, userStackAfter, opponentStackAfter)
}

function evaluateDecisionResult(req: RecordDecisionRequest, advice: AdviceResponse): { result: "win" | "lose" | "fold"; netChips: number } {
  if (req.userAction === "fold") {
    return { result: "fold", netChips: 0 }
  }
  if (advice.gtoAdvice[0]?.action === req.userAction) {
    return { result: "win", netChips: req.potSize }
  }
  return { result: "lose", netChips: -req.userBetAmount }
}

function calculateOpponentResponse(req: RecordDecisionRequest, opponentStyle: OpponentStyle) {
  return getOpponentDecision(
    req.street, req.holeCards, req.boardCards, req.potSize,
    req.opponentStack, req.userAction, req.userBetAmount, opponentStyle
  )
}

function calculateStackAfter(req: RecordDecisionRequest, opponent: { betAmount: number }) {
  return {
    potSizeAfter: req.potSize + req.userBetAmount + opponent.betAmount,
    userStackAfter: req.userStack - req.userBetAmount,
    opponentStackAfter: req.opponentStack - opponent.betAmount,
  }
}

function persistDecisionAndFeedback(
  sessionId: string,
  req: RecordDecisionRequest,
  advice: AdviceResponse,
  equity: number,
  potOdds: number,
  ev: number,
  isCorrect: boolean,
  deviationResult: { feedbackType: string; deviationScore: number; message: string; suggestion: string | null },
  opponent: { action: string; betAmount: number },
  netChips: number,
  result: "win" | "lose" | "fold"
) {
  const decision = insertCoachDecision({
    sessionId,
    handNumber: req.handNumber,
    street: req.street,
    holeCards: JSON.stringify(req.holeCards),
    boardCards: JSON.stringify(req.boardCards),
    potSize: req.potSize,
    userStack: req.userStack,
    opponentStack: req.opponentStack,
    userAction: req.userAction,
    userBetAmount: req.userBetAmount,
    opponentAction: opponent.action,
    opponentBetAmount: opponent.betAmount,
    gtoRecommendation: advice.gtoAdvice[0]?.action || null,
    gtoFrequency: advice.gtoAdvice[0]?.frequency || null,
    equity,
    potOdds,
    ev,
    isCorrect,
    deviation: deviationResult.deviationScore,
    result,
    netChips,
  })

  insertCoachFeedback({
    sessionId,
    decisionId: decision.id,
    feedbackType: deviationResult.feedbackType,
    message: deviationResult.message,
    suggestion: deviationResult.suggestion,
  })

  return decision
}

function updateSessionStats(sessionId: string) {
  const decisions = getDecisionsBySession(sessionId)
  const totalEv = decisions.reduce((sum, d) => sum + (d.ev || 0), 0)
  updateCoachSession(sessionId, { totalHands: decisions.length, totalEv })
}

function buildResponse(
  decision: { id: string },
  advice: AdviceResponse,
  equity: number,
  potOdds: number,
  ev: number,
  deviationResult: { feedbackType: FeedbackType; message: string; suggestion: string | null },
  opponent: { action: UserAction; betAmount: number },
  potSizeAfter: number,
  userStackAfter: number,
  opponentStackAfter: number
): RecordDecisionResponse {
  return {
    decisionId: decision.id,
    gtoRecommendation: advice.gtoAdvice[0] || null,
    equity,
    potOdds,
    ev,
    isCorrect: deviationResult.feedbackType === "positive",
    feedback: {
      type: deviationResult.feedbackType,
      message: deviationResult.message,
      suggestion: deviationResult.suggestion,
    },
    opponentAction: opponent.action,
    opponentBetAmount: opponent.betAmount,
    potSizeAfter,
    userStackAfter,
    opponentStackAfter,
  }
}

/**
 * 完成训练
 */
export function completeSession(id: string, action: "complete" | "abandon"): CoachSession | null {
  const session = getCoachSessionById(id)
  if (!session) return null

  const updates = {
    status: action === "complete" ? "completed" : "abandoned",
    completedAt: new Date().toISOString(),
  }

  const updated = updateCoachSession(id, updates)
  return updated as CoachSession
}

/**
 * 获取复盘报告
 */
export function getReviewReport(sessionId: string): CoachReviewReport | null {
  const data = getSessionWithDecisions(sessionId)
  if (!data || !data.session) return null

  return generateReviewReport(data.session, data.decisions, data.feedbacks)
}

/**
 * 获取 GTO 范围表
 */
export function getGTORanges(position?: Position): Record<string, unknown> {
  if (position) {
    return {
      raise: getRangeByPosition(position, "raise"),
      call: getRangeByPosition(position, "call"),
      fold: getRangeByPosition(position, "fold"),
    }
  }

  const positions: Position[] = ["UTG", "MP", "CO", "BTN", "SB", "BB"]
  const ranges: Record<string, unknown> = {}

  for (const pos of positions) {
    ranges[pos] = {
      raise: getRangeByPosition(pos, "raise"),
      call: getRangeByPosition(pos, "call"),
      fold: getRangeByPosition(pos, "fold"),
    }
  }

  return ranges
}

/**
 * 计算手牌胜率
 */
export function computeEquity(query: EquityQuery): EquityResponse {
  const { holeCards, boardCards = [], opponentRange } = query

  const result = calculateEquity(holeCards, boardCards, opponentRange)
  const handName = getHandName(holeCards)

  let boardName = "无公共牌"
  if (boardCards.length === 3) boardName = "Flop"
  else if (boardCards.length === 4) boardName = "Turn"
  else if (boardCards.length === 5) boardName = "River"

  return {
    win: result.win,
    tie: result.tie,
    equity: result.equity,
    handName,
    boardName,
  }
}
