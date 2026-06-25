import type { ComputedStats } from "@/lib/types"
import { computeExtendedAwards, AWARD_DEFINITIONS } from "@/services/award-service"
import { AWARD_CATEGORIES } from "@/lib/constants"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface SeasonAwardsProps {
  stats: ComputedStats
}

const CATEGORY_CONFIG = {
  [AWARD_CATEGORIES.WINNER]: { label: "赢家奖项", icon: "🏆", color: "text-amber-400", borderColor: "border-amber-500/30" },
  [AWARD_CATEGORIES.LOSER]: { label: "鼓励奖项", icon: "💪", color: "text-blue-400", borderColor: "border-blue-500/30" },
  [AWARD_CATEGORIES.SPECIAL]: { label: "特别奖项", icon: "✨", color: "text-purple-400", borderColor: "border-purple-500/30" },
}

export function SeasonAwards({ stats }: SeasonAwardsProps) {
  const awards = computeExtendedAwards(stats, [])

  if (awards.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">暂无奖项数据</p>
          <p className="text-sm text-muted-foreground/70 mt-1">完成更多比赛后将自动评选</p>
        </CardContent>
      </Card>
    )
  }

  const groupedAwards: Record<string, typeof awards> = {}
  for (const a of awards) {
    if (!groupedAwards[a.category]) groupedAwards[a.category] = []
    groupedAwards[a.category].push(a)
  }

  return (
    <Card className="border-border/40 bg-card/60 backdrop-blur">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span>🏅</span> 赛季颁奖典礼
          <span className="text-xs text-muted-foreground font-normal font-mono">
            {awards.length} 个奖项
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(CATEGORY_CONFIG).map(([category, config]) => {
          const categoryAwards = groupedAwards[category]
          if (!categoryAwards || categoryAwards.length === 0) return null

          return (
            <div key={category} className="space-y-2">
              <div className={`flex items-center gap-2 text-sm font-medium ${config.color}`}>
                <span>{config.icon}</span> {config.label}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {categoryAwards.map((award) => (
                  <div
                    key={award.key}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${config.borderColor} bg-muted/10`}
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
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}