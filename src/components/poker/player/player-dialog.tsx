"use client"

import { useMemo } from "react"
import type { ComputedStats, PokerRecord, PlayerSettlement } from "@/lib/types"
import { computePlayerStats } from "@/services/stats-service"
import { CHART_COLORS } from "@/lib/stats"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts"

interface PlayerDialogProps {
  open: boolean
  onClose: () => void
  playerName: string | null
  stats: ComputedStats
  records: PokerRecord[]
  settlements: PlayerSettlement[]
}

export function PlayerDialog({
  open,
  onClose,
  playerName,
  stats,
  records,
  settlements,
}: PlayerDialogProps) {
  const player = stats.players.find((p) => p.name === playerName)

  const playerDetail = useMemo(() => {
    if (!playerName) return null
    return computePlayerStats(playerName, records, settlements)
  }, [playerName, records, settlements])

  const cumulativeData = useMemo(() => {
    if (!playerName) return []
    return (stats.cumulative[playerName] || []).map((c) => ({
      date: c.date.slice(5),
      cum: c.cum,
    }))
  }, [playerName, stats.cumulative])

  const playerRecords = useMemo(() => {
    if (!playerName) return []
    return records
      .filter((r) => r.player === playerName)
      .reverse()
  }, [playerName, records])

  return (
    <Sheet open={open} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0">
        <SheetHeader className="px-4 pt-4 pb-0">
          <SheetTitle className="flex items-center gap-2">
            <span className="text-lg">👤</span>
            {playerName ?? "玩家详情"}
          </SheetTitle>
        </SheetHeader>

        {(!playerName || !player || !playerDetail?.basic) ? (
          <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
            未选择玩家
          </div>
        ) : (
          <ScrollArea className="flex-1 px-4 pb-6">
            <div className="space-y-3 pt-3">
              {/* 趋势标签 */}
              <div className="flex justify-end">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    playerDetail.recentTrend === "up"
                      ? "bg-emerald-500/15 text-emerald-400"
                      : playerDetail.recentTrend === "down"
                        ? "bg-red-500/15 text-red-400"
                        : "bg-muted/30 text-muted-foreground"
                  }`}
                >
                  {playerDetail.recentTrend === "up"
                    ? "📈 上升"
                    : playerDetail.recentTrend === "down"
                      ? "📉 下降"
                      : "➡️ 平稳"}
                </span>
              </div>

              {/* 数据卡片 */}
              <Card className="border-border/40 bg-card/60 backdrop-blur">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <span className="text-lg">📊</span> 数据概览
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    <StatBox
                      label="总积分"
                      value={player.total.toLocaleString()}
                      color={player.total >= 0 ? "text-emerald-500" : "text-red-500"}
                    />
                    <StatBox
                      label="胜率"
                      value={`${player.winRate}%`}
                      color="text-primary"
                    />
                    <StatBox
                      label="场次"
                      value={String(player.games)}
                      color="text-amber-500"
                    />
                    <StatBox
                      label="参与局数"
                      value={String(player.sessionCount)}
                      color="text-teal-500"
                    />
                    <StatBox
                      label="单日最高"
                      value={`+${player.maxWin.toLocaleString()}`}
                      color="text-emerald-500"
                    />
                    <StatBox
                      label="单日最低"
                      value={player.maxLoss.toLocaleString()}
                      color="text-red-500"
                    />
                    <StatBox
                      label="场均"
                      value={player.avgScore.toLocaleString()}
                      color={player.avgScore >= 0 ? "text-emerald-500" : "text-red-500"}
                    />
                    <StatBox
                      label="胜/负"
                      value={`${player.wins}/${player.losses}`}
                      color="text-muted-foreground"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* 克星 & 福星 */}
              {(playerDetail.nemeses.length > 0 ||
                playerDetail.allies.length > 0) && (
                <Card className="border-border/50 bg-card/80 backdrop-blur">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <span className="text-lg">⚡</span> 克星 &amp; 福星
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {playerDetail.nemeses.length > 0 && (
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">
                          克星（同场时你得分最低）
                        </div>
                        {playerDetail.nemeses.map((n) => (
                          <div
                            key={n.player}
                            className="flex justify-between text-sm py-0.5"
                          >
                            <span>{n.player}</span>
                            <span className="font-mono text-red-400">
                              {n.netScore}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    {playerDetail.allies.length > 0 && (
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">
                          福星（同场时你得分最高）
                        </div>
                        {playerDetail.allies.map((a) => (
                          <div
                            key={a.player}
                            className="flex justify-between text-sm py-0.5"
                          >
                            <span>{a.player}</span>
                            <span className="font-mono text-emerald-400">
                              +{a.netScore}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* 累计积分走势 */}
              <Card className="border-border/50 bg-card/80 backdrop-blur">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <span className="text-lg">📈</span> 累计积分走势
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {cumulativeData.length === 0 ? (
                    <p className="text-sm text-muted-foreground/60 text-center py-6">
                      暂无走势数据
                    </p>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart
                        data={cumulativeData}
                        margin={{ left: 0, right: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#1e2d4a"
                        />
                        <XAxis
                          dataKey="date"
                          tick={{ fill: "#64748b", fontSize: 10 }}
                          interval="preserveStartEnd"
                        />
                        <YAxis
                          tick={{ fill: "#64748b", fontSize: 11 }}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "#1e293b",
                            border: "1px solid #334155",
                            borderRadius: 8,
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="cum"
                          stroke={CHART_COLORS[0]}
                          strokeWidth={2}
                          dot={{ r: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* 单场记录 */}
              <Card className="border-border/50 bg-card/80 backdrop-blur">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <span className="text-lg">📋</span> 单场记录
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {playerRecords.length === 0 ? (
                    <p className="text-sm text-muted-foreground/60 text-center py-6">
                      暂无记录
                    </p>
                  ) : (
                    <div className="max-h-[250px] overflow-y-auto">
                      <table className="w-full border-collapse text-xs">
                        <thead>
                          <tr>
                            <th className="text-left py-2 px-2.5 text-muted-foreground border-b border-border font-medium">
                              日期
                            </th>
                            <th className="text-left py-2 px-2.5 text-muted-foreground border-b border-border font-medium">
                              积分
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {playerRecords.map((r, i) => (
                            <tr key={i}>
                              <td className="py-1.5 px-2.5 border-b border-border/50 font-mono">
                                {r.date}
                              </td>
                              <td
                                className={`py-1.5 px-2.5 border-b border-border/50 font-mono font-semibold ${
                                  r.score > 0
                                    ? "text-emerald-500"
                                    : "text-red-500"
                                }`}
                              >
                                {r.score > 0 ? "+" : ""}
                                {r.score.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        )}
      </SheetContent>
    </Sheet>
  )
}

function StatBox({
  label,
  value,
  color,
}: {
  label: string
  value: string
  color: string
}) {
  return (
    <div className="p-2.5 bg-background/80 rounded-lg border border-border/50">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className={`text-lg font-bold font-mono ${color}`}>{value}</div>
    </div>
  )
}
