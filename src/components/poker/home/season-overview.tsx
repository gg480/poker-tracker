"use client"

import type { Season, PlayerSettlement } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Gamepad2, Users, Coins, Calendar } from "lucide-react"

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

  const stats = [
    { icon: Gamepad2, label: "总场次", value: totalGames, color: "text-primary" },
    { icon: Users, label: "参与人数", value: totalPlayers, color: "text-primary" },
    { icon: Coins, label: "已清分", value: totalSettled.toLocaleString(), color: "text-amber-400" },
    { icon: Calendar, label: "当前赛季", value: season?.name || "全部", color: "text-foreground" },
  ]

  return (
    <Card className="glass-card spotlight-border overflow-hidden">
      <CardContent className="p-4">
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className="rounded-lg p-3 bg-muted/20 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Icon className="size-3.5 text-muted-foreground" strokeWidth={2} />
                  <span className="text-[11px] text-muted-foreground">{stat.label}</span>
                </div>
                <div className={`text-xl font-bold font-display ${stat.color}`}>
                  {stat.value}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
