"use client";

import { useState } from "react";
import type { Season, ClearRecord, ComputedStats } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface SeasonManagerProps {
  season: Season;
  stats: ComputedStats;
  clears: ClearRecord[];
  onClearPlayer: (player: string, amount: number, type: 'threshold' | 'season_end') => void;
  onEndSeason: () => void;
}

const CLEAR_THRESHOLD = 8000;

export function SeasonManager({ season, stats, clears, onClearPlayer, onEndSeason }: SeasonManagerProps) {
  // Per-player cleared amounts
  const clearedMap: Record<string, number> = {};
  for (const c of clears) {
    clearedMap[c.player] = (clearedMap[c.player] || 0) + c.amount;
  }

  // Sorted by total score descending
  const playerSummary = [...stats.players]
    .map(p => ({
      name: p.name,
      total: p.total,
      cleared: clearedMap[p.name] || 0,
      get balance() { return this.total - this.cleared; },
    }))
    .sort((a, b) => b.total - a.total);

  // Players over 8000 threshold (active season only, for clear UI)
  const playersOverThreshold = season.active
    ? playerSummary.filter(b => Math.abs(b.balance) >= CLEAR_THRESHOLD)
    : [];

  // Track input values for each player
  const [clearInputs, setClearInputs] = useState<Record<string, string>>({});

  const seasonClears = clears; // already filtered by season in page.tsx

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Season Info + Clear Actions */}
      <Card className="border-border/50 bg-card/80 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="text-lg">🏟️</span> {season.name}
            {season.active ? (
              <Badge className="bg-emerald-500/20 text-emerald-500 text-[10px]">进行中</Badge>
            ) : (
              <Badge className="bg-slate-500/20 text-slate-400 text-[10px]">已结束</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-2.5 bg-background/80 rounded-lg border border-border/50">
              <div className="text-[11px] text-muted-foreground">开始日期</div>
              <div className="font-mono font-semibold">{season.startDate}</div>
            </div>
            <div className="p-2.5 bg-background/80 rounded-lg border border-border/50">
              <div className="text-[11px] text-muted-foreground">结束日期</div>
              <div className="font-mono font-semibold">{season.endDate || '进行中'}</div>
            </div>
            <div className="p-2.5 bg-background/80 rounded-lg border border-border/50">
              <div className="text-[11px] text-muted-foreground">已打场次</div>
              <div className="font-mono font-semibold">{stats.totalGames}</div>
            </div>
            <div className="p-2.5 bg-background/80 rounded-lg border border-border/50">
              <div className="text-[11px] text-muted-foreground">参与玩家</div>
              <div className="font-mono font-semibold">{stats.players.length}</div>
            </div>
          </div>

          {/* Clear threshold area - only for active season */}
          {season.active && playersOverThreshold.length > 0 && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg space-y-3">
              <div className="text-sm font-semibold text-amber-500">
                达到清分线 ({CLEAR_THRESHOLD}) · 请吃饭抵扣
              </div>
              <div className="flex flex-col gap-2.5">
                {playersOverThreshold.map(b => (
                  <div key={b.name} className="flex items-center gap-2">
                    <span className="text-sm min-w-[50px]">{b.name}</span>
                    <span className={`text-xs font-mono min-w-[80px] ${b.balance > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      余额 {b.balance > 0 ? '+' : ''}{b.balance.toLocaleString()}
                    </span>
                    <Input
                      type="number"
                      placeholder="清分积分"
                      value={clearInputs[b.name] || ''}
                      onChange={e => setClearInputs(prev => ({ ...prev, [b.name]: e.target.value }))}
                      className="bg-background/80 border-border h-7 text-xs flex-1 min-w-[80px]"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-amber-500 border-amber-500/30 hover:bg-amber-500/10 text-xs h-7 px-3"
                      disabled={!clearInputs[b.name] || Number(clearInputs[b.name]) <= 0}
                      onClick={() => {
                        const amount = Number(clearInputs[b.name]);
                        if (amount > 0) {
                          onClearPlayer(b.name, amount, 'threshold');
                          setClearInputs(prev => {
                            const next = { ...prev };
                            delete next[b.name];
                            return next;
                          });
                        }
                      }}
                    >
                      确认清分
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {season.active && playersOverThreshold.length === 0 && (
            <div className="p-2.5 bg-background/50 rounded-lg border border-border/30 text-xs text-muted-foreground text-center">
              暂无玩家达到 {CLEAR_THRESHOLD} 分清分线
            </div>
          )}

          {season.active && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="w-full">
                  结束赛季 (全员清分)
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>确认结束赛季？</AlertDialogTitle>
                  <AlertDialogDescription>
                    结束赛季将：1) 对所有玩家按余额执行清分(正负均清); 2) 关闭当前赛季不可再录入。此操作不可撤销。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction onClick={onEndSeason}>确认结束</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </CardContent>
      </Card>

      {/* Season Total Score Summary */}
      <Card className="border-border/50 bg-card/80 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="text-lg">📊</span> 赛季总分总结
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr>
                  <th className="text-left py-2 px-2 text-muted-foreground border-b border-border font-medium w-8">#</th>
                  <th className="text-left py-2 px-2 text-muted-foreground border-b border-border font-medium">玩家</th>
                  <th className="text-right py-2 px-2 text-muted-foreground border-b border-border font-medium">累计积分</th>
                  <th className="text-right py-2 px-2 text-muted-foreground border-b border-border font-medium">已清分</th>
                  <th className="text-right py-2 px-2 text-muted-foreground border-b border-border font-medium">余额</th>
                </tr>
              </thead>
              <tbody>
                {playerSummary.map((b, i) => (
                  <tr key={b.name}>
                    <td className="py-1.5 px-2 border-b border-border/50">
                      <span className={`w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px] font-bold ${
                        i < 3 ? ['bg-amber-500', 'bg-slate-400', 'bg-amber-700'][i] + ' text-primary-foreground' : 'text-muted-foreground'
                      }`}>
                        {i + 1}
                      </span>
                    </td>
                    <td className="py-1.5 px-2 border-b border-border/50 font-medium">{b.name}</td>
                    <td className={`py-1.5 px-2 border-b border-border/50 font-mono text-right font-semibold ${
                      b.total > 0 ? 'text-emerald-500' : b.total < 0 ? 'text-red-500' : ''
                    }`}>
                      {b.total > 0 ? '+' : ''}{b.total.toLocaleString()}
                    </td>
                    <td className="py-1.5 px-2 border-b border-border/50 font-mono text-right text-amber-500">
                      {b.cleared > 0 ? `-${b.cleared.toLocaleString()}` : '-'}
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

      {/* Clear History */}
      <Card className="lg:col-span-2 border-border/50 bg-card/80 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="text-lg">📜</span> 清分记录
          </CardTitle>
        </CardHeader>
        <CardContent>
          {seasonClears.length === 0 ? (
            <p className="text-sm text-muted-foreground">暂无清分记录</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr>
                    <th className="text-left py-2 px-2.5 text-muted-foreground border-b border-border font-medium">日期</th>
                    <th className="text-left py-2 px-2.5 text-muted-foreground border-b border-border font-medium">玩家</th>
                    <th className="text-left py-2 px-2.5 text-muted-foreground border-b border-border font-medium">清分金额</th>
                    <th className="text-left py-2 px-2.5 text-muted-foreground border-b border-border font-medium">类型</th>
                  </tr>
                </thead>
                <tbody>
                  {[...seasonClears].reverse().map(c => (
                    <tr key={c.id}>
                      <td className="py-1.5 px-2.5 border-b border-border/50 font-mono">{c.date}</td>
                      <td className="py-1.5 px-2.5 border-b border-border/50">{c.player}</td>
                      <td className="py-1.5 px-2.5 border-b border-border/50 font-mono font-semibold text-amber-500">-{c.amount.toLocaleString()}</td>
                      <td className="py-1.5 px-2.5 border-b border-border/50">
                        <Badge variant="outline" className="text-[10px]">
                          {c.type === 'threshold' ? '抵扣清分' : '赛季结算'}
                        </Badge>
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
  );
}
