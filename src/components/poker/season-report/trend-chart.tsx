import type { ComputedStats } from "@/lib/types"
import { CHART_TREND_STROKE_WIDTH, CHART_GRID_STROKE_DASHARRAY, MAX_VISIBLE_PLAYERS } from "@/lib/constants"
import { CHART_COLORS } from "@/lib/stats"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface TrendChartProps {
  stats: ComputedStats
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null

  return (
    <div className="bg-background/95 backdrop-blur border border-border rounded-lg p-3 shadow-lg">
      <p className="text-xs text-muted-foreground mb-2">{label}</p>
      {payload.map((entry, idx) => (
        <div key={idx} className="flex items-center gap-2 text-sm">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="font-medium">{entry.name}:</span>
          <span className={entry.value >= 0 ? "text-emerald-500" : "text-red-500"}>
            {entry.value >= 0 ? "+" : ""}{entry.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  )
}

export function TrendChart({ stats }: TrendChartProps) {
  if (stats.trendData.length === 0 || stats.players.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">暂无走势数据</p>
        </CardContent>
      </Card>
    )
  }

  // 排序玩家：按总积分降序，取前10名
  const topPlayers = stats.players.slice(0, MAX_VISIBLE_PLAYERS)
  const visiblePlayerNames = new Set(topPlayers.map((p) => p.name))

  // 过滤数据，只保留前10名玩家的数据
  const filteredTrendData = stats.trendData.map((point) => {
    const filtered: Record<string, string | number> = { date: point.date }
    for (const key of Object.keys(point)) {
      if (key !== "date" && visiblePlayerNames.has(key)) {
        filtered[key] = point[key] as number
      }
    }
    return filtered
  })

  const hasMorePlayers = stats.players.length > MAX_VISIBLE_PLAYERS

  return (
    <Card className="border-border/40 bg-card/60 backdrop-blur">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span>📈</span> 积分走势
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasMorePlayers && (
          <p className="text-xs text-muted-foreground mb-3">
            仅显示前 {MAX_VISIBLE_PLAYERS} 名玩家（按总积分排序）
          </p>
        )}
        <div className="h-[600px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filteredTrendData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray={CHART_GRID_STROKE_DASHARRAY} stroke="var(--border)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                tickLine={false}
                axisLine={{ stroke: "var(--border)" }}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                tickLine={false}
                axisLine={{ stroke: "var(--border)" }}
                tickFormatter={(value) => {
                  if (value >= 10000) return (value / 10000).toFixed(1) + "w"
                  if (value >= 1000) return (value / 1000).toFixed(0) + "k"
                  return value
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 10, paddingTop: 10 }}
                iconType="circle"
                iconSize={8}
              />
              {topPlayers.map((player, idx) => (
                <Line
                  key={player.name}
                  type="monotone"
                  dataKey={player.name}
                  stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                  strokeWidth={CHART_TREND_STROKE_WIDTH}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}