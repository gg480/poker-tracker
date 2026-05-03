"use client"

import { cardRank, cardSuit, type Card, type Position, POSITIONS_FOR_N } from "./poker-engine"

export type PlayerStyle = "tight-strong" | "tight-weak" | "loose-strong" | "loose-weak" | "standard"

export const PLAYER_STYLE_LABEL: Record<PlayerStyle, string> = {
  "tight-strong": "紧凶",
  "tight-weak": "紧弱",
  "loose-strong": "松凶",
  "loose-weak": "松弱",
  standard: "标准",
}

export const PLAYER_STYLE_DESC: Record<PlayerStyle, string> = {
  "tight-strong": "窄范围，大尺度",
  "tight-weak": "窄范围，小尺度",
  "loose-strong": "宽范围，大尺度",
  "loose-weak": "宽范围，小尺度",
  standard: "GTO标准",
}

export interface GTOAction {
  action: "open" | "call" | "raise" | "3bet" | "4bet" | "fold" | "check"
  probability: number
  sizing?: { min: number; max: number }
}

export interface GTORecommendation {
  handScore: number
  percentile: number
  percentileLabel: string
  positionRange: number
  positionRangeLabel: string
  inRange: boolean
  actions: GTOAction[]
  notes: string
}

function chenScore(c1: Card, c2: Card): number {
  const r1 = cardRank(c1)
  const r2 = cardRank(c2)
  const high = Math.max(r1, r2)
  const low = Math.min(r1, r2)
  const suited = cardSuit(c1) === cardSuit(c2)
  const gap = high - low
  const isPair = r1 === r2

  let score = 0
  if (high === 14) score = 10
  else if (high === 13) score = 8
  else if (high === 12) score = 7
  else if (high === 11) score = 6
  else score = high / 2

  if (isPair) {
    score = Math.max(5, score * 2)
  }

  if (suited) score += 2

  if (!isPair) {
    if (gap === 1) score += 1
    else if (gap === 2) score += 0
    else if (gap === 3) score -= 1
    else if (gap >= 4) score -= 2

    if (high <= 12) {
      if (gap <= 1) score += 1
      else if (gap === 2) score += 0.5
    }
  }

  return score
}

function chenToPercentile(score: number): number {
  if (score >= 18) return 0.5
  if (score >= 16) return 1
  if (score >= 14) return 2
  if (score >= 12) return 4
  if (score >= 11) return 6
  if (score >= 10) return 9
  if (score >= 9) return 13
  if (score >= 8) return 18
  if (score >= 7) return 24
  if (score >= 6) return 32
  if (score >= 5) return 40
  if (score >= 4) return 50
  if (score >= 3) return 60
  if (score >= 2) return 72
  if (score >= 1) return 84
  return 95
}

function getPositionRangePct(position: Position, numPlayers: number): number {
  const positions = POSITIONS_FOR_N[numPlayers] || POSITIONS_FOR_N[6]
  const idx = positions.indexOf(position)
  const len = positions.length

  if (position === "BB") return 0.55
  if (position === "SB") return 0.38
  if (position === "BTN") return 0.45

  const fromEarly = idx / (len - 1)
  const baseRange = 0.12 + fromEarly * 0.25
  return Math.min(0.45, Math.max(0.12, baseRange))
}

function applyStyleModifier(range: number, style: PlayerStyle): number {
  switch (style) {
    case "tight-strong": return range * 0.75
    case "tight-weak": return range * 0.8
    case "loose-strong": return range * 1.3
    case "loose-weak": return range * 1.25
    default: return range
  }
}

function applySizingModifier(baseSizing: { min: number; max: number }, style: PlayerStyle): { min: number; max: number } {
  const r = (n: number) => Math.round(n * 10) / 10
  switch (style) {
    case "tight-strong": return { min: r(baseSizing.min * 1.2), max: r(baseSizing.max * 1.2) }
    case "tight-weak": return { min: r(baseSizing.min * 0.85), max: r(baseSizing.max * 0.85) }
    case "loose-strong": return { min: r(baseSizing.min * 1.3), max: r(baseSizing.max * 1.3) }
    case "loose-weak": return { min: r(baseSizing.min * 0.9), max: r(baseSizing.max * 0.9) }
    default: return baseSizing
  }
}

function percentileLabel(pct: number): string {
  if (pct <= 1) return "前1%"
  if (pct <= 3) return "前3%"
  if (pct <= 5) return "前5%"
  if (pct <= 10) return "前10%"
  if (pct <= 15) return "前15%"
  if (pct <= 20) return "前20%"
  if (pct <= 30) return "前30%"
  if (pct <= 40) return "前40%"
  if (pct <= 50) return "前50%"
  return "后50%"
}

function handCategory(c1: Card, c2: Card): string {
  const r1 = cardRank(c1)
  const r2 = cardRank(c2)
  const high = Math.max(r1, r2)
  const low = Math.min(r1, r2)
  const suited = cardSuit(c1) === cardSuit(c2)
  const R = { 14: "A", 13: "K", 12: "Q", 11: "J", 10: "T" } as Record<number, string>

  const hr = R[high] || String(high)
  const lr = R[low] || String(low)

  if (r1 === r2) return `${hr}${hr}`
  return `${hr}${lr}${suited ? "s" : "o"}`
}

export function getGTORecommendation(
  heroCards: [Card, Card],
  heroPosition: Position,
  numPlayers: number,
  playerStyle: PlayerStyle = "standard",
  facingAction?: "open" | "raise" | "3bet",
  facingPosition?: Position,
): GTORecommendation {
  const [c1, c2] = heroCards
  const score = chenScore(c1, c2)
  const pct = chenToPercentile(score)
  const baseRange = getPositionRangePct(heroPosition, numPlayers)
  const adjustedRange = applyStyleModifier(baseRange, playerStyle)
  const inRange = pct <= adjustedRange
  const hand = handCategory(c1, c2)

  const actions: GTOAction[] = []

  if (!facingAction) {
    if (heroPosition === "BB") {
      if (inRange) {
        actions.push({ action: "check", probability: 70, sizing: { min: 0, max: 0 } })
        actions.push({ action: "raise", probability: 30, sizing: applySizingModifier({ min: 3, max: 4 }, playerStyle) })
      } else {
        actions.push({ action: "check", probability: 100 })
      }
    } else {
      if (pct <= 3) {
        actions.push({ action: "open", probability: 95, sizing: applySizingModifier({ min: 2.5, max: 3.5 }, playerStyle) })
        actions.push({ action: "fold", probability: 5 })
      } else if (pct <= 6) {
        actions.push({ action: "open", probability: 85, sizing: applySizingModifier({ min: 2.5, max: 3 }, playerStyle) })
        actions.push({ action: "fold", probability: 15 })
      } else if (inRange) {
        const openProb = Math.max(50, Math.round(100 - (pct / adjustedRange) * 60))
        actions.push({ action: "open", probability: openProb, sizing: applySizingModifier({ min: 2, max: 3 }, playerStyle) })
        actions.push({ action: "fold", probability: 100 - openProb })
      } else {
        actions.push({ action: "fold", probability: 80 })
        actions.push({ action: "open", probability: 20, sizing: applySizingModifier({ min: 2, max: 2.5 }, playerStyle) })
      }
    }
  } else if (facingAction === "open") {
    const raiserRange = facingPosition
      ? applyStyleModifier(getPositionRangePct(facingPosition, numPlayers), playerStyle)
      : 0.2

    if (pct <= 2) {
      actions.push({ action: "3bet", probability: 80, sizing: applySizingModifier({ min: 3, max: 3.5 }, playerStyle) })
      actions.push({ action: "call", probability: 20 })
    } else if (pct <= 5) {
      actions.push({ action: "3bet", probability: 55, sizing: applySizingModifier({ min: 3, max: 3.5 }, playerStyle) })
      actions.push({ action: "call", probability: 40 })
      actions.push({ action: "fold", probability: 5 })
    } else if (pct <= raiserRange * 0.6) {
      actions.push({ action: "call", probability: 55 })
      actions.push({ action: "3bet", probability: 30, sizing: applySizingModifier({ min: 3, max: 3.5 }, playerStyle) })
      actions.push({ action: "fold", probability: 15 })
    } else if (pct <= raiserRange) {
      const callProb = Math.max(20, Math.round(60 - (pct / raiserRange) * 40))
      actions.push({ action: "call", probability: callProb })
      actions.push({ action: "fold", probability: 100 - callProb })
      if (pct <= raiserRange * 0.8) {
        actions.push({ action: "3bet", probability: Math.round(15 * (1 - pct / raiserRange)), sizing: applySizingModifier({ min: 3, max: 3.5 }, playerStyle) })
      }
    } else {
      actions.push({ action: "fold", probability: 85 })
      actions.push({ action: "call", probability: 15 })
    }
  } else if (facingAction === "raise" || facingAction === "3bet") {
    if (pct <= 1) {
      actions.push({ action: "4bet", probability: 70, sizing: applySizingModifier({ min: 2.5, max: 3 }, playerStyle) })
      actions.push({ action: "call", probability: 30 })
    } else if (pct <= 3) {
      actions.push({ action: "4bet", probability: 40, sizing: applySizingModifier({ min: 2.5, max: 3 }, playerStyle) })
      actions.push({ action: "call", probability: 50 })
      actions.push({ action: "fold", probability: 10 })
    } else if (pct <= 8) {
      actions.push({ action: "call", probability: 55 })
      actions.push({ action: "fold", probability: 35 })
      actions.push({ action: "4bet", probability: 10, sizing: applySizingModifier({ min: 2.5, max: 3 }, playerStyle) })
    } else if (pct <= 15) {
      actions.push({ action: "fold", probability: 60 })
      actions.push({ action: "call", probability: 40 })
    } else {
      actions.push({ action: "fold", probability: 90 })
      actions.push({ action: "call", probability: 10 })
    }
  }

  const totalProb = actions.reduce((s, a) => s + a.probability, 0)
  if (totalProb > 0) {
    for (const a of actions) {
      a.probability = Math.round((a.probability / totalProb) * 100)
    }
    const diff = 100 - actions.reduce((s, a) => s + a.probability, 0)
    actions[0].probability += diff
  }

  let notes = ""
  if (pct <= 1) {
    notes = `${hand} 是翻前顶级手牌，任何位置都应积极入池`
  } else if (pct <= 3) {
    notes = `${hand} 是翻前强牌，${heroPosition}位置应积极加注`
  } else if (inRange) {
    notes = `${hand} 在${heroPosition}位置的GTO范围内，可入池`
  } else {
    notes = `${hand} 不在${heroPosition}位置的标准范围内，建议弃牌`
  }

  if (playerStyle !== "standard") {
    const styleNote = playerStyle.startsWith("tight") ? "紧" : "松"
    notes += `（${styleNote}型玩家${playerStyle.startsWith("tight") ? "收窄" : "放宽"}了范围）`
  }

  return {
    handScore: Math.min(100, Math.round((score / 20) * 100)),
    percentile: Math.round(pct),
    percentileLabel: percentileLabel(pct),
    positionRange: Math.round(adjustedRange * 100),
    positionRangeLabel: `${heroPosition} Open ~${Math.round(adjustedRange * 100)}%`,
    inRange,
    actions,
    notes,
  }
}

export const ACTION_LABEL: Record<GTOAction["action"], string> = {
  open: "加注入池",
  call: "跟注",
  raise: "加注",
  "3bet": "3-bet",
  "4bet": "4-bet",
  fold: "弃牌",
  check: "过牌",
}

export const ACTION_COLOR: Record<GTOAction["action"], string> = {
  open: "text-emerald-400",
  call: "text-blue-400",
  raise: "text-emerald-400",
  "3bet": "text-amber-400",
  "4bet": "text-red-400",
  fold: "text-red-400",
  check: "text-slate-400",
}
