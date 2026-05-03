import type { PokerRecord, PlayerSettlement, ComputedStats, PlayerStats } from "@/lib/types"
import { computeStats } from "@/lib/stats"
import { AWARD_CATEGORIES, MIN_GAMES_FOR_AWARD } from "@/lib/constants"

export interface AwardDefinition {
  key: string
  title: string
  icon: string
  category: string
  description: string
  compute: (stats: ComputedStats, settlements: PlayerSettlement[]) => { winner: string; value: string } | null
}

function standardDeviation(arr: number[]): number {
  if (arr.length === 0) return 0
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length
  return Math.sqrt(arr.reduce((s, v) => s + (v - mean) ** 2, 0) / arr.length)
}

export const AWARD_DEFINITIONS: AwardDefinition[] = [
  {
    key: "champion",
    title: "赛季冠军",
    icon: "🏆",
    category: AWARD_CATEGORIES.WINNER,
    description: "最高累计积分",
    compute: (stats) => {
      const eligible = stats.players.filter((p) => p.games >= MIN_GAMES_FOR_AWARD)
      if (eligible.length === 0) return null
      const winner = [...eligible].sort((a, b) => b.total - a.total)[0]
      return { winner: winner.name, value: `${winner.total > 0 ? "+" : ""}${winner.total.toLocaleString()}` }
    },
  },
  {
    key: "wealthStar",
    title: "财富之星",
    icon: "💰",
    category: AWARD_CATEGORIES.WINNER,
    description: "单日最高得分",
    compute: (stats) => {
      const eligible = stats.players.filter((p) => p.games >= MIN_GAMES_FOR_AWARD)
      if (eligible.length === 0) return null
      const winner = [...eligible].sort((a, b) => b.maxWin - a.maxWin)[0]
      return { winner: winner.name, value: `+${winner.maxWin.toLocaleString()}` }
    },
  },
  {
    key: "mostImproved",
    title: "进步最快",
    icon: "📈",
    category: AWARD_CATEGORIES.WINNER,
    description: "近期趋势最强劲",
    compute: (stats) => {
      const eligible = stats.players.filter((p) => p.games >= MIN_GAMES_FOR_AWARD)
      if (eligible.length === 0) return null
      let best = eligible[0]
      let bestRecent = -Infinity
      for (const p of eligible) {
        const recent = p.scores.slice(-3)
        const recentAvg = recent.length > 0 ? recent.reduce((a, b) => a + b, 0) / recent.length : 0
        if (recentAvg > bestRecent) { bestRecent = recentAvg; best = p }
      }
      return { winner: best.name, value: `近3场均+${Math.round(bestRecent)}` }
    },
  },
  {
    key: "winRateKing",
    title: "胜率之王",
    icon: "👑",
    category: AWARD_CATEGORIES.WINNER,
    description: "最高胜率",
    compute: (stats) => {
      const eligible = stats.players.filter((p) => p.games >= MIN_GAMES_FOR_AWARD)
      if (eligible.length === 0) return null
      const winner = [...eligible].sort((a, b) => parseFloat(b.winRate) - parseFloat(a.winRate))[0]
      return { winner: winner.name, value: `${winner.winRate}%` }
    },
  },
  {
    key: "streakKing",
    title: "最长连胜",
    icon: "🔥",
    category: AWARD_CATEGORIES.WINNER,
    description: "最长连胜记录",
    compute: (stats) => {
      const eligible = stats.players.filter((p) => p.games >= MIN_GAMES_FOR_AWARD)
      if (eligible.length === 0) return null
      const winner = [...eligible].sort((a, b) => b.longestWinStreak - a.longestWinStreak)[0]
      return { winner: winner.name, value: `${winner.longestWinStreak}连` }
    },
  },
  {
    key: "avgKing",
    title: "场均王者",
    icon: "💎",
    category: AWARD_CATEGORIES.WINNER,
    description: "场均得分最高",
    compute: (stats) => {
      const eligible = stats.players.filter((p) => p.games >= MIN_GAMES_FOR_AWARD)
      if (eligible.length === 0) return null
      const winner = [...eligible].sort((a, b) => b.avgScore - a.avgScore)[0]
      return { winner: winner.name, value: `${winner.avgScore > 0 ? "+" : ""}${winner.avgScore.toLocaleString()}` }
    },
  },
  {
    key: "phoenix",
    title: "凤凰涅槃",
    icon: "🦅",
    category: AWARD_CATEGORIES.LOSER,
    description: "最大逆转（单日从负到正）",
    compute: (stats) => {
      const eligible = stats.players.filter((p) => p.games >= MIN_GAMES_FOR_AWARD)
      if (eligible.length === 0) return null
      let best = eligible[0]
      let bestComeback = 0
      for (const p of eligible) {
        const minScore = Math.min(...p.scores)
        const maxScore = Math.max(...p.scores)
        const comeback = maxScore - minScore
        if (comeback > bestComeback && minScore < 0 && maxScore > 0) { bestComeback = comeback; best = p }
      }
      if (bestComeback === 0) return null
      return { winner: best.name, value: `逆转${bestComeback.toLocaleString()}` }
    },
  },
  {
    key: "neverGiveUp",
    title: "永不言弃",
    icon: "💪",
    category: AWARD_CATEGORIES.LOSER,
    description: "输最多但坚持出场",
    compute: (stats) => {
      const eligible = stats.players.filter((p) => p.games >= MIN_GAMES_FOR_AWARD && p.total < 0)
      if (eligible.length === 0) return null
      const winner = [...eligible].sort((a, b) => b.games - a.games)[0]
      return { winner: winner.name, value: `${winner.games}场坚持` }
    },
  },
  {
    key: "catchUpStar",
    title: "追赶之星",
    icon: "🌟",
    category: AWARD_CATEGORIES.LOSER,
    description: "近期回升最多",
    compute: (stats) => {
      const eligible = stats.players.filter((p) => p.games >= MIN_GAMES_FOR_AWARD)
      if (eligible.length === 0) return null
      let best = eligible[0]
      let bestImprove = -Infinity
      for (const p of eligible) {
        if (p.scores.length < 4) continue
        const early = p.scores.slice(0, Math.floor(p.scores.length / 2))
        const late = p.scores.slice(Math.floor(p.scores.length / 2))
        const earlyAvg = early.reduce((a, b) => a + b, 0) / early.length
        const lateAvg = late.reduce((a, b) => a + b, 0) / late.length
        const improve = lateAvg - earlyAvg
        if (improve > bestImprove) { bestImprove = improve; best = p }
      }
      return { winner: best.name, value: `回升${Math.round(bestImprove)}` }
    },
  },
  {
    key: "goodPartner",
    title: "好搭档",
    icon: "🤝",
    category: AWARD_CATEGORIES.LOSER,
    description: "同场出现次数最多的玩家组合",
    compute: (stats) => {
      const pairs: Record<string, number> = {}
      for (const recs of Object.values(stats.dateMap)) {
        const names = [...new Set(recs.map((r) => r.player))].sort()
        for (let i = 0; i < names.length; i++) {
          for (let j = i + 1; j < names.length; j++) {
            const key = `${names[i]}&${names[j]}`
            pairs[key] = (pairs[key] || 0) + 1
          }
        }
      }
      const sorted = Object.entries(pairs).sort((a, b) => b[1] - a[1])
      if (sorted.length === 0) return null
      return { winner: sorted[0][0].replace("&", " & "), value: `${sorted[0][1]}次同场` }
    },
  },
  {
    key: "fullAttendance",
    title: "全勤奖",
    icon: "🎯",
    category: AWARD_CATEGORIES.LOSER,
    description: "出勤率最高",
    compute: (stats) => {
      if (stats.totalGames === 0) return null
      const eligible = stats.players.filter((p) => p.games >= MIN_GAMES_FOR_AWARD)
      if (eligible.length === 0) return null
      const winner = [...eligible].sort((a, b) => b.sessionCount - a.sessionCount)[0]
      const rate = ((winner.sessionCount / stats.totalGames) * 100).toFixed(0)
      return { winner: winner.name, value: `${rate}%出勤` }
    },
  },
  {
    key: "badLuck",
    title: "运气欠佳",
    icon: "🎲",
    category: AWARD_CATEGORIES.LOSER,
    description: "波动最大（标准差最高）",
    compute: (stats) => {
      const eligible = stats.players.filter((p) => p.games >= MIN_GAMES_FOR_AWARD)
      if (eligible.length === 0) return null
      const winner = [...eligible].sort((a, b) => standardDeviation(b.scores) - standardDeviation(a.scores))[0]
      return { winner: winner.name, value: `σ=${Math.round(standardDeviation(winner.scores))}` }
    },
  },
  {
    key: "sportsmanship",
    title: "风度奖",
    icon: "🎩",
    category: AWARD_CATEGORIES.SPECIAL,
    description: "请吃饭清分最多",
    compute: (stats, settlements) => {
      const settleMap: Record<string, number> = {}
      for (const s of settlements) {
        settleMap[s.player] = (settleMap[s.player] || 0) + s.settleScore
      }
      const sorted = Object.entries(settleMap).sort((a, b) => b[1] - a[1])
      if (sorted.length === 0) return null
      return { winner: sorted[0][0], value: `${sorted[0][1].toLocaleString()}分` }
    },
  },
  {
    key: "recordStar",
    title: "记录之星",
    icon: "📝",
    category: AWARD_CATEGORIES.SPECIAL,
    description: "参与场次最多",
    compute: (stats) => {
      const eligible = stats.players.filter((p) => p.games >= MIN_GAMES_FOR_AWARD)
      if (eligible.length === 0) return null
      const winner = [...eligible].sort((a, b) => b.sessionCount - a.sessionCount)[0]
      return { winner: winner.name, value: `${winner.sessionCount}场` }
    },
  },
  {
    key: "atmosphere",
    title: "气氛组",
    icon: "🎉",
    category: AWARD_CATEGORIES.SPECIAL,
    description: "大起大落最戏剧",
    compute: (stats) => {
      const eligible = stats.players.filter((p) => p.games >= MIN_GAMES_FOR_AWARD)
      if (eligible.length === 0) return null
      const winner = [...eligible].sort((a, b) => {
        const rangeA = a.maxWin - a.maxLoss
        const rangeB = b.maxWin - b.maxLoss
        return rangeB - rangeA
      })[0]
      const range = winner.maxWin - winner.maxLoss
      return { winner: winner.name, value: `振幅${range.toLocaleString()}` }
    },
  },
]

export function computeExtendedAwards(
  stats: ComputedStats,
  settlements: PlayerSettlement[]
): { key: string; title: string; icon: string; category: string; description: string; winner: string; value: string }[] {
  const results: { key: string; title: string; icon: string; category: string; description: string; winner: string; value: string }[] = []

  for (const def of AWARD_DEFINITIONS) {
    const result = def.compute(stats, settlements)
    if (result) {
      results.push({
        key: def.key,
        title: def.title,
        icon: def.icon,
        category: def.category,
        description: def.description,
        winner: result.winner,
        value: result.value,
      })
    }
  }

  return results
}
