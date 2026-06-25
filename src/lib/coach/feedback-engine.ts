/**
 * 决策评估引擎（DecisionEvaluator）
 *
 * 职责：对比用户决策 vs GTO 推荐，生成纠偏反馈
 * 支持赛后复盘报告生成
 */

import type {
  Street,
  GTOAction,
  GTOAdvice,
  FeedbackType,
  DeviationResult,
  DecisionContext,
  UserAction,
  CoachSession,
  CoachDecision,
  CoachFeedback,
  CoachReviewReport,
} from "./types"

/**
 * 评估用户决策偏差
 *
 * @param userAction 用户实际动作
 * @param gtoAdvice GTO 推荐建议
 * @param context 决策上下文（轮次、胜率、赔率等）
 * @returns 偏差评估结果
 */
export function evaluateDeviation(
  userAction: UserAction,
  gtoAdvice: GTOAdvice | null,
  context: DecisionContext
): DeviationResult {
  try {
    if (!gtoAdvice) {
      return {
        feedbackType: "positive",
        message: "当前无 GTO 参考数据",
        suggestion: null,
        deviationScore: 0,
      }
    }

    const gtoAction = gtoAdvice.action
    const gtoFreq = gtoAdvice.frequency

    // 将用户动作映射到 GTO 动作
    const mappedUserAction = mapUserActionToGTO(userAction)

    // 判断是否匹配
    if (mappedUserAction === gtoAction) {
      return getPositiveFeedback(mappedUserAction, gtoAdvice, context)
    }

    // 不匹配，根据 GTO 频率判断偏差程度
    if (gtoFreq > 0.3) {
      return getMinorDeviationFeedback(mappedUserAction, gtoAdvice, context)
    }

    return getMajorDeviationFeedback(mappedUserAction, gtoAdvice, context)
  } catch {
    return {
      feedbackType: "positive",
      message: "决策已记录",
      suggestion: null,
      deviationScore: 0,
    }
  }
}

/**
 * 将用户动作映射到 GTO 动作
 */
function mapUserActionToGTO(action: UserAction): GTOAction {
  switch (action) {
    case "fold":
      return "fold"
    case "check":
      return "check"
    case "call":
      return "call"
    case "raise":
    case "all_in":
      return "raise"
    default:
      return "fold"
  }
}

/**
 * 生成正确决策反馈
 */
function getPositiveFeedback(
  action: GTOAction,
  advice: GTOAdvice,
  context: DecisionContext
): DeviationResult {
  const actionName = getActionName(action)
  const messages: Record<string, string> = {
    fold: `弃牌是正确决策，GTO 推荐弃牌频率 ${Math.round(advice.frequency * 100)}%`,
    check: `过牌是正确决策，GTO 推荐过牌频率 ${Math.round(advice.frequency * 100)}%`,
    call: `跟注是正确决策，GTO 推荐跟注频率 ${Math.round(advice.frequency * 100)}%`,
    raise: `加注是正确决策，GTO 推荐加注频率 ${Math.round(advice.frequency * 100)}%`,
  }

  const message = messages[action] || `${actionName} 符合 GTO 策略`

  return {
    feedbackType: "positive",
    message,
    suggestion: null,
    deviationScore: 0,
  }
}

/**
 * 生成轻微偏差反馈
 */
function getMinorDeviationFeedback(
  userAction: GTOAction,
  advice: GTOAdvice,
  context: DecisionContext
): DeviationResult {
  const userActionName = getActionName(userAction)
  const gtoActionName = getActionName(advice.action)
  const gtoFreqPct = Math.round(advice.frequency * 100)

  const message = `GTO 推荐 ${gtoActionName}（频率 ${gtoFreqPct}%），你选择了 ${userActionName}`

  const suggestion = buildSuggestion(advice.action, context)

  return {
    feedbackType: "minor_deviation",
    message,
    suggestion,
    deviationScore: 0.3,
  }
}

/**
 * 生成严重偏差反馈
 */
function getMajorDeviationFeedback(
  userAction: GTOAction,
  advice: GTOAdvice,
  context: DecisionContext
): DeviationResult {
  const userActionName = getActionName(userAction)
  const gtoActionName = getActionName(advice.action)

  // 计算 EV 损失
  const evLoss = calculateEVLoss(userAction, advice, context)

  const message = `GTO 推荐 ${gtoActionName}（低频率 ${Math.round(advice.frequency * 100)}%），你选择了 ${userActionName}，预期损失 ${evLoss.toFixed(1)}BB`

  const suggestion = buildSuggestion(advice.action, context)

  return {
    feedbackType: "major_deviation",
    message,
    suggestion,
    deviationScore: 0.7,
  }
}

/**
 * 构建改进建议
 */
function buildSuggestion(gtoAction: GTOAction, context: DecisionContext): string | null {
  const { equity, potOdds, ev, street, potSize } = context

  switch (gtoAction) {
    case "fold":
      if (equity < potOdds) {
        return `你的胜率（${Math.round(equity * 100)}%）低于底池赔率（${Math.round(potOdds * 100)}%），弃牌可以避免损失`
      }
      return "GTO 策略建议在此场景弃牌以控制损失"

    case "check":
      if (street === "flop") {
        return "Flop 圈过牌可以控制底池大小，等待 Turn 再做决定"
      }
      return "过牌可以保持底池可控，避免不必要的风险"

    case "call":
      if (equity > potOdds) {
        return `你的胜率（${Math.round(equity * 100)}%）高于底池赔率（${Math.round(potOdds * 100)}%），跟注是 +EV 决策`
      }
      return "跟注可以保持参与，但注意控制投入"

    case "raise":
      if (equity > 0.5) {
        return `你的手牌胜率较高（${Math.round(equity * 100)}%），加注可以获取更多价值`
      }
      return "加注可以获取主动权，迫使对手做出艰难决策"

    default:
      return null
  }
}

/**
 * 计算 EV 损失
 */
function calculateEVLoss(
  userAction: GTOAction,
  advice: GTOAdvice,
  context: DecisionContext
): number {
  const { equity, potSize } = context

  // 简化计算：假设 GTO 动作的 EV 为 0，用户动作的 EV 为负
  if (userAction === "call" && advice.action === "fold") {
    // 应该弃牌但跟注
    return (1 - equity) * potSize * 0.01
  }

  if (userAction === "fold" && advice.action === "call") {
    // 应该跟注但弃牌
    return equity * potSize * 0.01
  }

  if (userAction === "raise" && advice.action === "fold") {
    // 应该弃牌但加注
    return potSize * 0.02
  }

  return Math.abs(equity - context.potOdds) * potSize * 0.01
}

/**
 * 获取动作的中文名称
 */
function getActionName(action: GTOAction | UserAction): string {
  switch (action) {
    case "fold":
      return "弃牌"
    case "check":
      return "过牌"
    case "call":
      return "跟注"
    case "raise":
      return "加注"
    case "all_in":
      return "全下"
    default:
      return action
  }
}

/**
 * 生成赛后复盘报告
 */
export function generateReviewReport(
  session: CoachSession,
  decisions: CoachDecision[],
  feedbacks: CoachFeedback[]
): CoachReviewReport {
  try {
    const { stats, deviationByStreet } = calculateSessionStats(decisions, feedbacks)
    const keyDecisions = extractKeyDecisions(decisions, feedbacks)
    const improvementTips = generateImprovementTips(deviationByStreet, stats.actionDistribution)

    return {
      session,
      stats,
      deviationByStreet,
      keyDecisions,
      improvementTips,
    }
  } catch {
    return getFallbackReport(session, decisions)
  }
}

function calculateSessionStats(
  decisions: CoachDecision[],
  feedbacks: CoachFeedback[]
): {
  stats: CoachReviewReport["stats"]
  deviationByStreet: CoachReviewReport["deviationByStreet"]
} {
  const actionDistribution: Record<string, number> = { fold: 0, check: 0, call: 0, raise: 0, all_in: 0 }
  let correctCount = 0
  let minorDeviationCount = 0
  let majorDeviationCount = 0
  let totalEv = 0
  let winCount = 0
  let totalNetChips = 0

  const deviationByStreet: Record<string, { correct: number; minor: number; major: number }> = {
    preflop: { correct: 0, minor: 0, major: 0 },
    flop: { correct: 0, minor: 0, major: 0 },
    turn: { correct: 0, minor: 0, major: 0 },
    river: { correct: 0, minor: 0, major: 0 },
  }

  for (const decision of decisions) {
    if (actionDistribution[decision.userAction] !== undefined) {
      actionDistribution[decision.userAction]++
    }

    if (decision.isCorrect) {
      correctCount++
      if (deviationByStreet[decision.street]) {
        deviationByStreet[decision.street].correct++
      }
    } else if (decision.deviation !== null) {
      if (decision.deviation < 0.5) {
        minorDeviationCount++
        if (deviationByStreet[decision.street]) {
          deviationByStreet[decision.street].minor++
        }
      } else {
        majorDeviationCount++
        if (deviationByStreet[decision.street]) {
          deviationByStreet[decision.street].major++
        }
      }
    }

    if (decision.ev !== null) totalEv += decision.ev
    if (decision.result === "win") winCount++
    if (decision.netChips !== null) totalNetChips += decision.netChips
  }

  const totalHands = decisions.length
  const stats: CoachReviewReport["stats"] = {
    totalHands,
    actionDistribution: actionDistribution as CoachReviewReport["stats"]["actionDistribution"],
    correctCount,
    minorDeviationCount,
    majorDeviationCount,
    correctRate: totalHands > 0 ? correctCount / totalHands : 0,
    totalEv,
    netChips: totalNetChips,
    winRate: totalHands > 0 ? winCount / totalHands : 0,
  }

  return { stats, deviationByStreet: deviationByStreet as CoachReviewReport["deviationByStreet"] }
}

function extractKeyDecisions(
  decisions: CoachDecision[],
  feedbacks: CoachFeedback[]
): CoachReviewReport["keyDecisions"] {
  const keyDecisions: CoachReviewReport["keyDecisions"] = []

  for (const decision of decisions) {
    if (decision.deviation !== null && decision.deviation > 0.5 && decision.ev !== null) {
      const feedback = feedbacks.find((f) => f.decisionId === decision.id)
      keyDecisions.push({
        handNumber: decision.handNumber,
        street: decision.street,
        userAction: decision.userAction,
        gtoRecommendation: decision.gtoRecommendation || "unknown",
        ev: decision.ev,
        deviation: decision.deviation,
        feedbackType: feedback?.feedbackType || "major_deviation",
        message: feedback?.message || "严重偏差决策",
      })
    }
  }

  keyDecisions.sort((a, b) => Math.abs(b.ev) - Math.abs(a.ev))
  return keyDecisions.slice(0, 5)
}

function getFallbackReport(session: CoachSession, decisions: CoachDecision[]): CoachReviewReport {
  return {
    session,
    stats: {
      totalHands: decisions.length,
      actionDistribution: { fold: 0, check: 0, call: 0, raise: 0, all_in: 0 },
      correctCount: 0,
      minorDeviationCount: 0,
      majorDeviationCount: 0,
      correctRate: 0,
      totalEv: 0,
      netChips: 0,
      winRate: 0,
    },
    deviationByStreet: {
      preflop: { correct: 0, minor: 0, major: 0 },
      flop: { correct: 0, minor: 0, major: 0 },
      turn: { correct: 0, minor: 0, major: 0 },
      river: { correct: 0, minor: 0, major: 0 },
    },
    keyDecisions: [],
    improvementTips: ["复盘数据生成失败，请检查训练记录"],
  }
}

/**
 * 生成改进建议
 */
function generateImprovementTips(
  deviationByStreet: Record<string, { correct: number; minor: number; major: number }>,
  actionDistribution: Record<string, number>
): string[] {
  const tips: string[] = []
  const totalDecisions = Object.values(actionDistribution).reduce((a, b) => a + b, 0)

  // 按轮次分析
  for (const [street, counts] of Object.entries(deviationByStreet)) {
    const total = counts.correct + counts.minor + counts.major
    if (total === 0) continue

    const deviationRate = (counts.minor + counts.major) / total
    const streetName = getStreetName(street)

    if (deviationRate > 0.5) {
      tips.push(`${streetName}圈偏差率较高（${Math.round(deviationRate * 100)}%），建议重点关注该阶段的决策`)
    } else if (deviationRate < 0.2 && total >= 3) {
      tips.push(`${streetName}圈决策准确率较高（${Math.round((1 - deviationRate) * 100)}%），继续保持`)
    }
  }

  // 按动作分析
  const foldRate = totalDecisions > 0 ? (actionDistribution.fold || 0) / totalDecisions : 0
  const raiseRate = totalDecisions > 0 ? (actionDistribution.raise || 0) / totalDecisions : 0

  if (foldRate > 0.4) {
    tips.push("弃牌率过高（超过 40%），建议收紧起手牌范围，多考虑跟注和加注")
  } else if (foldRate < 0.1 && totalDecisions >= 10) {
    tips.push("弃牌率过低，建议在不利局面果断弃牌以控制损失")
  }

  if (raiseRate > 0.4) {
    tips.push("加注率较高，注意加注时需要强牌支持，避免过度激进")
  }

  if (tips.length === 0) {
    tips.push("整体决策表现良好，建议持续训练以巩固 GTO 策略")
  }

  return tips
}

/**
 * 获取轮次中文名称
 */
function getStreetName(street: string): string {
  switch (street) {
    case "preflop":
      return "Preflop"
    case "flop":
      return "Flop"
    case "turn":
      return "Turn"
    case "river":
      return "River"
    default:
      return street
  }
}
