"use client"

import { useMemo } from "react"
import type { ComputedStats, PlayerSettlement } from "@/lib/types"
import { computeExtendedAwards, AWARD_DEFINITIONS } from "@/services/award-service"
import { AWARD_CATEGORIES } from "@/lib/constants"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface AwardsPageProps {
  stats: ComputedStats
  settlements: PlayerSettlement[]
  onPlayerClick?: (name: string) => void
}

const CATEGORY_CONFIG = {
  [AWARD_CATEGORIES.WINNER]: { label: "赢家奖项", icon: "🏆", color: "text-amber-400", borderColor: "border-amber-500/30" },
  [AWARD_CATEGORIES.LOSER]: { label: "鼓励奖项", icon: "💪", color: "text-blue-400", borderColor: "border-blue-500/30" },
  [AWARD_CATEGORIES.SPECIAL]: { label: "特别奖项", icon: "✨", color: "text-purple-400", borderColor: "border-purple-500/30" },
}

export function AwardsPage({ stats, settlements, onPlayerClick }: AwardsPageProps) {
  const awards = useMemo(() => computeExtendedAwards(stats, settlements), [stats, settlements])

  const groupedAwards = useMemo(() => {
    const groups: Record<string, typeof awards> = {}
    for (const a of awards) {
      if (!groups[a.category]) groups[a.category] = []
      groups[a.category].push(a)
    }
    return groups
  }, [awards])

  return (
    <div className="space-y-4">
      <Card className="border-border/40 bg-card/60 backdrop-blur">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="text-lg">🏅</span> 赛季颁奖典礼
            <span className="text-xs text-muted-foreground font-normal">
              {awards.length} 个奖项
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            基于 ≥{AWARD_DEFINITIONS[0].compute.toString().includes("MIN_GAMES") ? 5 : 5} 场以上数据评选
          </p>
        </CardContent>
      </Card>

      {Object.entries(CATEGORY_CONFIG).map(([category, config]) => {
        const categoryAwards = groupedAwards[category]
        if (!categoryAwards || categoryAwards.length === 0) return null

        return (
          <Card key={category} className={`border-border/50 bg-card/80 backdrop-blur`}>
            <CardHeader className="pb-2">
              <CardTitle className={`flex items-center gap-2 text-base ${config.color}`}>
                <span className="text-lg">{config.icon}</span> {config.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {categoryAwards.map((award) => (
                  <div
                    key={award.key}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${config.borderColor} bg-muted/10 cursor-pointer hover:bg-muted/20 transition-colors`}
                    onClick={() => onPlayerClick?.(award.winner)}
                  >
                    <span className="text-2xl">{award.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{award.title}</div>
                      <div className="text-xs text-muted-foreground">{award.description}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`text-sm font-medium ${config.color}`}>{award.winner}</div>
                      <div className="text-xs text-muted-foreground font-mono">{award.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
