"use client";

import type { ComputedStats, ClearRecord } from "@/lib/data";
import { getPlayerClearedAmount } from "@/lib/data";
import { CHART_COLORS } from "@/lib/stats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, Legend, CartesianGrid,
} from "recharts";

interface DashboardProps {
  stats: ComputedStats;
  clears: ClearRecord[];
  onPlayerClick: (name: string) => void;
}

export function Dashboard({ stats, clears = [], onPlayerClick }: DashboardProps) {
  // Dragon Tiger Board: all players sorted by total
  const allSorted = [...stats.players].sort((a, b) => b.total - a.total);
  const medalColors = ["bg-amber-500", "bg-slate-400", "bg-amber-700"];

  // Post-clear balance: balance = original - cleared (cleared can be negative for debt relief)
  const playerBalances = [...stats.players].map(p => {
    const cleared = getPlayerClearedAmount(clears, p.name);
    const balance = p.total - cleared; // cleared negative = debt relief, balance = total - cleared
    return { ...p, cleared, balance };
  });

  // Recent games: ALL players, sorted by games desc, then show top N for columns
  const allByGames = [...stats.players].sort((a, b) => b.games - a.games);
  // Mobile: show top 8 players in recent games table; desktop: top 12
  const recentGamesCols = allByGames.slice(0, 10);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Dragon Tiger Board - 纯数字列表，适配移动端 */}
      <Card className="lg:col-span-2 border-border/50 bg-card/80 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="text-lg">🏆</span> 龙虎榜 · 总收支
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr>
                  <th className="text-left py-2 px-2 text-muted-foreground border-b border-border font-medium w-8">#</th>
                  <th className="text-left py-2 px-2 text-muted-foreground border-b border-border font-medium">玩家</th>
                  <th className="text-right py-2 px-2 text-muted-foreground border-b border-border font-medium">总收支</th>
                </tr>
              </thead>
              <tbody>
                {allSorted.map((p, i) => (
                  <tr key={p.name} className="cursor-pointer hover:bg-primary/5"
                    onClick={() => onPlayerClick(p.name)}>
                    <td className="py-1.5 px-2 border-b border-border/50">
                      <span className={`w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px] font-bold ${
                        i < 3 ? medalColors[i] + ' text-primary-foreground' : 'text-muted-foreground'
                      }`}>
                        {i + 1}
                      </span>
                    </td>
                    <td className="py-1.5 px-2 border-b border-border/50 font-medium">{p.name}</td>
                    <td className={`py-1.5 px-2 border-b border-border/50 font-mono text-right font-bold text-sm ${
                      p.total > 0 ? 'text-emerald-500' : p.total < 0 ? 'text-red-500' : 'text-muted-foreground'
                    }`}>
                      {p.total > 0 ? '+' : ''}{p.total.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Cumulative Trend */}
      <Card className="lg:col-span-2 border-border/50 bg-card/80 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="text-lg">📈</span> 累计积分走势
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.trendData} margin={{ left: 10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {stats.players.map((p, i) => (
                <Line key={p.name} type="monotone" dataKey={p.name}
                  stroke={CHART_COLORS[i % CHART_COLORS.length]}
                  dot={false} strokeWidth={1.5} connectNulls />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Win Rate Ranking */}
      <Card className="border-border/50 bg-card/80 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="text-lg">🎯</span> 胜率排行
            <Badge variant="secondary" className="text-[10px] ml-1">&ge;5场</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={[...stats.players].filter(p => p.games >= 5).sort((a, b) => Number(b.winRate) - Number(a.winRate))} margin={{ left: 10, right: 10, bottom: 20 }}>
              <XAxis dataKey="name" tick={{ fill: '#e2e8f0', fontSize: 11 }} angle={-30} textAnchor="end" />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} domain={[0, 100]} />
              <Tooltip formatter={(v: number) => `${v}%`} contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
              <Bar dataKey="winRate" radius={[4, 4, 0, 0]}>
                {[...stats.players].filter(p => p.games >= 5).sort((a, b) => Number(b.winRate) - Number(a.winRate)).map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Daily Best */}
      <Card className="border-border/50 bg-card/80 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="text-lg">💎</span> 单日最高记录
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-1.5">
            {Object.entries(stats.dailyBests)
              .sort((a, b) => b[1].score - a[1].score)
              .slice(0, 8)
              .map(([name, { score, date }], i) => (
                <div key={name} className="flex items-center gap-2.5 py-1.5">
                  <span className={`w-5.5 h-5.5 rounded-full flex items-center justify-center text-[10px] font-bold text-primary-foreground shrink-0 ${i < 3 ? medalColors[i] : "bg-muted"}`}>
                    {i + 1}
                  </span>
                  <span
                    className="flex-1 text-sm cursor-pointer hover:text-primary transition-colors"
                    onClick={() => onPlayerClick(name)}
                  >
                    {name}
                  </span>
                  <span className="text-sm font-bold font-mono text-emerald-500">
                    +{score.toLocaleString()}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{date.slice(5)}</span>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Post-Clear Balance Leaderboard */}
      <Card className="lg:col-span-2 border-border/50 bg-card/80 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="text-lg">💳</span> 清分后余额排行
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr>
                  <th className="text-left py-2 px-2 text-muted-foreground border-b border-border font-medium w-8">#</th>
                  <th className="text-left py-2 px-2 text-muted-foreground border-b border-border font-medium">玩家</th>
                  <th className="text-right py-2 px-2 text-muted-foreground border-b border-border font-medium">原始积分</th>
                  <th className="text-right py-2 px-2 text-muted-foreground border-b border-border font-medium">已清分</th>
                  <th className="text-right py-2 px-2 text-muted-foreground border-b border-border font-medium">余额</th>
                </tr>
              </thead>
              <tbody>
                {playerBalances
                  .sort((a, b) => b.balance - a.balance)
                  .map((b, i) => (
                    <tr key={b.name} className="cursor-pointer hover:bg-primary/5"
                      onClick={() => onPlayerClick(b.name)}>
                      <td className="py-1.5 px-2 border-b border-border/50">
                        <span className={`w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px] font-bold ${
                          i < 3 ? medalColors[i] + ' text-primary-foreground' : 'text-muted-foreground'
                        }`}>
                          {i + 1}
                        </span>
                      </td>
                      <td className="py-1.5 px-2 border-b border-border/50 font-medium">{b.name}</td>
                      <td className={`py-1.5 px-2 border-b border-border/50 font-mono text-right ${
                        b.total > 0 ? 'text-emerald-500' : b.total < 0 ? 'text-red-500' : ''
                      }`}>
                        {b.total > 0 ? '+' : ''}{b.total.toLocaleString()}
                      </td>
                      <td className="py-1.5 px-2 border-b border-border/50 font-mono text-right">
                        {b.cleared > 0 ? (
                          <span className="text-red-500">-{b.cleared.toLocaleString()}</span>
                        ) : b.cleared < 0 ? (
                          <span className="text-emerald-500">+{(-b.cleared).toLocaleString()}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className={`py-1.5 px-2 border-b border-border/50 font-mono text-right font-bold ${
                        b.balance > 0 ? 'text-emerald-500' : b.balance < 0 ? 'text-red-500' : 'text-muted-foreground'
                      }`}>
                        {b.balance > 0 ? '+' : ''}{b.balance.toLocaleString()}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Recent Games - ALL players sorted by games desc */}
      <Card className="lg:col-span-2 border-border/50 bg-card/80 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="text-lg">📅</span> 最近场次
            <Badge variant="secondary" className="text-[10px] ml-1">{stats.totalGames}场</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs min-w-[400px]">
              <thead>
                <tr>
                  <th className="text-left py-2 px-2.5 text-muted-foreground border-b border-border font-medium whitespace-nowrap sticky left-0 bg-card z-10">日期</th>
                  {recentGamesCols.map(p => (
                    <th key={p.name} className="text-left py-2 px-2.5 text-muted-foreground border-b border-border font-medium whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <span>{p.name}</span>
                        <span className="text-[9px] text-muted-foreground/50">{p.games}场</span>
                      </div>
                    </th>
                  ))}
                  {allByGames.length > recentGamesCols.length && (
                    <th className="text-muted-foreground/30 py-2 px-2.5 border-b border-border/50">
                      +{allByGames.length - recentGamesCols.length}人
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {stats.dates.slice(-8).reverse().map(d => (
                  <tr key={d}>
                    <td className="py-1.5 px-2.5 border-b border-border/50 font-mono whitespace-nowrap sticky left-0 bg-card z-10">{d.slice(5)}</td>
                    {recentGamesCols.map(p => {
                      const rec = stats.dateMap[d]?.find(r => r.player === p.name);
                      return (
                        <td key={p.name} className={`py-1.5 px-2.5 border-b border-border/50 font-mono whitespace-nowrap font-semibold ${
                          rec ? (rec.score > 0 ? 'text-emerald-500' : 'text-red-500') : 'text-muted-foreground/20'
                        }`}>
                          {rec ? (rec.score > 0 ? '+' : '') + rec.score.toLocaleString() : '-'}
                        </td>
                      );
                    })}
                    {allByGames.length > recentGamesCols.length && (
                      <td className="border-b border-border/50" />
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
