"use client";

import type { Season, ClearRecord, ComputedStats } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface SeasonManagerProps {
  season: Season;
  stats: ComputedStats;
  clears: ClearRecord[];
  onClearPlayer: (player: string, amount: number) => void;
  onEndSeason: () => void;
}

const CLEAR_THRESHOLD = 8000;

export function SeasonManager({ season, stats, clears, onClearPlayer, onEndSeason }: SeasonManagerProps) {
  // Compute post-clear balances
  const balanceData = stats.players.map(p => ({
    name: p.name,
    total: p.total,
    cleared: clears.filter(c => c.player === p.name).reduce((s, c) => s + c.amount, 0),
    get balance() { return this.total - this.cleared; },
  })).sort((a, b) => b.balance - a.balance);

  const playersOverThreshold = balanceData.filter(b => b.balance >= CLEAR_THRESHOLD);
  const seasonClears = clears; // already filtered by season in page.tsx

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Season Info */}
      <Card className="border-border/50 bg-card/80 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="text-lg">🏟️</span> {season.name}
            {season.active && <Badge className="bg-emerald-500/20 text-emerald-500 text-[10px]">进行中</Badge>}
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

          {playersOverThreshold.length > 0 && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <div className="text-sm font-semibold text-amber-500 mb-2">
                触发清分 ({CLEAR_THRESHOLD}分)
              </div>
              <div className="flex flex-col gap-2">
                {playersOverThreshold.map(b => (
                  <div key={b.name} className="flex items-center justify-between">
                    <span className="text-sm">{b.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono text-emerald-500">
                        余额 {b.balance.toLocaleString()}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-amber-500 border-amber-500/30 hover:bg-amber-500/10 text-xs h-7"
                        onClick={() => onClearPlayer(b.name, CLEAR_THRESHOLD)}
                      >
                        清分 {CLEAR_THRESHOLD}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {season.active && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="w-full">
                  结束赛季 (触发全员清分)
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>确认结束赛季？</AlertDialogTitle>
                  <AlertDialogDescription>
                    结束赛季将：1) 对所有正余额玩家执行全额清分; 2) 关闭当前赛季不可再录入。此操作不可撤销。
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

      {/* Post-Clear Balance Leaderboard */}
      <Card className="border-border/50 bg-card/80 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="text-lg">💳</span> 清分后余额排行
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-1.5">
            {balanceData.map((b, i) => (
              <div key={b.name} className="flex items-center gap-2.5 py-1.5">
                <span className={`w-5.5 h-5.5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                  i < 3 ? ['bg-amber-500', 'bg-slate-400', 'bg-amber-700'][i] + ' text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  {i + 1}
                </span>
                <span className="flex-1 text-sm">{b.name}</span>
                <span className="text-[11px] text-muted-foreground font-mono">
                  原始 {b.total > 0 ? '+' : ''}{b.total.toLocaleString()}
                </span>
                {b.cleared > 0 && (
                  <span className="text-[11px] text-amber-500 font-mono">
                    -{b.cleared.toLocaleString()}
                  </span>
                )}
                <span className={`text-sm font-bold font-mono min-w-[70px] text-right ${
                  b.balance > 0 ? 'text-emerald-500' : b.balance < 0 ? 'text-red-500' : 'text-muted-foreground'
                }`}>
                  {b.balance > 0 ? '+' : ''}{b.balance.toLocaleString()}
                </span>
              </div>
            ))}
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
                          {c.type === 'threshold' ? '8000清分' : '赛季结算'}
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
