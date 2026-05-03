"use client"

import { useMemo } from "react"
import type { ComputedStats, PokerRecord, PlayerSettlement } from "@/lib/types"
import { computePlayerStats } from "@/services/stats-service"
import { CHART_COLORS } from "@/lib/stats"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
} from "recharts"

interface PlayerViewProps {
  stats: ComputedStats
  records: PokerRecord[]
  settlements: PlayerSettlement[]
  selected: string | null
  onSelect: (name: string | null) => void
}

export function PlayerView({ stats, records, settlements, selected, onSelect }: PlayerViewProps) {
  const player = stats.players.find((p) => p.name === selected)

  const playerDetail = useMemo(() => {
    if (!selected) return null
    return computePlayerStats(selected, records, settlements)
  }, [selected, records, settlements])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className={`${selected ? "" : "lg:col-span-2"} border-border/40 bg-card/60 backdrop-blur`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="text-lg">👥</span> 选择玩家
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {stats.players.map((p) => (
              <button
                key={p.name}
                onClick={() => onSelect(p.name)}
                className={`flex flex-col items-center min-w-[72px] px-3 py-2.5 rounded-xl border cursor-pointer transition-all duration-200 ${
                  selected === p.name
                    ? "bg-primary/20 border-primary text-primary"
                    : "bg-card border-border hover:bg-primary/10 hover:border-primary/50"
                }`}
              >
                <span className="text-sm">{p.name}</span>
                <span className={`text-[11px] font-mono ${p.total > 0 ? "text-emerald-500" : "text-red-500"}`}>
                  {p.total > 0 ? "+" : ""}{p.total.toLocaleString()}
                </span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {player && playerDetail && playerDetail.basic && (
        <>
          <Card className="border-border/40 bg-card/60 backdrop-blur">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <span className="text-lg">📊</span> {player.name} 的数据
                </CardTitle>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  playerDetail.recentTrend === "up"
                    ? "bg-emerald-500/15 text-emerald-400"
                    : playerDetail.recentTrend === "down"
                      ? "bg-red-500/15 text-red-400"
                      : "bg-muted/30 text-muted-foreground"
                }`}>
                  {playerDetail.recentTrend === "up" ? "📈 上升" : playerDetail.recentTrend === "down" ? "📉 下降" : "➡️ 平稳"}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2.5">
                <StatBox label="总积分" value={player.total.toLocaleString()} color={player.total >= 0 ? "text-emerald-500" : "text-red-500"} />
                <StatBox label="胜率" value={`${player.winRate}%`} color="text-primary" />
                <StatBox label="场次" value={String(player.games)} color="text-amber-500" />
                <StatBox label="参与局数" value={String(player.sessionCount)} color="text-teal-500" />
                <StatBox label="单日最高" value={`+${player.maxWin.toLocaleString()}`} color="text-emerald-500" />
                <StatBox label="单日最低" value={player.maxLoss.toLocaleString()} color="text-red-500" />
                <StatBox label="场均" value={player.avgScore.toLocaleString()} color={player.avgScore >= 0 ? "text-emerald-500" : "text-red-500"} />
                <StatBox label="胜/负" value={`${player.wins}/${player.losses}`} color="text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          {playerDetail.nemeses.length > 0 && (
            <Card className="border-border/50 bg-card/80 backdrop-blur">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <span className="text-lg">⚡</span> 克星 & 福星
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">克星（同场时你得分最低）</div>
                  {playerDetail.nemeses.map((n) => (
                    <div key={n.player} className="flex justify-between text-sm py-0.5">
                      <span>{n.player}</span>
                      <span className="font-mono text-red-400">{n.netScore}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">福星（同场时你得分最高）</div>
                  {playerDetail.allies.map((a) => (
                    <div key={a.player} className="flex justify-between text-sm py-0.5">
                      <span>{a.player}</span>
                      <span className="font-mono text-emerald-400">+{a.netScore}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="lg:col-span-2 border-border/50 bg-card/80 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="text-lg">📈</span> {player.name} 累计积分走势
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart
                  data={(stats.cumulative[player.name] || []).map((c) => ({ date: c.date.slice(5), cum: c.cum }))}
                  margin={{ left: 10, right: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a" />
                  <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 10 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fill: "#64748b", fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8 }} />
                  <Line type="monotone" dataKey="cum" stroke={CHART_COLORS[0]} strokeWidth={2} dot={{ r: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 border-border/50 bg-card/80 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="text-lg">📋</span> {player.name} 单场记录
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-[300px] overflow-y-auto">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr>
                      <th className="text-left py-2 px-2.5 text-muted-foreground border-b border-border font-medium">日期</th>
                      <th className="text-left py-2 px-2.5 text-muted-foreground border-b border-border font-medium">积分</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.filter((r) => r.player === player.name).reverse().map((r, i) => (
                      <tr key={i}>
                        <td className="py-1.5 px-2.5 border-b border-border/50 font-mono">{r.date}</td>
                        <td className={`py-1.5 px-2.5 border-b border-border/50 font-mono font-semibold ${r.score > 0 ? "text-emerald-500" : "text-red-500"}`}>
                          {r.score > 0 ? "+" : ""}{r.score.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="p-2.5 bg-background/80 rounded-lg border border-border/50">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className={`text-lg font-bold font-mono ${color}`}>{value}</div>
    </div>
  )
}
