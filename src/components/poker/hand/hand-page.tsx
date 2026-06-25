"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import type { PokerRecord, ComputedStats, HandRecord } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { HandWizard, type HandWizardData } from "./hand-wizard"
import { QuickEntryWizard, type QuickEntrySaveData } from "./quick-entry-wizard"
import { parseCardCode, type Card as PokerCard, type GameAction, type Position } from "./card-selector"
import { cardName } from "./poker-engine"
import { HandBrowser } from "./hand-browser"
import { STORAGE_KEY_HANDS_CACHE } from "@/lib/constants"

interface HandPageProps {
  records: PokerRecord[]
  stats: ComputedStats
  activeSeasonId?: string
}

/** 将 HandRecord 的 actions JSON、board 等字段解析为 HandWizardData 的部分结构 */
function parseHandRecordToWizardData(hand: HandRecord): Partial<HandWizardData> {
  let heroCards: PokerCard[] = []
  let heroPosition: Position = "CO"
  let numPlayers = 6
  let blinds = { sb: 50, bb: 100 }
  let history: GameAction[][] = [[], [], [], []]

  if (hand.actions) {
    try {
      const parsed = JSON.parse(hand.actions)
      heroCards = (parsed.heroCards || []).map((c: string) => parseCardCode(c)).filter(Boolean) as PokerCard[]
      heroPosition = (parsed.heroPosition as Position) || "CO"
      numPlayers = parsed.numPlayers || 6
      blinds = parsed.blinds || { sb: 50, bb: 100 }
      history = parsed.history || [[], [], [], []]
    } catch {
      // actions 字段格式异常时使用默认值
    }
  }

  // board 字符串 → flop(3张) / turn(第4张) / river(第5张)
  const boardCodes = hand.board ? hand.board.split(" ").filter(Boolean) : []
  const flopCards = boardCodes.slice(0, 3).map((c) => parseCardCode(c)).filter(Boolean) as PokerCard[]
  const turnCard = boardCodes.length > 3 ? (parseCardCode(boardCodes[3]) as PokerCard | null) : null
  const riverCard = boardCodes.length > 4 ? (parseCardCode(boardCodes[4]) as PokerCard | null) : null

  // winner 逗号分隔字符串 → Position[]
  const winner: Position[] = hand.winner
    ? hand.winner.split(",").map((p) => p.trim()).filter(Boolean) as Position[]
    : []

  return {
    date: hand.date,
    heroCards,
    heroPosition,
    numPlayers,
    blinds,
    history,
    flopCards,
    turnCard,
    riverCard,
    result: hand.result ?? 0,
    winner,
    notes: hand.notes || "",
    tags: hand.tags || "",
    sessionId: hand.sessionId,
  }
}

export function HandPage({ stats, activeSeasonId }: HandPageProps) {
  const [showWizard, setShowWizard] = useState(false)
  const [showQuickEntry, setShowQuickEntry] = useState(false)
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [completeHands, setCompleteHands] = useState<HandRecord[]>([])
  const [incompleteHands, setIncompleteHands] = useState<HandRecord[]>([])
  const [completingHand, setCompletingHand] = useState<HandRecord | null>(null)
  const [loading, setLoading] = useState(true)

  // Derive combined hands sorted by date (newest first)
  const allHands = useMemo(() => {
    return [...completeHands, ...incompleteHands].sort((a, b) => b.date.localeCompare(a.date))
  }, [completeHands, incompleteHands])

  // Re-fetch complete hands after a save operation
  const refreshCompleteHands = useCallback(async (seasonId: string) => {
    try {
      const res = await fetch(`/api/hands?season_id=${seasonId}&is_complete=true`)
      const json = await res.json()
      if (json.success && Array.isArray(json.data)) {
        setCompleteHands(json.data)
        localStorage.setItem(STORAGE_KEY_HANDS_CACHE, JSON.stringify(json.data))
      }
    } catch {
      // API 读取失败 -> 降级到 localStorage
      try {
        const cached = localStorage.getItem(STORAGE_KEY_HANDS_CACHE)
        if (cached) {
          setCompleteHands(JSON.parse(cached))
        }
      } catch {
        // localStorage 也无数据，保持空数组
      }
    }
  }, [])

  // Initial load: fetch both complete and incomplete hands
  useEffect(() => {
    if (!activeSeasonId) {
      setLoading(false)
      return
    }
    setLoading(true)

    const loadComplete = async () => {
      try {
        const res = await fetch(`/api/hands?season_id=${activeSeasonId}&is_complete=true`)
        const json = await res.json()
        if (json.success && Array.isArray(json.data)) {
          setCompleteHands(json.data)
          localStorage.setItem(STORAGE_KEY_HANDS_CACHE, JSON.stringify(json.data))
        }
      } catch {
        try {
          const cached = localStorage.getItem(STORAGE_KEY_HANDS_CACHE)
          if (cached) setCompleteHands(JSON.parse(cached))
        } catch {}
      }
    }

    const loadIncomplete = async () => {
      try {
        const res = await fetch(`/api/hands?season_id=${activeSeasonId}&is_complete=false`)
        const json = await res.json()
        if (json.success && json.data) {
          setIncompleteHands(json.data)
        }
      } catch {}
    }

    Promise.all([loadComplete(), loadIncomplete()]).finally(() => setLoading(false))
  }, [activeSeasonId])

  // Handler for saving a full hand (from HandWizard, either new or completing/editing)
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

      // If we're completing/editing an existing hand, use PUT
      if (completingHand?.id) {
        const res = await fetch("/api/hands", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: completingHand.id, ...body, isComplete: true }),
        })
        const json = await res.json()
        if (json.success) {
          setIncompleteHands((prev) => prev.filter((h) => h.id !== completingHand.id))
          setCompletingHand(null)
          setShowWizard(false)
          setMsg({ type: "success", text: "手牌记录已保存" })
          // 刷新已保存手牌列表
          if (activeSeasonId) refreshCompleteHands(activeSeasonId)
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
        setShowWizard(false)
        setMsg({ type: "success", text: "手牌记录已保存" })
        // 刷新已保存手牌列表
        if (activeSeasonId) refreshCompleteHands(activeSeasonId)
        setTimeout(() => setMsg(null), 3000)
      } else {
        setMsg({ type: "error", text: json.error || "保存失败" })
      }
    } catch {
      setMsg({ type: "error", text: "网络错误" })
    }
  }, [activeSeasonId, completingHand, refreshCompleteHands])

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

      const body = {
        date: new Date().toISOString().slice(0, 10),
        seasonId: activeSeasonId || "",
        sessionId: sessionId || null,
        players: "2",
        handType: "Holdem",
        board: "",  // 修复 OP-02: 快速模式下无公共牌，board 留空
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
          // 刷新已保存手牌列表
          if (activeSeasonId) refreshCompleteHands(activeSeasonId)
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
  }, [activeSeasonId, refreshCompleteHands])

  // Click any hand card -> open HandWizard with pre-filled data
  const handleHandClick = useCallback((hand: HandRecord) => {
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

      {completingHand ? (
        <Card className="border-border/40 bg-card/60 backdrop-blur">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="text-lg">🃏</span>
              {completingHand.isComplete ? "查看/编辑手牌" : "补全手牌"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <HandWizard
              onSave={handleWizardSave}
              onCancel={() => { setShowWizard(false); setCompletingHand(null) }}
              activeSeasonId={activeSeasonId}
              initialData={parseHandRecordToWizardData(completingHand)}
            />
          </CardContent>
        </Card>
      ) : showWizard ? (
        <Card className="border-border/40 bg-card/60 backdrop-blur">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="text-lg">🃏</span> 完整记录
            </CardTitle>
          </CardHeader>
          <CardContent>
            <HandWizard
              onSave={handleWizardSave}
              onCancel={() => setShowWizard(false)}
              activeSeasonId={activeSeasonId}
            />
          </CardContent>
        </Card>
      ) : showQuickEntry ? (
        <Card className="border-border/40 bg-card/60 backdrop-blur">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="text-lg">🃏</span> 快速记录
            </CardTitle>
          </CardHeader>
          <CardContent>
            <QuickEntryWizard
              onSave={handleQuickSave}
              onCancel={() => setShowQuickEntry(false)}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {/* Toolbar: add-hand buttons */}
          <div className="flex items-center justify-end gap-2">
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

          <HandBrowser
            hands={allHands}
            loading={loading}
            onHandClick={handleHandClick}
          />
        </div>
      )}
    </div>
  )
}
