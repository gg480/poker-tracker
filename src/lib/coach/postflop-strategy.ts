/**
 * Postflop 简化策略引擎（PostflopStrategy）
 *
 * 职责：Flop/Turn/River 阶段提供简化 GTO 建议
 * 基于手牌强度分级 + 底池赔率 + 位置的启发式规则
 */

import handRankings from "./hand-rankings.json"
import { calculatePotOdds, calculateEV, isPositiveEV, getHandName } from "./equity-engine"
import type { HandStrength, Street, GTOAction, PostflopAdvice } from "./types"

type HandRankingsData = {
  nut: { description: string; hands: string[] }
  top_pair_plus: { description: string; preflop_hands: string[] }
  middle_pair: { description: string; preflop_hands: string[] }
  draw: { description: string; draw_hands: string[] }
  weak: { description: string; preflop_hands: string[] }
}

const rankingsData = handRankings as unknown as HandRankingsData

/**
 * 评估手牌强度
 *
 * @param holeCards 底牌，如 ["Ah", "Kd"]
 * @param boardCards 公共牌，如 ["2s", "7c", "Jh"]
 * @returns 手牌强度等级
 */
export function evaluateHandStrength(
  holeCards: string[],
  boardCards: string[]
): HandStrength {
  try {
    const handName = getHandName(holeCards)

    // Preflop — 基于手牌名称判断
    if (boardCards.length === 0) {
      if (rankingsData.top_pair_plus.preflop_hands.includes(handName)) {
        return "top_pair_plus"
      }
      if (rankingsData.middle_pair.preflop_hands.includes(handName)) {
        return "middle_pair"
      }
      if (rankingsData.draw.draw_hands.includes(handName)) {
        return "draw"
      }
      return "weak"
    }

    // Postflop — 简化判断（基于牌面组合分析）
    const allCards = [...holeCards, ...boardCards]
    const ranks = allCards.map((c) => (c.length === 3 ? "T" : c[0].toUpperCase()))
    const suits = allCards.map((c) => (c.length === 3 ? c[2] : c[1].toLowerCase()))

    // 检查是否同花
    for (const suit of ["s", "h", "d", "c"]) {
      const suitedCards = allCards.filter((c) => {
        const s = c.length === 3 ? c[2] : c[1]
        return s.toLowerCase() === suit
      })
      if (suitedCards.length >= 4) return "draw"
    }

    // 检查是否成对
    const rankCount: Record<string, number> = {}
    for (const rank of ranks) {
      rankCount[rank] = (rankCount[rank] || 0) + 1
    }

    const maxCount = Math.max(...Object.values(rankCount))

    if (maxCount >= 3) return "nut" // 三条以上
    if (maxCount >= 2) {
      // 检查是否是顶对
      const holeRanks = holeCards.map((c) => (c.length === 3 ? "T" : c[0].toUpperCase()))
      const boardRanks = boardCards.map((c) => (c.length === 3 ? "T" : c[0].toUpperCase()))
      const RANK_ORDER = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"]

      for (const holeRank of holeRanks) {
        if (boardRanks.includes(holeRank)) {
          // 底牌与公共牌配对
          const boardMaxRank = Math.max(...boardRanks.map((r) => RANK_ORDER.indexOf(r)))
          const holeRankIdx = RANK_ORDER.indexOf(holeRank)
          if (holeRankIdx >= boardMaxRank) return "top_pair_plus"
          return "middle_pair"
        }
      }
      return "middle_pair"
    }

    // 检查顺子听牌
    const uniqueRanks = [...new Set(ranks.map((r) => "23456789TJQKA".indexOf(r)))]
      .filter((r) => r >= 0)
      .sort((a, b) => a - b)

    for (let i = 0; i <= uniqueRanks.length - 3; i++) {
      if (uniqueRanks[i + 2] - uniqueRanks[i] <= 2) {
        return "draw"
      }
    }

    return "weak"
  } catch {
    return "weak"
  }
}

/**
 * 获取 Postflop GTO 建议
 *
 * @param street 当前轮次
 * @param handStrength 手牌强度
 * @param potSize 当前底池
 * @param stackSize 用户筹码
 * @param isInPosition 是否有位置优势
 * @param opponentAction 对手动作
 * @param opponentBetSize 对手下注额
 * @returns Postflop 建议
 */
export function getPostflopAdvice(
  street: Street,
  handStrength: HandStrength,
  potSize: number,
  stackSize: number,
  isInPosition: boolean,
  opponentAction?: string,
  opponentBetSize?: number
): PostflopAdvice {
  try {
    // 如果对手已经下注，需要先决定是否跟注
    if (opponentAction === "bet" || opponentAction === "raise") {
      return handleFacingBet(
        handStrength,
        potSize,
        opponentBetSize || 0,
        stackSize,
        isInPosition
      )
    }

    // 对手过牌或未行动，决定是否下注
    return handleDecisionToBet(street, handStrength, potSize, stackSize, isInPosition)
  } catch {
    return { action: "check", frequency: 1 }
  }
}

/**
 * 处理面对对手下注的情况
 */
function handleFacingBet(
  handStrength: HandStrength,
  potSize: number,
  betSize: number,
  stackSize: number,
  isInPosition: boolean
): PostflopAdvice {
  const potOdds = calculatePotOdds(potSize, betSize)

  switch (handStrength) {
    case "nut": {
      // 坚果 — 加注或跟注
      const raiseSize = isInPosition ? potSize * 0.75 : potSize
      return {
        action: "raise",
        frequency: 0.7,
        betSize: Math.min(raiseSize, stackSize),
      }
    }

    case "top_pair_plus": {
      // 顶对以上 — 跟注为主，部分加注
      if (potOdds < 0.25) {
        return {
          action: "call",
          frequency: 0.75,
        }
      }
      return {
        action: "call",
        frequency: 0.6,
      }
    }

    case "middle_pair": {
      // 中对 — 看赔率决定
      if (potOdds < 0.2) {
        return {
          action: "call",
          frequency: 0.5,
        }
      }
      return {
        action: "fold",
        frequency: 0.7,
      }
    }

    case "draw": {
      // 听牌 — 有合适赔率就跟注
      if (potOdds < 0.3) {
        return {
          action: "call",
          frequency: 0.6,
        }
      }
      return {
        action: "fold",
        frequency: 0.8,
      }
    }

    case "weak": {
      // 垃圾牌 — 弃牌
      return {
        action: "fold",
        frequency: 0.9,
      }
    }

    default:
      return { action: "fold", frequency: 1 }
  }
}

/**
 * 处理决定是否下注的情况
 */
function handleDecisionToBet(
  street: Street,
  handStrength: HandStrength,
  potSize: number,
  stackSize: number,
  isInPosition: boolean
): PostflopAdvice {
  const betSizeRatio = getBetSizeRatio(street, isInPosition)
  const betSize = Math.min(potSize * betSizeRatio, stackSize)

  switch (handStrength) {
    case "nut": {
      return {
        action: "raise",
        frequency: 0.85,
        betSize,
      }
    }

    case "top_pair_plus": {
      return {
        action: "raise",
        frequency: 0.7,
        betSize,
      }
    }

    case "middle_pair": {
      // 中对有过牌价值
      if (isInPosition) {
        return {
          action: "check",
          frequency: 0.6,
        }
      }
      return {
        action: "check",
        frequency: 0.7,
      }
    }

    case "draw": {
      // 听牌 — 半诈唬或过牌
      if (isInPosition && street === "flop") {
        return {
          action: "raise",
          frequency: 0.3,
          betSize: potSize * 0.5,
        }
      }
      return {
        action: "check",
        frequency: 0.6,
      }
    }

    case "weak": {
      return {
        action: "check",
        frequency: 0.8,
      }
    }

    default:
      return { action: "check", frequency: 1 }
  }
}

/**
 * 获取下注大小比例（相对于底池）
 */
function getBetSizeRatio(street: Street, isInPosition: boolean): number {
  if (street === "flop") {
    return isInPosition ? 0.75 : 0.66
  }
  if (street === "turn") {
    return isInPosition ? 0.75 : 0.66
  }
  if (street === "river") {
    return isInPosition ? 0.8 : 0.75
  }
  return 0.75
}

/**
 * 判断是否应该持续下注（C-Bet）
 */
export function shouldCBet(
  handStrength: HandStrength,
  isPreflopRaiser: boolean
): boolean {
  if (!isPreflopRaiser) return false
  return handStrength !== "weak"
}
