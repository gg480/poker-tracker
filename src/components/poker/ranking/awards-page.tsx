"use client"

import { useMemo } from "react"
import type { ComputedStats, PlayerSettlement } from "@/lib/types"
import { computeExtendedAwards } from "@/services/award-service"
import { AWARD_CATEGORIES, MIN_GAMES_FOR_AWARD } from "@/lib/constants"
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
            基于 ≥{MIN_GAMES_FOR_AWARD} 场以上数据评选
          </p>
        </CardContent>
      </Card>

      {awards.length === 0 && (
        <Card className="border-border/40 bg-card/60 backdrop-blur">
          <CardContent className="flex flex-col items-center justify-center py-10 text-muted-foreground/60">
            <span className="text-4xl mb-3 opacity-30">🏅</span>
            <p className="text-sm">暂无奖项数据</p>
            <p className="text-xs mt-1">当玩家参与 ≥{MIN_GAMES_FOR_AWARD} 场后将自动评选奖项</p>
          </CardContent>
        </Card>
      )}

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
                    role="button"
                    tabIndex={onPlayerClick ? 0 : undefined}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${config.borderColor} bg-muted/10 cursor-pointer hover:bg-muted/20 transition-colors focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2`}
                    onClick={() => onPlayerClick?.(award.winner)}
                    onKeyDown={onPlayerClick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onPlayerClick(award.winner) } } : undefined}
                  >
                    <span className="text-2xl" aria-hidden="true">{award.icon}</span>
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
