/**
 * @deprecated This service has no active consumers as of 2026-06-25. Keep for future use or remove if unused after 2026-09-25.
 */

// ========================================================================
// statistics-service.ts — Advanced player analytics and season reports
//
// BOUNDARY (vs stats-service.ts):
//   statistics-service  → "analytics" for reports: rankings, season
//                          summaries, player trends (time-series),
//                          head-to-head, streaks, consistency analysis.
//                          Pure functions, no side effects.
//   stats-service       → "live" stats for UI: nemeses/allies per player,
//                          season comparison, attendance board, clear
//                          board. Mixes computeStats from @/lib/stats
//                          with in-memory filtering.
//
// NOTE: buildPlayerAggMap below is a private aggregation helper that
// duplicates some of the logic in @/lib/stats.computeStats(). Neither
// is a strict superset; they group data differently (per-player scores
// array + session count vs per-season aggregations). Keeping both is
// acceptable — the duplication is in ~80 lines, and untangling them
// would touch both consumers without a functional win.
//
// CACHING: All exported functions are pure — same inputs always produce
// same outputs. Callers SHOULD memoize at the component/hook level with
// React.useMemo or WeakMap keyed on the records array reference.
// Statistics-service does NOT cache internally because the records
// array reference is the caller's responsibility and varies across
// calls (different season filters, date ranges, etc.).
// ========================================================================

import type { PokerRecord, Season } from "@/lib/types"

// ==================== Types ====================

export interface PlayerRanking {
  player: string
  rank: number
  totalScore: number
  gamesPlayed: number
  avgScore: number
  winRate: number
  sessionCount: number
  bestScore: number
  worstScore: number
  longestStreak: number
  trend: "up" | "down" | "stable"
  recentAvg: number
}

export interface SeasonSummary {
  seasonId: string
  seasonName: string
  totalGames: number
  totalSessions: number
  totalPlayers: number
  topPlayer: string
  topScore: number
  mvpAvgScore: number
  durationDays: number
  avgScorePerPlayer: number
  avgScorePerGame: number
  positiveRate: number
}

export interface PlayerTrendPoint {
  date: string
  score: number
  cumulative: number
  movingAvg3: number
  movingAvg5: number
}

export interface PlayerTrend {
  player: string
  points: PlayerTrendPoint[]
  volatility: number
  startDate: string
  endDate: string
  totalScore: number
  netAverage: number
}

export interface HeadToHeadRecord {
  playerA: string
  playerB: string
  gamesTogether: number
  aWins: number
  bWins: number
  aTotalScore: number
  bTotalScore: number
  aWinRate: number
  bWinRate: number
  aAvgScore: number
  bAvgScore: number
}

export interface StreakInfo {
  player: string
  currentStreak: number
  currentDirection: "winning" | "losing" | "neutral"
  longestWinningStreak: number
  longestLosingStreak: number
}

export interface PlayerConsistency {
  player: string
  gamesPlayed: number
  stdDev: number
  coefficientOfVariation: number
  scoreRange: number
  consistencyLabel: "stable" | "moderate" | "volatile"
}

// ==================== Rankings ====================

type RankingMetric = "total" | "avg" | "winRate" | "games" | "streak"

/**
 * 玩家排名计算
 * 支持按累计积分、场均、胜率、参赛次数、连胜纪录排序
 */
export function computePlayerRankings(
  records: PokerRecord[],
  sortBy: RankingMetric = "total"
): PlayerRanking[] {
  const playerMap = buildPlayerAggMap(records)
  const players = Object.keys(playerMap)

  const rankings: PlayerRanking[] = players.map((name) => {
    const p = playerMap[name]
    const totalGames = p.games
    const winRate = totalGames > 0 ? (p.wins / totalGames) * 100 : 0
    const avgScore = totalGames > 0 ? Math.round(p.total / totalGames) : 0

    // Recent performance (last 5 games)
    const recentScores = p.scores.slice(-5)
    const recentAvg =
      recentScores.length > 0
        ? Math.round(recentScores.reduce((a, b) => a + b, 0) / recentScores.length)
        : 0

    // Trend: compare recent avg to overall avg
    const trend = computeTrend(avgScore, recentAvg)

    return {
      player: name,
      rank: 0, // will be set after sorting
      totalScore: p.total,
      gamesPlayed: totalGames,
      avgScore,
      winRate: Math.round(winRate * 10) / 10,
      sessionCount: p.sessionCount,
      bestScore: p.maxWin,
      worstScore: p.maxLoss,
      longestStreak: p.longestStreak,
      trend,
      recentAvg,
    }
  })

  // Sort and assign ranks
  rankings.sort((a, b) => {
    const cmp = compareByMetric(a, b, sortBy)
    if (cmp !== 0) return cmp
    // Tie-breaker: total score
    return b.totalScore - a.totalScore
  })

  rankings.forEach((r, i) => {
    r.rank = i + 1
  })

  return rankings
}

// ==================== Season Summary ====================

/**
 * 赛季摘要统计
 * 提供赛季级别的聚合视图
 */
export function computeSeasonSummary(
  records: PokerRecord[],
  season: Season
): SeasonSummary | null {
  if (records.length === 0 || !season) return null

  const playerMap = buildPlayerAggMap(records)
  const players = Object.keys(playerMap)
  const dates = [...new Set(records.map((r) => r.date))].sort()

  // Top player by total score
  const sorted = players
    .map((name) => ({ name, total: playerMap[name].total, avg: playerMap[name].total / playerMap[name].games }))
    .sort((a, b) => b.total - a.total)
  const topPlayer = sorted[0]

  // Total score (sum of absolute values, or could be net)
  const totalScore = records.reduce((sum, r) => sum + Math.abs(r.score), 0)
  const positiveGames = records.filter((r) => r.score > 0).length
  const positiveRate = records.length > 0 ? (positiveGames / records.length) * 100 : 0

  // Duration
  const startDate = new Date(season.startDate)
  const endDate = season.endDate ? new Date(season.endDate) : new Date()
  const durationDays = Math.max(
    1,
    Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  )

  return {
    seasonId: season.id,
    seasonName: season.name,
    totalGames: records.length,
    totalSessions: dates.length,
    totalPlayers: players.length,
    topPlayer: topPlayer.name,
    topScore: topPlayer.total,
    mvpAvgScore: Math.round(topPlayer.avg),
    durationDays,
    avgScorePerPlayer: players.length > 0 ? Math.round(totalScore / players.length) : 0,
    avgScorePerGame: Math.round(totalScore / records.length),
    positiveRate: Math.round(positiveRate * 10) / 10,
  }
}

// ==================== Player Trend ====================

/**
 * 选手趋势分析
 * 计算时序数据：累计积分、移动平均线、波动率
 */
export function computePlayerTrend(
  player: string,
  records: PokerRecord[]
): PlayerTrend | null {
  const playerRecords = records
    .filter((r) => r.player === player)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  if (playerRecords.length === 0) return null

  let cum = 0
  const scores = playerRecords.map((r) => r.score)
  const points: PlayerTrendPoint[] = playerRecords.map((r, i) => {
    cum += r.score
    const window3 = scores.slice(Math.max(0, i - 2), i + 1)
    const window5 = scores.slice(Math.max(0, i - 4), i + 1)
    return {
      date: r.date,
      score: r.score,
      cumulative: cum,
      movingAvg3: Math.round((window3.reduce((a, b) => a + b, 0) / window3.length) * 10) / 10,
      movingAvg5: Math.round((window5.reduce((a, b) => a + b, 0) / window5.length) * 10) / 10,
    }
  })

  const volatility = computeVolatility(scores)
  const netAverage = Math.round(cum / scores.length)

  return {
    player,
    points,
    volatility: Math.round(volatility * 10) / 10,
    startDate: playerRecords[0].date,
    endDate: playerRecords[playerRecords.length - 1].date,
    totalScore: cum,
    netAverage,
  }
}

// ==================== Head-to-Head ====================

/**
 * 选手对阵统计
 * 比较两个选手同时参赛时的表现
 */
export function computeHeadToHead(
  records: PokerRecord[],
  players: [string, string]
): HeadToHeadRecord | null {
  const [playerA, playerB] = players

  // Group records by date to find sessions where both played
  const byDate: Record<string, PokerRecord[]> = {}
  for (const r of records) {
    if (r.player === playerA || r.player === playerB) {
      if (!byDate[r.date]) byDate[r.date] = []
      byDate[r.date].push(r)
    }
  }

  // Find dates where both players have records
  const sharedDates = Object.entries(byDate)
    .filter(([_, recs]) => {
      const aPlays = recs.some((r) => r.player === playerA)
      const bPlays = recs.some((r) => r.player === playerB)
      return aPlays && bPlays
    })
    .map(([date]) => date)

  if (sharedDates.length === 0) return null

  let aWins = 0
  let bWins = 0
  let aTotal = 0
  let bTotal = 0

  for (const date of sharedDates) {
    const dayRecords = records.filter((r) => r.date === date && (r.player === playerA || r.player === playerB))
    for (const r of dayRecords) {
      if (r.player === playerA) {
        aTotal += r.score
        if (r.score > 0) aWins++
      } else {
        bTotal += r.score
        if (r.score > 0) bWins++
      }
    }
  }

  return {
    playerA,
    playerB,
    gamesTogether: sharedDates.length,
    aWins,
    bWins,
    aTotalScore: aTotal,
    bTotalScore: bTotal,
    aWinRate: Math.round((aWins / Math.max(1, sharedDates.length)) * 100 * 10) / 10,
    bWinRate: Math.round((bWins / Math.max(1, sharedDates.length)) * 100 * 10) / 10,
    aAvgScore: Math.round(aTotal / Math.max(1, sharedDates.length)),
    bAvgScore: Math.round(bTotal / Math.max(1, sharedDates.length)),
  }
}

// ==================== Streaks ====================

/**
 * 连胜/连败分析
 * 计算当前连胜/连败、历史最长连胜/连败
 */
export function computePlayerStreaks(
  records: PokerRecord[]
): StreakInfo[] {
  const playerMap = buildPlayerAggMap(records)
  const players = Object.keys(playerMap)

  return players.map((name) => {
    const p = playerMap[name]
    const sorted = p.scores

    // Current streak (from most recent game)
    let currentStreak = 0
    let currentDirection: "winning" | "losing" | "neutral" = "neutral"

    if (sorted.length > 0) {
      const lastScore = sorted[sorted.length - 1]
      if (lastScore > 0) {
        currentDirection = "winning"
        for (let i = sorted.length - 1; i >= 0; i--) {
          if (sorted[i] > 0) currentStreak++
          else break
        }
      } else if (lastScore < 0) {
        currentDirection = "losing"
        for (let i = sorted.length - 1; i >= 0; i--) {
          if (sorted[i] < 0) currentStreak++
          else break
        }
      }
    }

    // Longest winning streak (by score, not by date)
    let longestWinning = 0
    let winCount = 0
    let longestLosing = 0
    let loseCount = 0
    for (const s of sorted) {
      if (s > 0) {
        winCount++
        longestWinning = Math.max(longestWinning, winCount)
        loseCount = 0
      } else if (s < 0) {
        loseCount++
        longestLosing = Math.max(longestLosing, loseCount)
        winCount = 0
      } else {
        winCount = 0
        loseCount = 0
      }
    }

    return {
      player: name,
      currentStreak,
      currentDirection,
      longestWinningStreak: longestWinning,
      longestLosingStreak: longestLosing,
    }
  })
}

// ==================== Consistency ====================

/**
 * 选手稳定性分析
 * 基于标准差和变异系数评估发挥稳定性
 */
export function computePlayerConsistency(
  records: PokerRecord[]
): PlayerConsistency[] {
  const playerMap = buildPlayerAggMap(records)

  return Object.entries(playerMap).map(([player, data]) => {
    const scores = data.scores
    const stdDev = computeStdDev(scores)
    const mean = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
    const coefficientOfVariation = mean !== 0 ? stdDev / Math.abs(mean) : 0
    const scoreRange = data.maxWin - data.maxLoss

    let consistencyLabel: "stable" | "moderate" | "volatile"
    if (coefficientOfVariation < 1.5) consistencyLabel = "stable"
    else if (coefficientOfVariation < 3.0) consistencyLabel = "moderate"
    else consistencyLabel = "volatile"

    return {
      player,
      gamesPlayed: data.games,
      stdDev: Math.round(stdDev * 10) / 10,
      coefficientOfVariation: Math.round(coefficientOfVariation * 100) / 100,
      scoreRange,
      consistencyLabel,
    }
  })
}

// ==================== Internal Helpers ====================

interface PlayerAgg {
  total: number
  wins: number
  scores: number[]
  games: number
  maxWin: number
  maxLoss: number
  sessionCount: number
  longestStreak: number
}

function buildPlayerAggMap(records: PokerRecord[]): Record<string, PlayerAgg> {
  const map: Record<string, PlayerAgg> = {}

  // First pass: collect all records grouped by player, ordered by date
  const byPlayer: Record<string, PokerRecord[]> = {}
  for (const r of records) {
    if (!byPlayer[r.player]) byPlayer[r.player] = []
    byPlayer[r.player].push(r)
  }

  for (const [player, recs] of Object.entries(byPlayer)) {
    // Sort by date for streak calculation
    recs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    let total = 0
    let wins = 0
    const scores: number[] = []
    let maxWin = 0
    let maxLoss = 0
    const dates = new Set<string>()

    for (const r of recs) {
      total += r.score
      scores.push(r.score)
      if (r.score > 0) wins++
      maxWin = Math.max(maxWin, r.score)
      maxLoss = Math.min(maxLoss, r.score)
      dates.add(r.date)
    }

    // Longest winning streak by consecutive games (not dates)
    let longestStreak = 0
    let current = 0
    for (const s of scores) {
      if (s > 0) {
        current++
        longestStreak = Math.max(longestStreak, current)
      } else {
        current = 0
      }
    }

    map[player] = {
      total,
      wins,
      scores,
      games: scores.length,
      maxWin,
      maxLoss,
      sessionCount: dates.size,
      longestStreak,
    }
  }

  return map
}

function computeTrend(overallAvg: number, recentAvg: number): "up" | "down" | "stable" {
  if (overallAvg === 0 && recentAvg === 0) return "stable"
  if (overallAvg === 0) return recentAvg > 0 ? "up" : "down"

  const ratio = (recentAvg - overallAvg) / Math.abs(overallAvg)
  if (ratio > 0.15) return "up"
  if (ratio < -0.15) return "down"
  return "stable"
}

function compareByMetric(a: PlayerRanking, b: PlayerRanking, metric: RankingMetric): number {
  switch (metric) {
    case "total":
      return b.totalScore - a.totalScore
    case "avg":
      return b.avgScore - a.avgScore
    case "winRate":
      return b.winRate - a.winRate
    case "games":
      return b.gamesPlayed - a.gamesPlayed
    case "streak":
      return b.longestStreak - a.longestStreak
    default:
      return b.totalScore - a.totalScore
  }
}

function computeVolatility(scores: number[]): number {
  if (scores.length < 2) return 0
  const diffs: number[] = []
  for (let i = 1; i < scores.length; i++) {
    diffs.push(Math.abs(scores[i] - scores[i - 1]))
  }
  return diffs.reduce((a, b) => a + b, 0) / diffs.length
}

// NOTE: Duplicated in award-service.ts as standardDeviation. Both are local-only
// (this one is consumed internally; the other is in a live service). If this file
// is ever removed, promote the award-service version to @/lib/stats instead.
function computeStdDev(values: number[]): number {
  if (values.length < 2) return 0
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const sqDiffs = values.map((v) => (v - mean) ** 2)
  return Math.sqrt(sqDiffs.reduce((a, b) => a + b, 0) / values.length)
}
