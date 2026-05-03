"use client"

import { useState, useCallback, useEffect } from "react"
import type { PokerRecord, ComputedStats, HandRecord } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { HandWizard, type HandWizardData } from "./hand-wizard"
import { QuickEntryWizard, type QuickEntrySaveData } from "./quick-entry-wizard"
import {
  CardDisplay, formatActionLine, parseCardCode,
  type Card as PokerCard, type GameAction, type Position,
} from "./card-selector"
import { cardName } from "./poker-engine"

interface HandPageProps {
  records: PokerRecord[]
  stats: ComputedStats
  activeSeasonId?: string
}

interface SavedHand extends HandWizardData {
  id?: string
}

interface IncompleteHandCardProps {
  hand: HandRecord
  onComplete: (hand: HandRecord) => void
}

function IncompleteHandCard({ hand, onComplete }: IncompleteHandCardProps) {
  const heroCardObjects = ((): PokerCard[] => {
    if (!hand.actions) return []
    try {
      const parsed = JSON.parse(hand.actions)
      return (parsed.heroCards || [])
        .map((c: string) => parseCardCode(c))
        .filter(Boolean) as PokerCard[]
    } catch {
      return []
    }
  })()

  const boardCardObjects = hand.board
    ? hand.board.split(" ").filter(Boolean).map((c) => parseCardCode(c)).filter(Boolean) as PokerCard[]
    : []

  const resultValue = hand.result ?? 0

  return (
    <div className="p-3 border border-border/50 border-l-2 border-l-orange-500 rounded-lg bg-orange-500/5 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{hand.date}</span>
          <Badge variant="outline" className="text-orange-400 border-orange-500/40 bg-orange-500/10 text-[10px]">
            待补全
          </Badge>
          {hand.quickMode && (
            <span className="text-[10px] text-muted-foreground/60 font-mono">快速记录</span>
          )}
          {hand.sessionId && (
            <span className="text-[10px] text-muted-foreground/60 font-mono">
              对局#{hand.sessionId.slice(0, 6)}
            </span>
          )}
        </div>
        {resultValue !== 0 && (
          <span className={`font-mono text-sm font-semibold ${resultValue > 0 ? "text-emerald-400" : "text-red-400"}`}>
            {resultValue > 0 ? "+" : ""}{resultValue}
          </span>
        )}
      </div>

      {heroCardObjects.length > 0 && (
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">手牌:</span>
          {heroCardObjects.map((c) => <CardDisplay key={c} card={c} size="sm" />)}
        </div>
      )}

      {boardCardObjects.length > 0 && (
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">公共牌:</span>
          {boardCardObjects.map((c) => <CardDisplay key={c} card={c} size="sm" />)}
        </div>
      )}

      {hand.tags && hand.tags.length > 0 && (
        <div className="flex gap-1">
          {hand.tags.split(",").map((tag: string, j: number) => (
            <span key={j} className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-300">{tag.trim()}</span>
          ))}
        </div>
      )}

      {hand.notes && <p className="text-xs text-muted-foreground italic">"{hand.notes}"</p>}

      <div className="flex justify-end pt-1">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onComplete(hand)}
          className="text-orange-400 border-orange-500/40 hover:bg-orange-500/20 text-xs"
        >
          补全
        </Button>
      </div>
    </div>
  )
}

export function HandPage({ records, stats, activeSeasonId }: HandPageProps) {
  const [showWizard, setShowWizard] = useState(false)
  const [showQuickEntry, setShowQuickEntry] = useState(false)
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [savedHands, setSavedHands] = useState<SavedHand[]>([])
  const [incompleteHands, setIncompleteHands] = useState<HandRecord[]>([])

  // State for completing an incomplete hand via HandWizard
  const [completingHand, setCompletingHand] = useState<HandRecord | null>(null)

  // Load incomplete hands on mount and when activeSeasonId changes
  useEffect(() => {
    if (!activeSeasonId) return
    fetch(`/api/hands?season_id=${activeSeasonId}&is_complete=false`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setIncompleteHands(json.data)
        }
      })
      .catch(() => {})
  }, [activeSeasonId])

  // Handler for saving a full hand (from HandWizard, either new or completing)
  const handleWizardSave = useCallback(async (data: HandWizardData) => {
    try {
      const boardCards = [...data.flopCards]
      if (data.turnCard) boardCards.push(data.turnCard)
      if (data.riverCard) boardCards.push(data.riverCard)

      let sessionId = data.sessionId

      if (!sessionId && activeSeasonId) {
        try {
          const sessionRes = await fetch("/api/sessions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "find_or_create", date: data.date, seasonId: activeSeasonId }),
          })
          const sessionJson = await sessionRes.json()
          if (sessionJson.success && sessionJson.data?.id) {
            sessionId = sessionJson.data.id
          }
        } catch {}
      }

      const body = {
        date: data.date,
        seasonId: activeSeasonId || "",
        sessionId: sessionId || null,
        players: String(data.numPlayers),
        handType: "Holdem",
        board: boardCards.map(cardName).join(" "),
        actions: JSON.stringify({
          heroCards: data.heroCards.map(cardName),
          heroPosition: data.heroPosition,
          numPlayers: data.numPlayers,
          blinds: data.blinds,
          history: data.history,
        }),
        result: data.result || null,
        winner: data.winner.join(", ") || null,
        notes: data.notes || null,
        tags: data.tags || null,
      }

      // If we're completing an existing hand, use PUT
      if (completingHand?.id) {
        const res = await fetch("/api/hands", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: completingHand.id, ...body, isComplete: true }),
        })
        const json = await res.json()
        if (json.success) {
          setSavedHands((prev) => [{ ...data, id: json.data?.id, sessionId }, ...prev])
          setIncompleteHands((prev) => prev.filter((h) => h.id !== completingHand.id))
          setCompletingHand(null)
          setShowWizard(false)
          setMsg({ type: "success", text: "手牌记录已补全并保存" })
          setTimeout(() => setMsg(null), 3000)
        } else {
          setMsg({ type: "error", text: json.error || "保存失败" })
        }
        return
      }

      // Otherwise, create new hand
      const res = await fetch("/api/hands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (json.success) {
        setSavedHands((prev) => [{ ...data, id: json.data?.id, sessionId }, ...prev])
        setShowWizard(false)
        setMsg({ type: "success", text: "手牌记录已保存" })
        setTimeout(() => setMsg(null), 3000)
      } else {
        setMsg({ type: "error", text: json.error || "保存失败" })
      }
    } catch {
      setMsg({ type: "error", text: "网络错误" })
    }
  }, [activeSeasonId, completingHand])

  const handleQuickSave = useCallback(async (data: QuickEntrySaveData) => {
    try {
      let sessionId = data.sessionId
      if (!sessionId && activeSeasonId) {
        try {
          const sessionRes = await fetch("/api/sessions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "find_or_create", date: new Date().toISOString().slice(0, 10), seasonId: activeSeasonId }),
          })
          const sessionJson = await sessionRes.json()
          if (sessionJson.success && sessionJson.data?.id) {
            sessionId = sessionJson.data.id
          }
        } catch {}
      }

      const heroCardsStr = data.heroCards.join(" ")
      const body = {
        date: new Date().toISOString().slice(0, 10),
        seasonId: activeSeasonId || "",
        sessionId: sessionId || null,
        players: "1",
        handType: "Holdem",
        board: heroCardsStr,
        actions: JSON.stringify({ heroCards: data.heroCards, result: data.result, tag: data.tags, note: data.notes }),
        result: data.result ?? null,
        winner: null,
        notes: data.notes || null,
        tags: data.tags || null,
      }

      if (data.handId) {
        const res = await fetch("/api/hands", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: data.handId, ...body, isComplete: true }),
        })
        const json = await res.json()
        if (json.success) {
          setIncompleteHands((prev) => prev.filter((h) => h.id !== data.handId))
          setShowQuickEntry(false)
          setCompletingHand(null)
          setMsg({ type: "success", text: "手牌记录已补全并保存" })
          setTimeout(() => setMsg(null), 3000)
        } else {
          setMsg({ type: "error", text: json.error || "保存失败" })
        }
        return
      }

      const res = await fetch("/api/hands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, isComplete: false, quickMode: true }),
      })
      const json = await res.json()
      if (json.success) {
        const newIncomplete: HandRecord = {
          id: json.data?.id,
          date: body.date,
          seasonId: body.seasonId,
          sessionId: body.sessionId || undefined,
          players: body.players,
          handType: body.handType,
          board: body.board,
          actions: body.actions,
          result: body.result ?? undefined,
          winner: undefined,
          notes: body.notes || "",
          tags: body.tags || "",
          isComplete: false,
          quickMode: true,
          createdAt: new Date().toISOString(),
        }
        setIncompleteHands((prev) => [newIncomplete, ...prev])
        setShowQuickEntry(false)
        setMsg({ type: "success", text: "手牌快速记录已保存，可在下方补全" })
        setTimeout(() => setMsg(null), 3000)
      } else {
        setMsg({ type: "error", text: json.error || "保存失败" })
      }
    } catch {
      setMsg({ type: "error", text: "网络错误" })
    }
  }, [activeSeasonId])

  // Click "complete" on an incomplete hand -> open HandWizard with pre-filled data
  const handleCompleteHand = useCallback((hand: HandRecord) => {
    setCompletingHand(hand)
    setShowWizard(true)
  }, [])

  return (
    <div className="space-y-4">
      {msg && (
        <Alert variant={msg.type === "error" ? "destructive" : "default"}
          className={msg.type === "success" ? "border-emerald-500/30 bg-emerald-500/10" : ""}>
          <AlertDescription className="text-sm">{msg.text}</AlertDescription>
        </Alert>
      )}

      <Card className="border-border/40 bg-card/60 backdrop-blur">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="text-lg">🃏</span> 手牌记录 + GTO分析
            </CardTitle>
            {!showWizard && !showQuickEntry && !completingHand && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowQuickEntry(true)}
                  className="text-orange-400 border-orange-500/40 hover:bg-orange-500/20"
                >
                  快速记录
                </Button>
                <Button size="sm" onClick={() => setShowWizard(true)}>
                  完整记录
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {completingHand ? (
            <HandWizard
              onSave={handleWizardSave}
              onCancel={() => { setShowWizard(false); setCompletingHand(null) }}
              players={stats.players.map((p) => p.name)}
              activeSeasonId={activeSeasonId}
            />
          ) : showWizard ? (
            <HandWizard
              onSave={handleWizardSave}
              onCancel={() => setShowWizard(false)}
              players={stats.players.map((p) => p.name)}
              activeSeasonId={activeSeasonId}
            />
          ) : showQuickEntry ? (
            <QuickEntryWizard
              onSave={handleQuickSave}
              onCancel={() => setShowQuickEntry(false)}
            />
          ) : (
            <div className="space-y-3">
              {/* Incomplete hands section */}
              {incompleteHands.length > 0 && (
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-1.5 text-sm text-orange-400 font-medium">
                    <span>⚠️</span> 未完成的手牌
                    <Badge variant="outline" className="text-orange-400 border-orange-500/40 bg-orange-500/10 text-[10px]">
                      {incompleteHands.length}
                    </Badge>
                  </div>
                  {incompleteHands.map((hand) => (
                    <IncompleteHandCard key={hand.id} hand={hand} onComplete={handleCompleteHand} />
                  ))}
                </div>
              )}

              {/* Complete saved hands */}
              {savedHands.length > 0 ? (
                <div className="space-y-3">
                  {incompleteHands.length > 0 && (
                    <div className="border-t border-border/30 pt-3" />
                  )}
                  {savedHands.map((hand, i) => (
                    <div key={hand.id || i} className="p-3 border border-border/50 rounded-lg bg-muted/10 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{hand.date}</span>
                          <span className="text-xs text-muted-foreground font-mono">
                            ★{hand.heroPosition} | {hand.numPlayers}人 | {hand.blinds.sb}/{hand.blinds.bb}
                          </span>
                          {hand.winner && hand.winner.length > 0 && (
                            <span className="text-xs text-emerald-400 font-mono">
                              🏆 {Array.isArray(hand.winner) ? hand.winner.join(", ") : String(hand.winner)}
                            </span>
                          )}
                          {hand.sessionId && (
                            <span className="text-[10px] text-muted-foreground/60 font-mono">
                              对局#{hand.sessionId.slice(0, 6)}
                            </span>
                          )}
                        </div>
                        {hand.result !== 0 && (
                          <span className={`font-mono text-sm font-semibold ${hand.result > 0 ? "text-emerald-400" : "text-red-400"}`}>
                            {hand.result > 0 ? "+" : ""}{hand.result}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-muted-foreground">手牌:</span>
                        {hand.heroCards.map((c: PokerCard) => <CardDisplay key={c} card={c} size="sm" />)}
                      </div>
                      {(hand.flopCards.length > 0 || hand.turnCard || hand.riverCard) && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-muted-foreground">公共牌:</span>
                          {hand.flopCards.map((c: PokerCard) => <CardDisplay key={c} card={c} size="sm" />)}
                          {hand.turnCard && <CardDisplay card={hand.turnCard} size="sm" />}
                          {hand.riverCard && <CardDisplay card={hand.riverCard} size="sm" />}
                        </div>
                      )}
                      <div className="space-y-1.5">
                        {hand.history.map((actions, si) => {
                          if (actions.length === 0) return null
                          const labels = ["翻前", "翻牌", "转牌", "河牌"]
                          return (
                            <div key={si} className="space-y-0.5">
                              <span className="text-[10px] text-muted-foreground font-medium">{labels[si]}</span>
                              <div className="flex flex-wrap gap-1">
                                {actions.map((a: GameAction, j: number) => (
                                  <span key={`${a.position}-${j}`}>{formatActionLine(a, hand.heroPosition as Position)}</span>
                                ))}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      {hand.notes && <p className="text-xs text-muted-foreground italic">"{hand.notes}"</p>}
                      {hand.tags && (
                        <div className="flex gap-1">
                          {hand.tags.split(",").map((tag: string, j: number) => (
                            <span key={j} className="text-[10px] px-1.5 py-0.5 rounded bg-muted/20 text-muted-foreground">{tag.trim()}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : incompleteHands.length === 0 ? (
                <div className="text-center py-8 space-y-3">
                  <div className="text-3xl">🃏</div>
                  <p className="text-sm text-muted-foreground">
                    记录经典手牌 · 牌力评估 · 胜率 · Outs · 底池赔率
                  </p>
                  <p className="text-xs text-muted-foreground">
                    基于 poker_ai 游戏引擎模型：选中手牌 → 配置盲注 → 按次序记录下注轮次 → 分析
                  </p>
                </div>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
