/**
 * 赔率计算引擎（OddsCalculator）
 *
 * 职责：计算手牌胜率（Equity）、底池赔率（Pot Odds）、期望值（EV）
 *
 * 实现：使用 Monte Carlo 模拟进行手牌胜率计算
 * - Preflop/Flop/Turn: Monte Carlo 模拟（默认1000次迭代）
 * - River: 精确枚举所有对手底牌组合（C(45,2) = 990种）
 *
 * 外部依赖：无（纯 TypeScript 实现）
 */

import type { EquityResult } from "./types"
import { monteCarloEquity, trackEquityAcrossStreets } from "./monte-carlo"
import { getHandName, normalizeCard } from "./hand-evaluator"

// Re-export for backward compatibility with coach-service.ts and postflop-strategy.ts
export { getHandName, trackEquityAcrossStreets }

/**
 * 计算手牌 vs 对手范围的胜率
 *
 * @param holeCards 底牌，如 ["Ah", "Kd"]
 * @param boardCards 公共牌（可为空，支持0-5张）
 * @param opponentRange 对手范围（可选，为空时使用随机手牌）
 */
export function calculateEquity(
  holeCards: string[],
  boardCards: string[] = [],
  opponentRange?: string[]
): EquityResult {
  try {
    const normalizedHole = holeCards.map(normalizeCard)
    const normalizedBoard = boardCards.map(normalizeCard)

    return monteCarloEquity(normalizedHole, normalizedBoard, opponentRange)
  } catch {
    return { win: 0, tie: 0, equity: 0 }
  }
}

/**
 * 计算底池赔率
 *
 * @param potSize 当前底池
 * @param callAmount 需要跟注的金额
 * @returns 底池赔率（如 0.33 表示 33%）
 */
export function calculatePotOdds(potSize: number, callAmount: number): number {
  try {
    if (callAmount <= 0) return 0
    if (potSize <= 0) return 1
    return callAmount / (potSize + callAmount)
  } catch {
    return 0
  }
}

/**
 * 计算期望值
 *
 * @param equity 胜率
 * @param potSize 底池
 * @param callAmount 跟注金额
 * @returns EV（正数表示+EV决策）
 */
export function calculateEV(equity: number, potSize: number, callAmount: number): number {
  try {
    const winAmount = potSize - callAmount
    return equity * winAmount - (1 - equity) * callAmount
  } catch {
    return 0
  }
}

/**
 * 判断决策是否为 +EV
 */
export function isPositiveEV(equity: number, potOdds: number): boolean {
  return equity > potOdds
}
