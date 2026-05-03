import type { PokerRecord, PlayerSettlement, ComputedStats, PlayerStats } from "@/lib/types"
import { computeStats } from "@/lib/stats"

export function computePlayerStats(
  playerName: string,
  records: PokerRecord[],
  settlements: PlayerSettlement[]
): {
  basic: PlayerStats | null
  seasonBreakdown: { seasonId: string; total: number; games: number; winRate: string }[]
  recentTrend: "up" | "down" | "stable"
  nemeses: { player: string; netScore: number }[]
  allies: { player: string; netScore: number }[]
} {
  const stats = computeStats(records)
  const player = stats.players.find((p) => p.name === playerName)
  if (!player) {
    return { basic: null, seasonBreakdown: [], recentTrend: "stable", nemeses: [], allies: [] }
  }

  const playerRecords = records.filter((r) => r.player === playerName)
  const seasonMap: Record<string, { total: number; games: number; wins: number }> = {}
  for (const r of playerRecords) {
    const sid = (r as any).seasonId || "unknown"
    if (!seasonMap[sid]) seasonMap[sid] = { total: 0, games: 0, wins: 0 }
    seasonMap[sid].total += r.score
    seasonMap[sid].games++
    if (r.score > 0) seasonMap[sid].wins++
  }
  const seasonBreakdown = Object.entries(seasonMap).map(([seasonId, data]) => ({
    seasonId,
    total: data.total,
    games: data.games,
    winRate: data.games > 0 ? ((data.wins / data.games) * 100).toFixed(1) : "0",
  }))

  const recentRecords = playerRecords.slice(-5)
  const recentTotal = recentRecords.reduce((s, r) => s + r.score, 0)
  const recentTrend: "up" | "down" | "stable" =
    recentTotal > 500 ? "up" : recentTotal < -500 ? "down" : "stable"

  const dateMap: Record<string, PokerRecord[]> = {}
  for (const r of records) {
    if (!dateMap[r.date]) dateMap[r.date] = []
    dateMap[r.date].push(r)
  }

  const coPlayerScores: Record<string, number> = {}
  for (const r of playerRecords) {
    const sameDay = dateMap[r.date] || []
    for (const other of sameDay) {
      if (other.player === playerName) continue
      coPlayerScores[other.player] = (coPlayerScores[other.player] || 0) + r.score
    }
  }

  const coPlayerGames: Record<string, number> = {}
  for (const r of playerRecords) {
    const sameDay = dateMap[r.date] || []
    for (const other of sameDay) {
      if (other.player === playerName) continue
      coPlayerGames[other.player] = (coPlayerGames[other.player] || 0) + 1
    }
  }

  const nemeses = Object.entries(coPlayerScores)
    .map(([player, netScore]) => ({ player, netScore: Math.round(netScore / (coPlayerGames[player] || 1)) }))
    .sort((a, b) => a.netScore - b.netScore)
    .slice(0, 3)

  const allies = Object.entries(coPlayerScores)
    .map(([player, netScore]) => ({ player, netScore: Math.round(netScore / (coPlayerGames[player] || 1)) }))
    .sort((a, b) => b.netScore - a.netScore)
    .slice(0, 3)

  return { basic: player, seasonBreakdown, recentTrend, nemeses, allies }
}

export function computeSeasonComparison(
  season1Records: PokerRecord[],
  season2Records: PokerRecord[]
): {
  players: {
    name: string
    season1Total: number
    season2Total: number
    diff: number
  }[]
} {
  const stats1 = computeStats(season1Records)
  const stats2 = computeStats(season2Records)

  const allNames = new Set([
    ...stats1.players.map((p) => p.name),
    ...stats2.players.map((p) => p.name),
  ])

  const players = [...allNames].map((name) => {
    const s1 = stats1.players.find((p) => p.name === name)
    const s2 = stats2.players.find((p) => p.name === name)
    const season1Total = s1?.total ?? 0
    const season2Total = s2?.total ?? 0
    return { name, season1Total, season2Total, diff: season2Total - season1Total }
  })

  return { players }
}

export function computeAttendanceBoard(
  records: PokerRecord[]
): { name: string; sessions: number; totalSessions: number; attendanceRate: string }[] {
  const stats = computeStats(records)
  const totalSessions = stats.totalGames

  return stats.players
    .map((p) => ({
      name: p.name,
      sessions: p.sessionCount,
      totalSessions,
      attendanceRate:
        totalSessions > 0
          ? ((p.sessionCount / totalSessions) * 100).toFixed(1)
          : "0",
    }))
    .sort((a, b) => b.sessions - a.sessions)
}

export function computeClearBoard(
  settlements: PlayerSettlement[]
): { name: string; clearCount: number; totalAmount: number }[] {
  const map: Record<string, { count: number; total: number }> = {}
  for (const s of settlements) {
    if (!map[s.player]) map[s.player] = { count: 0, total: 0 }
    if (s.settleScore > 0) {
      map[s.player].count++
      map[s.player].total += s.settleScore
    }
  }

  return Object.entries(map)
    .map(([name, data]) => ({ name, clearCount: data.count, totalAmount: data.total }))
    .sort((a, b) => b.totalAmount - a.totalAmount)
}
