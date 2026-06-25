/**
 * AI 对手引擎（OpponentEngine）
 *
 * 职责：模拟 AI 对手决策，基于 GTO 策略
 * 支持不同难度级别：aggressive / passive / gto
 */

import { getPreflopAdvice, selectRandomAdvice, getRandomPosition } from "./gto-engine"
import { evaluateHandStrength, getPostflopAdvice } from "./postflop-strategy"
import { calculateEquity } from "./equity-engine"
import type { Street, OpponentStyle, OpponentDecision, UserAction, Position } from "./types"

/**
 * 获取对手决策
 *
 * @param street 当前轮次
 * @param holeCards 对手底牌
 * @param boardCards 公共牌
 * @param potSize 当前底池
 * @param opponentStack 对手筹码
 * @param userAction 用户动作
 * @param userBetAmount 用户下注额
 * @param style 对手风格
 * @returns 对手决策
 */
export function getOpponentDecision(
  street: Street,
  holeCards: string[],
  boardCards: string[],
  potSize: number,
  opponentStack: number,
  userAction: string,
  userBetAmount: number,
  style: OpponentStyle = "gto"
): OpponentDecision {
  try {
    if (street === "preflop") {
      return getPreflopOpponentDecision(holeCards, userAction, userBetAmount, style, opponentStack)
    }

    return getPostflopOpponentDecision(
      street,
      holeCards,
      boardCards,
      potSize,
      opponentStack,
      userAction,
      userBetAmount,
      style
    )
  } catch {
    return { action: "fold", betAmount: 0 }
  }
}

/**
 * Preflop 对手决策
 */
function getPreflopOpponentDecision(
  holeCards: string[],
  userAction: string,
  userBetAmount: number,
  style: OpponentStyle,
  opponentStack: number
): OpponentDecision {
  const position = getRandomPosition()

  // 如果用户加注，对手决定是否 3-bet 或跟注
  if (userAction === "raise" || userAction === "all_in") {
    const threeBetAdvices = getPreflopAdvice(position, holeCards)
    const selected = selectRandomAdvice(threeBetAdvices)

    // 根据风格调整
    const adjustedAction = adjustActionByStyle(selected.action, style)

    if (adjustedAction === "raise") {
      const betAmount = Math.min(
        userBetAmount * 3,
        opponentStack
      )
      return { action: "raise", betAmount }
    }

    if (adjustedAction === "call") {
      return { action: "call", betAmount: userBetAmount }
    }

    return { action: "fold", betAmount: 0 }
  }

  // 用户过牌或跟注，对手决定是否加注
  const advices = getPreflopAdvice(position, holeCards)
  const selected = selectRandomAdvice(advices)
  const adjustedAction = adjustActionByStyle(selected.action, style)

  if (adjustedAction === "raise") {
    const raiseSize = getPreflopRaiseSize(style)
    return { action: "raise", betAmount: Math.min(raiseSize, opponentStack) }
  }

  if (adjustedAction === "call") {
    return { action: "check", betAmount: 0 }
  }

  return { action: "check", betAmount: 0 }
}

/**
 * Postflop 对手决策
 */
function getPostflopOpponentDecision(
  street: Street,
  holeCards: string[],
  boardCards: string[],
  potSize: number,
  opponentStack: number,
  userAction: string,
  userBetAmount: number,
  style: OpponentStyle
): OpponentDecision {
  const handStrength = evaluateHandStrength(holeCards, boardCards)
  const isInPosition = Math.random() > 0.5

  // 用户已经下注，对手决定是否跟注/加注/弃牌
  if (userAction === "bet" || userAction === "raise" || userAction === "all_in") {
    const advice = getPostflopAdvice(
      street,
      handStrength,
      potSize,
      opponentStack,
      isInPosition,
      userAction,
      userBetAmount
    )

    const adjustedAction = adjustActionByStyle(advice.action, style)

    if (adjustedAction === "raise") {
      const raiseMultiplier = style === "aggressive" ? 1.5 : style === "passive" ? 0.75 : 1
      const betAmount = Math.min(
        (advice.betSize || userBetAmount * 2) * raiseMultiplier,
        opponentStack
      )
      return { action: "raise", betAmount }
    }

    if (adjustedAction === "call") {
      return { action: "call", betAmount: userBetAmount }
    }

    return { action: "fold", betAmount: 0 }
  }

  // 用户过牌，对手决定是否下注
  const advice = getPostflopAdvice(
    street,
    handStrength,
    potSize,
    opponentStack,
    isInPosition
  )

  const adjustedAction = adjustActionByStyle(advice.action, style)

  if (adjustedAction === "raise") {
    const betAmount = Math.min(
      (advice.betSize || potSize * 0.66),
      opponentStack
    )
    return { action: "raise", betAmount }
  }

  return { action: "check", betAmount: 0 }
}

/**
 * 根据风格调整动作
 */
function adjustActionByStyle(action: UserAction, style: OpponentStyle): UserAction {
  if (style === "aggressive") {
    // 激进风格：提高加注频率，降低弃牌频率
    if (action === "check" && Math.random() < 0.3) return "raise"
    if (action === "call" && Math.random() < 0.2) return "raise"
    if (action === "fold" && Math.random() < 0.15) return "call"
    return action
  }

  if (style === "passive") {
    // 被动风格：降低加注频率，提高过牌/跟注频率
    if (action === "raise" && Math.random() < 0.3) return "call"
    if (action === "raise" && Math.random() < 0.15) return "check"
    return action
  }

  // GTO 风格：不做调整
  return action
}

/**
 * 获取 Preflop 加注大小
 */
function getPreflopRaiseSize(style: OpponentStyle): number {
  switch (style) {
    case "aggressive":
      return 350
    case "passive":
      return 200
    case "gto":
    default:
      return 250
  }
}
