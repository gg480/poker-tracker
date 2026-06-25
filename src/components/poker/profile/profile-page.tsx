"use client"

import { useState, useCallback, useMemo, useRef, useEffect } from "react"
import type { Season, PlayerSettlement, ComputedStats, GameSession } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { EndSeasonDialog } from "@/components/poker/season/end-season-dialog"
import { SESSION_STATUS, MESSAGE_DISMISS_DURATION, TOAST_SHORT_DURATION, STORAGE_KEY_DEFAULT_PLAYER } from "@/lib/constants"
import { useLocalStorage } from "@/hooks/use-local-storage"

interface ProfilePageProps {
  seasons: Season[]
  activeSeason: Season | null
  stats: ComputedStats
  settlements: PlayerSettlement[]
  records: { date: string; player: string; score: number }[]
  sessions: GameSession[]
  onEndSeason: () => void
  onCreateSeason: (name: string) => void
  onExport: () => void
  onImport: (file: File) => void
}

export function ProfilePage({
  seasons,
  activeSeason,
  stats,
  settlements,
  records,
  sessions,
  onEndSeason,
  onCreateSeason,
  onExport,
  onImport,
}: ProfilePageProps) {
  const [newSeasonName, setNewSeasonName] = useState("")
  const [endSeasonOpen, setEndSeasonOpen] = useState(false)
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [defaultPlayer, setDefaultPlayer] = useLocalStorage(STORAGE_KEY_DEFAULT_PLAYER, "")
  const msgTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Cleanup message timeouts on unmount
  useEffect(() => {
    return () => {
      if (msgTimeoutRef.current) clearTimeout(msgTimeoutRef.current)
    }
  }, [])

  // 赛季盘点统计数据
  const seasonSessionStats = useMemo(() => {
    if (!activeSeason) return { sessionCount: 0, pending: 0, collected: 0 }
    const seasonSessions = sessions.filter((s) => s.seasonId === activeSeason.id)
    return {
      sessionCount: seasonSessions.length,
      pending: seasonSessions.filter((s) => s.status === SESSION_STATUS.PENDING).length,
      collected: seasonSessions.filter((s) => s.status === SESSION_STATUS.COLLECTED).length,
    }
  }, [sessions, activeSeason])

  const handleCreateSeason = useCallback(() => {
    if (!newSeasonName.trim()) {
      setMsg({ type: "error", text: "请输入赛季名称" })
      return
    }
    onCreateSeason(newSeasonName.trim())
    setNewSeasonName("")
    setMsg({ type: "success", text: `赛季"${newSeasonName}"已创建` })
    if (msgTimeoutRef.current) clearTimeout(msgTimeoutRef.current)
    msgTimeoutRef.current = setTimeout(() => setMsg(null), MESSAGE_DISMISS_DURATION)
  }, [newSeasonName, onCreateSeason])

  const handleSaveDefaultPlayer = useCallback(() => {
    // useLocalStorage 已自动持久化，此处仅展示确认提示
    setMsg({ type: "success", text: "默认玩家已保存" })
    if (msgTimeoutRef.current) clearTimeout(msgTimeoutRef.current)
    msgTimeoutRef.current = setTimeout(() => setMsg(null), TOAST_SHORT_DURATION)
  }, [])

  const handleFileImport = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        onImport(file)
        e.target.value = ""
      }
    },
    [onImport]
  )

  return (
    <div className="space-y-4">
      {msg && (
        <Alert
          variant={msg.type === "error" ? "destructive" : "default"}
          className={
            msg.type === "success" ? "border-emerald-500/30 bg-emerald-500/10" : ""
          }
        >
          <AlertDescription className="text-sm">{msg.text}</AlertDescription>
        </Alert>
      )}

      <Card className="border-border/40 bg-card/60 backdrop-blur">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="text-lg">👤</span> 个人设置
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">
              默认玩家名（录入时自动填充）
            </label>
            <div className="flex gap-2">
              <Input
                value={defaultPlayer}
                onChange={(e) => setDefaultPlayer(e.target.value)}
                placeholder="输入你的玩家名"
                className="bg-background/80 border-border"
              />
              <Button size="sm" onClick={handleSaveDefaultPlayer}>
                保存
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/80 backdrop-blur">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="text-lg">🏟️</span> 赛季管理
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {activeSeason && (
            <div className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
              <div>
                <div className="text-sm font-medium">{activeSeason.name}</div>
                <div className="text-xs text-muted-foreground">
                  {activeSeason.startDate} ~ 进行中
                </div>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setEndSeasonOpen(true)}
              >
                结束赛季
              </Button>
            </div>
          )}

          <div className="flex gap-2">
            <Input
              value={newSeasonName}
              onChange={(e) => setNewSeasonName(e.target.value)}
              placeholder="新赛季名称"
              className="bg-background/80 border-border"
            />
            <Button size="sm" onClick={handleCreateSeason}>
              创建
            </Button>
          </div>

          <div className="space-y-1">
            {seasons
              .filter((s) => !s.active)
              .map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between py-1.5 px-2 text-sm bg-muted/20 rounded"
                >
                  <span className="text-muted-foreground">{s.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {s.startDate} ~ {s.endDate || "进行中"}
                  </span>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/80 backdrop-blur">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="text-lg">💾</span> 数据备份
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onExport}>
              📤 导出 JSON
            </Button>
            <label className="cursor-pointer">
              <Button variant="outline" size="sm" asChild>
                <span>📥 导入 JSON</span>
              </Button>
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleFileImport}
              />
            </label>
          </div>
          <p className="text-xs text-muted-foreground">
            导出包含所有赛季、记录、结算数据的完整备份
          </p>
        </CardContent>
      </Card>

      {activeSeason && (
        <EndSeasonDialog
          open={endSeasonOpen}
          onOpenChange={setEndSeasonOpen}
          seasonName={activeSeason.name}
          seasonId={activeSeason.id}
          players={stats.players}
          settlements={settlements}
          sessionCount={seasonSessionStats.sessionCount}
          pendingSessionCount={seasonSessionStats.pending}
          collectedSessionCount={seasonSessionStats.collected}
          incompleteHandsCount={0}
          seasonRecordCount={records.length}
          seasonPlayerCount={stats.players.length}
          onConfirm={() => {
            onEndSeason()
            setEndSeasonOpen(false)
          }}
        />
      )}
    </div>
  )
}
