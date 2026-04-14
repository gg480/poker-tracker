"use client";

import { useState } from "react";
import type { PokerRecord, ComputedStats } from "@/lib/data";
import { SEED_RECORDS } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface RecordEntryProps {
  records: PokerRecord[];       // all records (for save merge)
  stats: ComputedStats;         // filtered stats (for player autocomplete)
  onSave: (records: PokerRecord[]) => void;
}

interface Entry {
  player: string;
  score: string;
}

export function RecordEntry({ records, stats, onSave }: RecordEntryProps) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [entries, setEntries] = useState<Entry[]>([{ player: '', score: '' }]);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const allPlayers = stats.players.map(p => p.name);

  const addRow = () => setEntries([...entries, { player: '', score: '' }]);
  const removeRow = (i: number) => setEntries(entries.filter((_, idx) => idx !== i));
  const updateRow = (i: number, key: keyof Entry, val: string) => {
    const next = [...entries];
    next[i] = { ...next[i], [key]: val };
    setEntries(next);
  };

  const totalCheck = entries.reduce((s, e) => s + (Number(e.score) || 0), 0);

  const handleSubmit = () => {
    const valid = entries.filter(e => e.player.trim() && e.score !== '');
    if (valid.length === 0) {
      setMsg({ type: 'error', text: '请至少填写一条记录' });
      return;
    }
    if (Math.abs(totalCheck) > 0) {
      setMsg({ type: 'error', text: `总分不为零 (差额: ${totalCheck})，请检查` });
      return;
    }

    const newRecs: PokerRecord[] = valid.map(e => ({
      date,
      player: e.player.trim(),
      score: Number(e.score),
      win: (Number(e.score) > 0 ? 1 : -1) as 1 | -1,
    }));

    onSave([...records, ...newRecs]);
    setEntries([{ player: '', score: '' }]);
    setMsg({ type: 'success', text: `已保存 ${newRecs.length} 条记录` });
    setTimeout(() => setMsg(null), 3000);
  };

  const handleReset = () => {
    onSave(SEED_RECORDS);
    setMsg({ type: 'success', text: '数据已重置为初始种子数据' });
    setTimeout(() => setMsg(null), 3000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="lg:col-span-2 border-border/50 bg-card/80 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="text-lg">✏️</span> 新增场次记录
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">日期</label>
            <Input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="bg-background/80 border-border max-w-[200px]"
            />
          </div>

          <div className="flex flex-col gap-2">
            {entries.map((e, i) => (
              <div key={i} className="flex gap-2 items-center">
                <div className="relative flex-1">
                  <Input
                    list={`players-${i}`}
                    placeholder="玩家"
                    value={e.player}
                    onChange={ev => updateRow(i, 'player', ev.target.value)}
                    className="bg-background/80 border-border"
                  />
                  <datalist id={`players-${i}`}>
                    {allPlayers.map(p => <option key={p} value={p} />)}
                  </datalist>
                </div>
                <Input
                  type="number"
                  placeholder="积分 (正赢负亏)"
                  value={e.score}
                  onChange={ev => updateRow(i, 'score', ev.target.value)}
                  className={`bg-background/80 border-border flex-1 font-mono ${
                    Number(e.score) > 0 ? 'text-emerald-500' : Number(e.score) < 0 ? 'text-red-500' : ''
                  }`}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeRow(i)}
                  className="text-red-500 hover:text-red-400 hover:bg-red-500/10 shrink-0"
                >
                  ✕
                </Button>
              </div>
            ))}
          </div>

          <div className="flex gap-3 items-center flex-wrap">
            <Button variant="outline" size="sm" onClick={addRow}>
              + 添加玩家
            </Button>
            <Button size="sm" onClick={handleSubmit}>
              保存
            </Button>
            <div className="flex-1" />
            <span className={`font-mono text-sm ${Math.abs(totalCheck) > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
              合计: {totalCheck > 0 ? '+' : ''}{totalCheck}
            </span>
          </div>

          {msg && (
            <Alert variant={msg.type === 'error' ? 'destructive' : 'default'} className={msg.type === 'success' ? 'border-emerald-500/30 bg-emerald-500/10' : ''}>
              <AlertDescription className="text-sm">{msg.text}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/80 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="text-lg">🗑️</span> 数据管理
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-muted-foreground text-sm">
            当前共 <span className="font-mono font-semibold text-foreground">{records.length}</span> 条记录，
            <span className="font-mono font-semibold text-foreground">{stats.totalGames}</span> 个场次
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">重置为初始数据</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>确认重置</AlertDialogTitle>
                <AlertDialogDescription>
                  这将清除所有数据并恢复为初始种子数据，此操作无法撤销。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction onClick={handleReset}>确认重置</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
