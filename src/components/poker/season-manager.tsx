"use client";

import { useState } from "react";
import type { Season, PlayerSettlement, ComputedStats } from "@/lib/data";
import { calcBalance, getSettlementForPlayer } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface SeasonManagerProps {
  season: Season;
  stats: ComputedStats;
  settlements: PlayerSettlement[];
  onSettlePlayer: (player: string, amount: number) => void;
  onEndSeason: () => void;
}

const CLEAR_THRESHOLD = 8000;

export function SeasonManager({ season, stats, settlements, onSettlePlayer, onEndSeason }: SeasonManagerProps) {
  // Per-player settlement data for this season
  const playerSummary = [...stats.players]
    .map(p => {
      const settlement = getSettlementForPlayer(settlements, p.name, season.id);
      const settleScore = settlement?.settleScore ?? 0;
      const seasonAdjust = settlement?.seasonAdjust ?? 0;
      const balance = calcBalance(p.total, settlement);
      return { name: p.name, total: p.total, settleScore, seasonAdjust, balance };
    })
    .sort((a, b) => b.total - a.total);

  // Players with |balance| >= 8000 (active season only, for clear UI)
  const playersOverThreshold = season.active
    ? playerSummary.filter(b => Math.abs(b.balance) >= CLEAR_THRESHOLD)
    : [];

  // Track input values for each player
  const [clearInputs, setClearInputs] = useState<Record<string, string>>({});

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
                      placeholder="请吃饭积分"
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
                          onSettlePlayer(b.name, amount);
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
                    结束赛季将：1) 对所有玩家执行赛季清分(season_adjust += -balance); 2) 关闭当前赛季不可再录入。此操作不可撤销。
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
                  <th className="text-right py-2 px-2 text-muted-foreground border-b border-border font-medium">请吃饭</th>
                  <th className="text-right py-2 px-2 text-muted-foreground border-b border-border font-medium">赛季调整</th>
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
          </div>
        </CardContent>
      </Card>

      {/* Settlement Summary (replaces Clear History) */}
      <Card className="lg:col-span-2 border-border/50 bg-card/80 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="text-lg">📜</span> 清分记录
          </CardTitle>
        </CardHeader>
        <CardContent>
          {settlements.length === 0 ? (
            <p className="text-sm text-muted-foreground">暂无清分记录</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr>
                    <th className="text-left py-2 px-2.5 text-muted-foreground border-b border-border font-medium">玩家</th>
                    <th className="text-right py-2 px-2.5 text-muted-foreground border-b border-border font-medium">请吃饭清分</th>
                    <th className="text-right py-2 px-2.5 text-muted-foreground border-b border-border font-medium">赛季调整</th>
                  </tr>
                </thead>
                <tbody>
                  {settlements.map(s => (
                    <tr key={s.player}>
                      <td className="py-1.5 px-2.5 border-b border-border/50 font-medium">{s.player}</td>
                      <td className="py-1.5 px-2.5 border-b border-border/50 font-mono text-right">
                        {s.settleScore > 0 ? (
                          <span className="text-amber-500">-{s.settleScore.toLocaleString()}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="py-1.5 px-2.5 border-b border-border/50 font-mono text-right">
                        {s.seasonAdjust !== 0 ? (
                          <span className={s.seasonAdjust > 0 ? 'text-emerald-500' : 'text-red-500'}>
                            {s.seasonAdjust > 0 ? '+' : ''}{s.seasonAdjust.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
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
