/**
 * Preflop GTO 范围表引擎（GTORangeTable）
 *
 * 职责：根据位置和手牌查询 Preflop GTO 建议（6-max Cash Game）
 * 数据来源：preflop-ranges.json（预计算 JSON 文件）
 */

import preflopRanges from "./preflop-ranges.json"
import { getHandName } from "./equity-engine"
import type { Position, GTOAction, GTOAdvice, TableSize } from "./types"

type RangeData = {
  tableSize: number
  positions: string[]
  ranges: Record<string, Record<string, string[]>>
  threeBet: Record<string, Record<string, string[]>>
  callVsRaise: Record<string, Record<string, string[]>>
}

const rangeData = preflopRanges as unknown as RangeData

/** 获取手牌的标准表示（如 "AKs", "KK"） */
function getStandardHandNotation(holeCards: string[]): string {
  return getHandName(holeCards)
}

/** 检查手牌是否在范围列表中 */
function isHandInRange(hand: string, range: string[]): boolean {
  return range.includes(hand)
}

/** 根据频率随机选择动作 */
function selectActionByFrequency(adviceList: GTOAdvice[]): GTOAdvice {
  const totalFreq = adviceList.reduce((sum, a) => sum + a.frequency, 0)
  if (totalFreq <= 0) return { action: "fold", frequency: 1 }

  let rand = Math.random() * totalFreq
  for (const advice of adviceList) {
    rand -= advice.frequency
    if (rand <= 0) return advice
  }

  return adviceList[adviceList.length - 1]
}

/**
 * 查询 Preflop GTO 建议
 *
 * @param position 位置
 * @param hand 底牌，如 ["Ah", "Kd"]
 * @param tableSize 桌型，6-max 或 9-max
 * @returns GTO 建议列表（按频率排序）
 */
export function getPreflopAdvice(
  position: Position,
  hand: string[],
  tableSize: TableSize = 6
): GTOAdvice[] {
  try {
    const handNotation = getStandardHandNotation(hand)
    const positionRanges = rangeData.ranges[position]

    if (!positionRanges) {
      return [{ action: "fold", frequency: 1 }]
    }

    const advices: GTOAdvice[] = []

    // 检查是否在加注范围
    if (isHandInRange(handNotation, positionRanges.raise)) {
      const raiseSize = getRaiseSize(position)
      advices.push({ action: "raise", frequency: 0.85, raiseSize })
    }

    // 检查是否在跟注范围
    if (isHandInRange(handNotation, positionRanges.call)) {
      advices.push({ action: "call", frequency: 0.7 })
    }

    // 检查是否在弃牌范围
    if (isHandInRange(handNotation, positionRanges.fold)) {
      advices.push({ action: "fold", frequency: 0.95 })
    }

    // 如果不在任何明确范围，默认弃牌
    if (advices.length === 0) {
      advices.push({ action: "fold", frequency: 1 })
    }

    return advices
  } catch {
    return [{ action: "fold", frequency: 1 }]
  }
}

/**
 * 获取 Preflop 3-bet 建议
 *
 * @param position 当前玩家位置
 * @param hand 底牌
 * @returns GTO 建议列表
 */
export function getThreeBetAdvice(
  position: Position,
  hand: string[]
): GTOAdvice[] {
  try {
    const handNotation = getStandardHandNotation(hand)
    const threeBetRanges = rangeData.threeBet[position]

    if (!threeBetRanges) {
      return [{ action: "fold", frequency: 1 }]
    }

    const advices: GTOAdvice[] = []

    if (isHandInRange(handNotation, threeBetRanges.raise)) {
      advices.push({ action: "raise", frequency: 0.8, raiseSize: getThreeBetSize(position) })
    }

    if (isHandInRange(handNotation, threeBetRanges.call)) {
      advices.push({ action: "call", frequency: 0.65 })
    }

    if (advices.length === 0) {
      advices.push({ action: "fold", frequency: 1 })
    }

    return advices
  } catch {
    return [{ action: "fold", frequency: 1 }]
  }
}

/**
 * 获取冷跟注建议（面对加注时的跟注范围）
 */
export function getCallVsRaiseAdvice(
  position: Position,
  hand: string[]
): GTOAdvice[] {
  try {
    const handNotation = getStandardHandNotation(hand)
    const callRanges = rangeData.callVsRaise[position]

    if (!callRanges) {
      return [{ action: "fold", frequency: 1 }]
    }

    const advices: GTOAdvice[] = []

    if (isHandInRange(handNotation, callRanges.call)) {
      advices.push({ action: "call", frequency: 0.7 })
    }

    if (advices.length === 0) {
      advices.push({ action: "fold", frequency: 1 })
    }

    return advices
  } catch {
    return [{ action: "fold", frequency: 1 }]
  }
}

/**
 * 获取某个位置的所有范围（用于对手模拟）
 *
 * @param position 位置
 * @param action 动作类型
 * @returns 手牌组合列表
 */
export function getRangeByPosition(
  position: Position,
  action: GTOAction
): string[] {
  try {
    const positionRanges = rangeData.ranges[position]
    if (!positionRanges) return []

    if (action === "raise") return positionRanges.raise
    if (action === "call") return positionRanges.call
    if (action === "fold") return positionRanges.fold

    return []
  } catch {
    return []
  }
}

/**
 * 随机选择位置（用于对手模拟）
 */
export function getRandomPosition(): Position {
  const positions: Position[] = ["UTG", "MP", "CO", "BTN", "SB", "BB"]
  return positions[Math.floor(Math.random() * positions.length)]
}

/**
 * 获取加注大小（以 BB 为单位）
 */
function getRaiseSize(position: Position): number {
  switch (position) {
    case "UTG":
    case "MP":
      return 2.5
    case "CO":
    case "BTN":
      return 2.5
    case "SB":
      return 3
    case "BB":
      return 3.5
    default:
      return 2.5
  }
}

/**
 * 获取 3-bet 大小（以 BB 为单位）
 */
function getThreeBetSize(position: Position): number {
  switch (position) {
    case "UTG":
    case "MP":
      return 3
    case "CO":
    case "BTN":
      return 3.5
    case "SB":
      return 4
    case "BB":
      return 4.5
    default:
      return 3.5
  }
}

/**
 * 随机选择一个 GTO 建议（按频率加权）
 */
export function selectRandomAdvice(adviceList: GTOAdvice[]): GTOAdvice {
  return selectActionByFrequency(adviceList)
}
