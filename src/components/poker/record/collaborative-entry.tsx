"use client"

import { useState, useMemo, useCallback } from "react"
import type { PokerRecord, ComputedStats, SessionEntry } from "@/lib/types"
import { SESSION_STATUS } from "@/lib/constants"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { SEED_RECORDS } from "@/lib/data"

interface CollaborativeEntryProps {
  records: PokerRecord[]
  stats: ComputedStats
  onSave: (records: PokerRecord[]) => void
  activeSeasonId?: string
}

interface PlayerEntry {
  player: string
  score: string
}

export function CollaborativeEntry({
  records,
  stats,
  onSave,
  activeSeasonId,
}: CollaborativeEntryProps) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [entries, setEntries] = useState<PlayerEntry[]>([{ player: "", score: "" }])
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [onShare, setOnShare] = useState<(() => void) | null>(null)

  const allPlayers = useMemo(() => stats.players.map((p) => p.name), [stats])

  const totalScore = useMemo(
    () => entries.reduce((s, e) => s + (Number(e.score) || 0), 0),
    [entries]
  )

  const validEntries = useMemo(
    () => entries.filter((e) => e.player.trim() && e.score !== ""),
    [entries]
  )

  const enteredPlayers = useMemo(
    () => new Set(validEntries.map((e) => e.player.trim())),
    [validEntries]
  )

  const isZeroSum = totalScore === 0 && validEntries.length >= 2

  const addRow = useCallback(() => {
    setEntries((prev) => [...prev, { player: "", score: "" }])
  }, [])

  const removeRow = useCallback((i: number) => {
    setEntries((prev) => prev.filter((_, idx) => idx !== i))
  }, [])

  const updateRow = useCallback((i: number, key: keyof PlayerEntry, val: string) => {
    setEntries((prev) => {
      const next = [...prev]
      next[i] = { ...next[i], [key]: val }
      return next
    })
  }, [])

  const addAllPlayers = useCallback(() => {
    const newEntries = allPlayers.map((p) => ({
      player: p,
      score: enteredPlayers.has(p)
        ? entries.find((e) => e.player.trim() === p)?.score || ""
        : "",
    }))
    setEntries(newEntries)
  }, [allPlayers, enteredPlayers, entries])

  const handleSubmit = useCallback(async () => {
    if (validEntries.length === 0) {
      setMsg({ type: "error", text: "请至少填写一条记录" })
      return
    }
    if (Math.abs(totalScore) > 0) {
      setMsg({ type: "error", text: `总分不为零 (差额: ${totalScore})，请检查` })
      return
    }
    setConfirmOpen(true)
  }, [validEntries, totalScore])

  const handleConfirmSave = useCallback(async () => {
    setConfirmOpen(false)
    setIsSubmitting(true)
    try {
      const newRecs: PokerRecord[] = validEntries.map((e) => ({
        date,
        player: e.player.trim(),
        score: Number(e.score),
        win: (Number(e.score) > 0 ? 1 : -1) as 1 | -1,
      }))

      onSave([...records, ...newRecs])

      try {
        const res = await fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "batch_entries",
            sessionId: sessionId || undefined,
            entries: validEntries.map((e) => ({
              player: e.player.trim(),
              score: Number(e.score),
              entered: true,
            })),
            seasonId: activeSeasonId || "",
            date,
          }),
        })
        const json = await res.json()
        if (json.success && json.data?.session?.id) {
          const sid = json.data.session.id
          setSessionId(sid)
          try {
            await fetch("/api/sessions", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "confirm", sessionId: sid }),
            })
          } catch {}
        }
      } catch {}

      setConfirmed(true)
      setMsg({ type: "success", text: `已保存 ${newRecs.length} 条记录并确认场次` })
      setTimeout(() => setMsg(null), 5000)
    } finally {
      setIsSubmitting(false)
    }
  }, [validEntries, date, records, onSave, sessionId, activeSeasonId])

  const handleNewSession = useCallback(() => {
    setEntries([{ player: "", score: "" }])
    setSessionId(null)
    setConfirmed(false)
    setMsg(null)
  }, [])

  const handleCreateSession = useCallback(async () => {
    if (!activeSeasonId) {
      setMsg({ type: "error", text: "请先选择赛季" })
      return
    }
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, seasonId: activeSeasonId }),
      })
      const json = await res.json()
      if (json.success && json.data) {
        setSessionId(json.data.id)
        setMsg({ type: "success", text: "场次已创建，开始录入" })
        setTimeout(() => setMsg(null), 2000)
      }
    } catch {
      setMsg({ type: "error", text: "创建场次失败" })
    }
  }, [date, activeSeasonId])

  const handleReset = useCallback(() => {
    onSave(SEED_RECORDS)
    setMsg({ type: "success", text: "数据已重置为初始种子数据" })
    setTimeout(() => setMsg(null), 3000)
  }, [onSave])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="lg:col-span-2 border-border/40 bg-card/60 backdrop-blur">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="text-lg">✏️</span> 多人协作录入
            </CardTitle>
            {sessionId && (
              <Badge variant="outline" className="text-xs">
                场次 #{sessionId.slice(0, 6)}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3 items-end flex-wrap">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">日期</label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-background/80 border-border w-[160px]"
              />
            </div>
            {!sessionId && (
              <Button variant="outline" size="sm" onClick={handleCreateSession}>
                创建场次
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={addAllPlayers}>
              一键添加全部玩家
            </Button>
          </div>

          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-[1fr_120px_36px] gap-2 text-xs text-muted-foreground px-1">
              <span>玩家</span>
              <span>积分</span>
              <span></span>
            </div>
            {entries.map((e, i) => {
              const score = Number(e.score)
              const scoreColor =
                score > 0
                  ? "text-emerald-500"
                  : score < 0
                    ? "text-red-500"
                    : ""
              const isEntered = e.player.trim() && e.score !== ""

              return (
                <div
                  key={i}
                  className={`grid grid-cols-[1fr_120px_36px] gap-2 items-center p-1.5 rounded-md ${
                    isEntered ? "bg-emerald-500/5" : ""
                  }`}
                >
                  <div className="relative">
                    <Input
                      list={`players-${i}`}
                      placeholder="玩家名"
                      value={e.player}
                      onChange={(ev) => updateRow(i, "player", ev.target.value)}
                      className="bg-background/80 border-border h-9"
                    />
                    <datalist id={`players-${i}`}>
                      {allPlayers.map((p) => (
                        <option key={p} value={p} />
                      ))}
                    </datalist>
                  </div>
                  <Input
                    type="number"
                    placeholder="积分"
                    value={e.score}
                    onChange={(ev) => updateRow(i, "score", ev.target.value)}
                    className={`bg-background/80 border-border h-9 font-mono ${scoreColor}`}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeRow(i)}
                    className="text-red-500 hover:text-red-400 hover:bg-red-500/10 h-9 w-9 shrink-0"
                  >
                    ✕
                  </Button>
                </div>
              )
            })}
          </div>

          <div className="flex gap-3 items-center flex-wrap">
            <Button variant="outline" size="sm" onClick={addRow} disabled={confirmed}>
              + 添加玩家
            </Button>
            {!confirmed ? (
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={!isZeroSum || isSubmitting}
              >
                {isSubmitting ? "保存中..." : "确认保存"}
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleNewSession}>
                  新建场次
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                  onClick={() => {
                    const event = new CustomEvent("poker:share", { detail: { sessionId, date, entries: validEntries } })
                    window.dispatchEvent(event)
                  }}
                >
                  📸 生成分享图
                </Button>
              </div>
            )}
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {validEntries.length} 人已录入
              </span>
              <span
                className={`font-mono text-sm font-semibold ${
                  Math.abs(totalScore) > 0
                    ? "text-red-500"
                    : validEntries.length >= 2
                      ? "text-emerald-500"
                      : "text-muted-foreground"
                }`}
              >
                合计: {totalScore > 0 ? "+" : ""}
                {totalScore}
              </span>
              {isZeroSum && (
                <span className="text-emerald-500 text-sm">✓</span>
              )}
            </div>
          </div>

          <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>确认保存场次</AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div className="space-y-2">
                    <p>即将保存 {validEntries.length} 位玩家的积分记录，此操作不可撤销。</p>
                    <div className="bg-muted/50 rounded-md p-2 text-sm">
                      {validEntries
                        .sort((a, b) => Number(b.score) - Number(a.score))
                        .map((e, i) => (
                          <div key={e.player || `player-${i}`} className="flex justify-between py-0.5">
                            <span>
                              {i === 0 && "🥇 "}{i === 1 && "🥈 "}{i === 2 && "🥉 "}
                              {e.player}
                            </span>
                            <span className={`font-mono ${Number(e.score) > 0 ? "text-emerald-500" : Number(e.score) < 0 ? "text-red-500" : ""}`}>
                              {Number(e.score) > 0 ? "+" : ""}{e.score}
                            </span>
                          </div>
                        ))}
                      <div className="border-t border-border/50 mt-1 pt-1 flex justify-between font-medium">
                        <span>合计</span>
                        <span className="text-emerald-500 font-mono">0 ✓</span>
                      </div>
                    </div>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmSave}>
                  确认保存
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {Math.abs(totalScore) > 0 && validEntries.length >= 2 && (
            <Alert className="border-amber-500/30 bg-amber-500/10">
              <AlertDescription className="text-sm text-amber-400">
                合计差额: {totalScore > 0 ? "+" : ""}
                {totalScore}，请调整至零和后保存
              </AlertDescription>
            </Alert>
          )}

          {msg && (
            <Alert
              variant={msg.type === "error" ? "destructive" : "default"}
              className={
                msg.type === "success"
                  ? "border-emerald-500/30 bg-emerald-500/10"
                  : ""
              }
            >
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
            当前共{" "}
            <span className="font-mono font-semibold text-foreground">
              {records.length}
            </span>{" "}
            条记录，
            <span className="font-mono font-semibold text-foreground">
              {stats.totalGames}
            </span>{" "}
            个场次
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                重置为初始数据
              </Button>
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
                <AlertDialogAction onClick={handleReset}>
                  确认重置
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  )
}
