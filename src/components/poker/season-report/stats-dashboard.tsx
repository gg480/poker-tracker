import type { ComputedStats, PokerRecord } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Trophy, Users, TrendingUp, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react"

interface StatsDashboardProps {
  stats: ComputedStats
  filteredRecords: PokerRecord[]
}

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  subtext?: string
  highlight?: "positive" | "negative" | "neutral"
}

function StatCard({ title, value, icon, subtext, highlight }: StatCardProps) {
  const highlightColors = {
    positive: "text-emerald-500",
    negative: "text-red-500",
    neutral: "text-amber-500",
  }
  const color = highlight ? highlightColors[highlight] : "text-amber-500"

  return (
    <Card className="border-border/40 bg-card/60 backdrop-blur">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium">{title}</p>
            <p className={`text-2xl font-bold tabular-nums ${color}`}>{value}</p>
            {subtext && <p className="text-xs text-muted-foreground/70">{subtext}</p>}
          </div>
          <div className={`p-2 rounded-lg bg-muted/50 ${color}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}

function formatNumber(num: number): string {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + "w"
  }
  return num.toLocaleString()
}

export function StatsDashboard({ stats, filteredRecords }: StatsDashboardProps) {
  // 计算总积分流动（所有正分的和 + 所有负分的绝对值之和）
  const totalFlow = stats.players.reduce(
    (sum, p) => {
      const wins = p.scores.filter((s) => s > 0).reduce((a, b) => a + b, 0)
      const losses = p.scores.filter((s) => s < 0).reduce((a, b) => a + Math.abs(b), 0)
      return { wins: sum.wins + wins, losses: sum.losses + losses }
    },
    { wins: 0, losses: 0 }
  )

  // 最大赢家（积分最高的玩家）
  const maxWinner = stats.players.length > 0 ? stats.players[0] : null

  // 最大输家（积分最低的玩家）
  const maxLoser = stats.players.length > 0 ? stats.players[stats.players.length - 1] : null

  // 场均积分（平均每场积分流动量）
  const totalAbsScore = stats.players.reduce((sum, p) => sum + Math.abs(p.total), 0)
  const avgScore = stats.totalGames > 0 ? Math.round(totalAbsScore / stats.totalGames) : 0

  // 参与人数（打过比赛的玩家数）
  const participantCount = stats.players.filter((p) => p.games > 0).length

  if (stats.players.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">暂无数据</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <StatCard
        title="总场次"
        value={stats.totalGames}
        icon={<Trophy className="h-4 w-4" />}
        subtext={`${stats.totalRecords} 条记录`}
      />
      <StatCard
        title="参与人数"
        value={participantCount}
        icon={<Users className="h-4 w-4" />}
        subtext="活跃玩家"
      />
      <StatCard
        title="场均积分"
        value={avgScore > 0 ? `+${avgScore}` : avgScore.toString()}
        icon={<TrendingUp className="h-4 w-4" />}
        subtext="场均得分"
        highlight={avgScore >= 0 ? "positive" : "negative"}
      />
      <StatCard
        title="总积分流动"
        value={formatNumber(totalFlow.wins + totalFlow.losses)}
        icon={<TrendingUp className="h-4 w-4" />}
        subtext="正负合计"
      />
      {maxWinner && (
        <StatCard
          title="最大赢家"
          value={maxWinner.name}
          icon={<ArrowUpRight className="h-4 w-4" />}
          subtext={`+${maxWinner.total.toLocaleString()} 分`}
          highlight="positive"
        />
      )}
      {maxLoser && maxLoser.total < 0 && (
        <StatCard
          title="最大输家"
          value={maxLoser.name}
          icon={<ArrowDownRight className="h-4 w-4" />}
          subtext={`${maxLoser.total.toLocaleString()} 分`}
          highlight="negative"
        />
      )}
    </div>
  )
}