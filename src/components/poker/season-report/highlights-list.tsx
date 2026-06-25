import type { ComputedStats, PokerRecord, PlayerSettlement } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles, Flame, Zap, Star, Crown, Utensils } from "lucide-react"

interface HighlightsListProps {
  stats: ComputedStats
  filteredRecords: PokerRecord[]
  settlements: PlayerSettlement[]
}

interface HighlightItemProps {
  icon: React.ReactNode
  title: string
  player: string
  value: string
  date?: string
  color: string
}

function HighlightItem({ icon, title, player, value, date, color }: HighlightItemProps) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/30">
      <div className={`p-2 rounded-lg ${color}`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{title}</p>
        <p className="text-sm font-medium truncate">{player}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-semibold">{value}</p>
        {date && <p className="text-xs text-muted-foreground/70">{date}</p>}
      </div>
    </div>
  )
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    return `${d.getMonth() + 1}/${d.getDate()}`
  } catch {
    return dateStr
  }
}

export function HighlightsList({ stats, filteredRecords, settlements }: HighlightsListProps) {
  if (stats.players.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">暂无大事记数据</p>
        </CardContent>
      </Card>
    )
  }

  // 最大单场盈利
  let maxSingleWin: { player: string; score: number; date: string | undefined } = { player: "", score: 0, date: undefined }
  for (const p of stats.players) {
    const playerRecords = filteredRecords.filter((r) => r.player === p.name)
    if (playerRecords.length === 0) continue
    const maxScore = Math.max(...playerRecords.map((r) => r.score))
    if (maxScore > maxSingleWin.score) {
      const rec = playerRecords.find((r) => r.score === maxScore)
      maxSingleWin = { player: p.name, score: maxScore, date: rec?.date }
    }
  }

  // 最长连胜
  let longestStreak: { player: string; streak: number } = { player: "", streak: 0 }
  for (const p of stats.players) {
    if (p.longestWinStreak > longestStreak.streak) {
      longestStreak = { player: p.name, streak: p.longestWinStreak }
    }
  }

  // 最大逆转（相邻两场由负转正的净差值）
  let maxComeback: { player: string; value: number } = { player: "", value: 0 }
  for (const p of stats.players) {
    const playerRecords = filteredRecords.filter((r) => r.player === p.name)
    if (playerRecords.length < 2) continue
    const sortedRecs = [...playerRecords].sort((a, b) => a.date.localeCompare(b.date))
    for (let i = 1; i < sortedRecs.length; i++) {
      if (sortedRecs[i - 1].score < 0 && sortedRecs[i].score > 0) {
        const gap = sortedRecs[i].score - sortedRecs[i - 1].score
        if (gap > maxComeback.value) {
          maxComeback = { player: p.name, value: gap }
        }
      }
    }
  }

  // 最活跃玩家
  let mostActive: { player: string; count: number } = { player: "", count: 0 }
  for (const p of stats.players) {
    if (p.sessionCount > mostActive.count) {
      mostActive = { player: p.name, count: p.sessionCount }
    }
  }

  // 最多冠军（获胜次数）
  let mostWins: { player: string; wins: number } = { player: "", wins: 0 }
  for (const p of stats.players) {
    if (p.wins > mostWins.wins) {
      mostWins = { player: p.name, wins: p.wins }
    }
  }

  // 清分王
  let clearKing: { player: string; score: number } = { player: "", score: 0 }
  for (const s of settlements) {
    if (s.settleScore > clearKing.score) {
      clearKing = { player: s.player, score: s.settleScore }
    }
  }

  const highlights = []

  if (maxSingleWin.player && maxSingleWin.score > 0) {
    highlights.push({
      icon: <Sparkles className="h-4 w-4" />,
      title: "最大单场盈利",
      player: maxSingleWin.player,
      value: `+${maxSingleWin.score.toLocaleString()}`,
      date: maxSingleWin.date ? formatDate(maxSingleWin.date) : undefined,
      color: "text-amber-500 bg-amber-500/10",
    })
  }

  if (longestStreak.player && longestStreak.streak > 0) {
    highlights.push({
      icon: <Flame className="h-4 w-4" />,
      title: "最长连胜",
      player: longestStreak.player,
      value: `${longestStreak.streak} 连胜`,
      color: "text-orange-500 bg-orange-500/10",
    })
  }

  if (maxComeback.player && maxComeback.value > 0) {
    highlights.push({
      icon: <Zap className="h-4 w-4" />,
      title: "最大逆转",
      player: maxComeback.player,
      value: `逆转 ${maxComeback.value.toLocaleString()}`,
      color: "text-blue-500 bg-blue-500/10",
    })
  }

  if (mostActive.player && mostActive.count > 0) {
    highlights.push({
      icon: <Star className="h-4 w-4" />,
      title: "最活跃玩家",
      player: mostActive.player,
      value: `${mostActive.count} 场`,
      color: "text-purple-500 bg-purple-500/10",
    })
  }

  if (mostWins.player && mostWins.wins > 0) {
    highlights.push({
      icon: <Crown className="h-4 w-4" />,
      title: "最多冠军",
      player: mostWins.player,
      value: `${mostWins.wins} 胜`,
      color: "text-amber-400 bg-amber-400/10",
    })
  }

  if (clearKing.player && clearKing.score > 0) {
    highlights.push({
      icon: <Utensils className="h-4 w-4" />,
      title: "清分王",
      player: clearKing.player,
      value: `${clearKing.score.toLocaleString()} 分`,
      color: "text-emerald-500 bg-emerald-500/10",
    })
  }

  if (highlights.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">暂无大事记数据</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/40 bg-card/60 backdrop-blur">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span>🏅</span> 赛季大事记
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {highlights.map((item, idx) => (
          <HighlightItem key={idx} {...item} />
        ))}
      </CardContent>
    </Card>
  )
}