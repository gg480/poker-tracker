"use client"

import type { Season, PlayerSettlement } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface SeasonOverviewProps {
  season: Season | null
  totalGames: number
  totalPlayers: number
  settlements: PlayerSettlement[]
}

export function SeasonOverview({
  season,
  totalGames,
  totalPlayers,
  settlements,
}: SeasonOverviewProps) {
  const seasonSettlements = season
    ? settlements.filter((s) => s.seasonId === season.id)
    : settlements

  const totalSettled = seasonSettlements.reduce(
    (sum, s) => sum + s.settleScore,
    0
  )

  return (
    <Card className="border-border/40 bg-card/60 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="text-lg">🏟️</span> 赛季概览
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted/30 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold font-mono text-primary">
              {totalGames}
            </div>
            <div className="text-xs text-muted-foreground mt-1">总场次</div>
          </div>
          <div className="bg-muted/30 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold font-mono text-primary">
              {totalPlayers}
            </div>
            <div className="text-xs text-muted-foreground mt-1">参与人数</div>
          </div>
          <div className="bg-muted/30 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold font-mono text-amber-400">
              {totalSettled.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground mt-1">已清分</div>
          </div>
          <div className="bg-muted/30 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold font-mono">
              {season?.name || "全部"}
            </div>
            <div className="text-xs text-muted-foreground mt-1">当前赛季</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
