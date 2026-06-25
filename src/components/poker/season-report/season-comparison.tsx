import type { PokerRecord } from "@/lib/types"
import { computeStats } from "@/lib/stats"
import { computeSeasonComparison } from "@/services/stats-service"
import { getRecordsForSeason } from "@/lib/data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react"

interface SeasonComparisonProps {
  currentSeasonRecords: PokerRecord[]
  previousSeasonRecords: PokerRecord[]
  currentSeasonName: string
  previousSeasonName: string
}

function ComparisonRow({
  label,
  current,
  previous,
  format = (v: number) => v.toLocaleString(),
}: {
  label: string
  current: number
  previous: number
  format?: (v: number) => string
}) {
  const diff = current - previous
  const isPositive = diff > 0
  const isNegative = diff < 0
  const isNeutral = diff === 0

  const Icon = isPositive ? ArrowUpRight : isNegative ? ArrowDownRight : Minus
  const color = isPositive ? "text-emerald-500" : isNegative ? "text-red-500" : "text-muted-foreground"

  return (
    <div className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <span className="text-sm font-medium">{format(current)}</span>
          <span className="text-xs text-muted-foreground mx-2">vs</span>
          <span className="text-xs text-muted-foreground">{format(previous)}</span>
        </div>
        <div className={`flex items-center gap-1 ${color}`}>
          <Icon className="h-3 w-3" />
          <span className="text-xs font-medium">
            {isNeutral ? "-" : `${isPositive ? "+" : ""}${format(Math.abs(diff))}`}
          </span>
        </div>
      </div>
    </div>
  )
}

export function SeasonComparison({
  currentSeasonRecords,
  previousSeasonRecords,
  currentSeasonName,
  previousSeasonName,
}: SeasonComparisonProps) {
  const currentStats = computeStats(currentSeasonRecords)
  const previousStats = computeStats(previousSeasonRecords)

  const currentPlayerCount = currentStats.players.filter((p) => p.games > 0).length
  const previousPlayerCount = previousStats.players.filter((p) => p.games > 0).length

  const currentAvgScore = currentStats.totalGames > 0
    ? Math.round(currentStats.players.reduce((sum, p) => sum + Math.abs(p.total), 0) / currentStats.totalGames)
    : 0
  const previousAvgScore = previousStats.totalGames > 0
    ? Math.round(previousStats.players.reduce((sum, p) => sum + Math.abs(p.total), 0) / previousStats.totalGames)
    : 0

  const currentTotalFlow = currentStats.players.reduce(
    (sum, p) => {
      const wins = p.scores.filter((s) => s > 0).reduce((a, b) => a + b, 0)
      const losses = p.scores.filter((s) => s < 0).reduce((a, b) => a + Math.abs(b), 0)
      return { wins: sum.wins + wins, losses: sum.losses + losses }
    },
    { wins: 0, losses: 0 }
  )

  const previousTotalFlow = previousStats.players.reduce(
    (sum, p) => {
      const wins = p.scores.filter((s) => s > 0).reduce((a, b) => a + b, 0)
      const losses = p.scores.filter((s) => s < 0).reduce((a, b) => a + Math.abs(b), 0)
      return { wins: sum.wins + wins, losses: sum.losses + losses }
    },
    { wins: 0, losses: 0 }
  )

  return (
    <Card className="border-border/40 bg-card/60 backdrop-blur">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span>📊</span> 赛季对比
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {previousSeasonName} → {currentSeasonName}
        </p>
      </CardHeader>
      <CardContent>
        <ComparisonRow label="参与人数" current={currentPlayerCount} previous={previousPlayerCount} format={(v) => `${v} 人`} />
        <ComparisonRow label="总场次" current={currentStats.totalGames} previous={previousStats.totalGames} format={(v) => `${v} 场`} />
        <ComparisonRow label="场均积分" current={currentAvgScore} previous={previousAvgScore} format={(v) => `${v >= 0 ? "+" : ""}${v}`} />
        <ComparisonRow
          label="总积分流动"
          current={currentTotalFlow.wins + currentTotalFlow.losses}
          previous={previousTotalFlow.wins + previousTotalFlow.losses}
          format={(v) => v.toLocaleString()}
        />
      </CardContent>
    </Card>
  )
}