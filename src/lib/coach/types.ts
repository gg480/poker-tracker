/** 教练模块类型定义 */

// ==================== 基础类型 ====================
// Base types (Street, UserAction, GTOAction, FeedbackType, CoachMode,
// OpponentStyle, TrainingSettings) are shared at @/lib/types.
// Coach-specific extensions live here.

import type {
  Street, UserAction, GTOAction, CoachMode, OpponentStyle,
  FeedbackType,
} from "@/lib/types"

export type {
  Street, UserAction, GTOAction, CoachMode, OpponentStyle,
  FeedbackType,
}

export type CoachStatus = "in_progress" | "completed" | "abandoned"
export type Position = "UTG" | "MP" | "CO" | "BTN" | "SB" | "BB"
export type HandStrength = "nut" | "top_pair_plus" | "middle_pair" | "draw" | "weak"
export type TableSize = 6 | 9
export type HandResult = "win" | "lose" | "tie" | "fold"

// ==================== 数据库模型 ====================

export interface CoachSession {
  id: string
  mode: CoachMode
  status: CoachStatus
  startingStack: number
  blindSmall: number
  blindBig: number
  opponentStyle: OpponentStyle
  totalHands: number
  totalEv: number
  createdAt: string
  completedAt: string | null
  updatedAt?: string
}

export interface CoachDecision {
  id: string
  sessionId: string
  handNumber: number
  street: Street
  holeCards: string[]
  boardCards: string[]
  potSize: number
  userStack: number
  opponentStack: number
  userAction: UserAction
  userBetAmount: number
  opponentAction: UserAction | null
  opponentBetAmount: number
  gtoRecommendation: GTOAction | null
  gtoFrequency: number | null
  equity: number | null
  potOdds: number | null
  ev: number | null
  isCorrect: boolean | null
  deviation: number | null
  result: HandResult | null
  netChips: number | null
  createdAt: string
  updatedAt?: string
}

export interface CoachFeedback {
  id: string
  sessionId: string
  decisionId: string
  feedbackType: FeedbackType
  message: string
  suggestion: string | null
  createdAt: string
  updatedAt?: string
}

// ==================== 引擎接口类型 ====================

export interface EquityResult {
  win: number
  tie: number
  equity: number
  lose?: number
  iterations?: number
}

export interface GTOAdvice {
  action: GTOAction
  frequency: number
  raiseSize?: number
}

export interface PostflopAdvice {
  action: GTOAction
  frequency: number
  betSize?: number
}

export interface DeviationResult {
  feedbackType: FeedbackType
  message: string
  suggestion: string | null
  deviationScore: number
}

export interface OpponentDecision {
  action: UserAction
  betAmount: number
}

// ==================== 训练设置类型 ====================

export interface TrainingSettings {
  mode: CoachMode
  startingStack: number
  blindSmall: number
  blindBig: number
  opponentStyle: OpponentStyle
  tableSize?: TableSize
  totalHands?: number
}

// ==================== API 请求/响应类型 ====================

export interface CreateSessionRequest {
  mode: CoachMode
  startingStack?: number
  blindSmall?: number
  blindBig?: number
  opponentStyle?: OpponentStyle
}

export interface RecordDecisionRequest {
  street: Street
  handNumber: number
  holeCards: string[]
  boardCards: string[]
  potSize: number
  userStack: number
  opponentStack: number
  userAction: UserAction
  userBetAmount: number
}

export interface RecordDecisionResponse {
  decisionId: string
  gtoRecommendation: GTOAdvice | null
  equity: number
  potOdds: number
  ev: number
  isCorrect: boolean
  feedback: {
    type: FeedbackType
    message: string
    suggestion: string | null
  }
  opponentAction: UserAction
  opponentBetAmount: number
  potSizeAfter: number
  userStackAfter: number
  opponentStackAfter: number
}

export interface CompleteSessionRequest {
  action: "complete" | "abandon"
}

export interface AdviceQuery {
  street: Street
  holeCards: string[]
  boardCards?: string[]
  potSize?: number
  position?: Position
}

export interface AdviceResponse {
  gtoAdvice: GTOAdvice[]
  equity: number
  potOdds: number
  ev: number
  handStrength: HandStrength
  position?: Position
}

export interface EquityQuery {
  holeCards: string[]
  boardCards?: string[]
  opponentRange?: string[]
}

export interface EquityResponse {
  win: number
  tie: number
  equity: number
  handName: string
  boardName: string
}

// ==================== 复盘报告类型 ====================

export interface CoachReviewReport {
  session: CoachSession
  stats: {
    totalHands: number
    actionDistribution: Record<UserAction, number>
    correctCount: number
    minorDeviationCount: number
    majorDeviationCount: number
    correctRate: number
    totalEv: number
    netChips: number
    winRate: number
  }
  deviationByStreet: Record<Street, { correct: number; minor: number; major: number }>
  keyDecisions: Array<{
    handNumber: number
    street: string
    userAction: string
    gtoRecommendation: string
    ev: number
    deviation: number
    feedbackType: string
    message: string
  }>
  improvementTips: string[]
}

// ==================== 分页类型 ====================

export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// ==================== 决策评估上下文 ====================

export interface DecisionContext {
  street: Street
  equity: number
  potOdds: number
  ev: number
  potSize: number
}
