"use client";

import type { ComputedStats } from "@/lib/types";
import type { PlayerSettlement } from "@/lib/types";
import { calcBalance } from "@/lib/data";
import { CHART_COLORS } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MIN_GAMES_FOR_AWARD, RECENT_GAMES_LIMIT, RECENT_DATES_LIMIT, DAILY_BEST_LIMIT } from "@/lib/constants";
import { ScrollIndicator } from "@/components/ui/scroll-indicator";
import { Trophy, TrendingUp, Target, Gem, CreditCard, Calendar } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, Legend, CartesianGrid,
} from "recharts";

interface DashboardProps {
  stats: ComputedStats;
  settlements: PlayerSettlement[];
  onPlayerClick: (name: string) => void;
}

export function Dashboard({ stats, settlements = [], onPlayerClick }: DashboardProps) {
  // 龙虎榜：按总收支排序
  const allSorted = [...stats.players].sort((a, b) => b.total - a.total);
  const medalColors = ["bg-amber-500", "bg-slate-400", "bg-amber-700"];

  // 清分后余额：balance = total_score - settle_score + season_adjust
  const playerBalances = [...stats.players].map(p => {
    const playerSettlements = settlements.filter(s => s.player === p.name);
    const settleScore = playerSettlements.reduce((sum, s) => sum + s.settleScore, 0);
    const seasonAdjust = playerSettlements.reduce((sum, s) => sum + s.seasonAdjust, 0);
    const balance = calcBalance(p.total, { player: p.name, seasonId: '', settleScore, seasonAdjust });
    return { ...p, settleScore, seasonAdjust, balance };
  });

  // 最近场次：按场次排序，取前N列
  const allByGames = [...stats.players].sort((a, b) => b.games - a.games);
  const recentGamesCols = allByGames.slice(0, RECENT_GAMES_LIMIT);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* 龙虎榜 */}
      <Card className="lg:col-span-2 glass-card spotlight-border overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="size-4 text-amber-400" strokeWidth={2} />
            <span className="text-sm font-semibold">龙虎榜 · 总收支</span>
          </div>
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
                  <tr key={p.name} className="cursor-pointer hover:bg-primary/5 transition-colors focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-[-2px]"
                    tabIndex={0} role="button"
                    onClick={() => onPlayerClick(p.name)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onPlayerClick(p.name) } }}>
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

      {/* 累计积分走势 */}
      <Card className="lg:col-span-2 glass-card spotlight-border overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="size-4 text-primary" strokeWidth={2} />
            <span className="text-sm font-semibold">累计积分走势</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.trendData} margin={{ left: 10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="date" tick={{ fill: '#7d8da3', fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis tick={{ fill: '#7d8da3', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#131a26', border: '1px solid #1f2937', borderRadius: 8, fontSize: 12 }} />
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

      {/* 胜率排行 */}
      <Card className="glass-card spotlight-border overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Target className="size-4 text-primary" strokeWidth={2} />
            <span className="text-sm font-semibold">胜率排行</span>
            <Badge variant="secondary" className="text-[10px] ml-1">&ge;{MIN_GAMES_FOR_AWARD}场</Badge>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={[...stats.players].filter(p => p.games >= MIN_GAMES_FOR_AWARD).sort((a, b) => Number(b.winRate) - Number(a.winRate))} margin={{ left: 10, right: 10, bottom: 20 }}>
              <XAxis dataKey="name" tick={{ fill: '#e6edf3', fontSize: 11 }} angle={-30} textAnchor="end" />
              <YAxis tick={{ fill: '#7d8da3', fontSize: 11 }} domain={[0, 100]} />
              <Tooltip formatter={(v: number) => `${v}%`} contentStyle={{ background: '#131a26', border: '1px solid #1f2937', borderRadius: 8 }} />
              <Bar dataKey="winRate" radius={[4, 4, 0, 0]}>
                {[...stats.players].filter(p => p.games >= MIN_GAMES_FOR_AWARD).sort((a, b) => Number(b.winRate) - Number(a.winRate)).map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 单日最高记录 */}
      <Card className="glass-card spotlight-border overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Gem className="size-4 text-amber-400" strokeWidth={2} />
            <span className="text-sm font-semibold">单日最高记录</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {Object.entries(stats.dailyBests)
              .sort((a, b) => b[1].score - a[1].score)
              .slice(0, DAILY_BEST_LIMIT)
              .map(([name, { score, date }], i) => (
                <div key={name} className="flex items-center gap-2.5 py-1.5">
                  <span className={`w-5.5 h-5.5 rounded-full flex items-center justify-center text-[10px] font-bold text-primary-foreground shrink-0 ${i < 3 ? medalColors[i] : "bg-muted"}`}>
                    {i + 1}
                  </span>
                  <span
                    className="flex-1 text-sm cursor-pointer hover:text-primary transition-colors focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 rounded"
                    role="button" tabIndex={0}
                    onClick={() => onPlayerClick(name)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onPlayerClick(name) } }}
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

      {/* 清分后余额排行 */}
      <Card className="lg:col-span-2 glass-card spotlight-border overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="size-4 text-primary" strokeWidth={2} />
            <span className="text-sm font-semibold">清分后余额排行</span>
          </div>
          <ScrollIndicator>
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr>
                  <th className="text-left py-2 px-2 text-muted-foreground border-b border-border font-medium w-8">#</th>
                  <th className="text-left py-2 px-2 text-muted-foreground border-b border-border font-medium">玩家</th>
                  <th className="text-right py-2 px-2 text-muted-foreground border-b border-border font-medium">累计积分</th>
                  <th className="text-right py-2 px-2 text-muted-foreground border-b border-border font-medium">请吃饭</th>
                  <th className="text-right py-2 px-2 text-muted-foreground border-b border-border font-medium">赛季调整</th>
                  <th className="text-right py-2 px-2 text-muted-foreground border-b border-border font-medium">余额</th>
                </tr>
              </thead>
              <tbody>
                {playerBalances
                  .sort((a, b) => b.balance - a.balance)
                  .map((b, i) => (
                    <tr key={b.name} className="cursor-pointer hover:bg-primary/5 transition-colors focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-[-2px]"
                      tabIndex={0} role="button"
                      onClick={() => onPlayerClick(b.name)}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onPlayerClick(b.name) } }}>
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
                        {b.settleScore > 0 ? (
                          <span className="text-amber-500">-{b.settleScore.toLocaleString()}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="py-1.5 px-2 border-b border-border/50 font-mono text-right">
                        {b.seasonAdjust !== 0 ? (
                          <span className={b.seasonAdjust > 0 ? 'text-emerald-500' : 'text-red-500'}>
                            {b.seasonAdjust > 0 ? '+' : ''}{b.seasonAdjust.toLocaleString()}
                          </span>
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
          </ScrollIndicator>
        </CardContent>
      </Card>

      {/* 最近场次 */}
      <Card className="lg:col-span-2 glass-card spotlight-border overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="size-4 text-primary" strokeWidth={2} />
            <span className="text-sm font-semibold">最近场次</span>
            <Badge variant="secondary" className="text-[10px] ml-1">{stats.totalGames}场</Badge>
          </div>
          <ScrollIndicator>
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
                {stats.dates.slice(-RECENT_DATES_LIMIT).reverse().map(d => (
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
          </ScrollIndicator>
        </CardContent>
      </Card>
    </div>
  );
}
