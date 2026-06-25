"use client"

import { useState, useMemo, useCallback } from "react"
import { SearchIcon, XIcon } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"
import type { HandRecord } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { CardDisplay, formatActionLine, parseCardCode } from "./card-selector"
import {
  cardName, type Card as PokerCard, type Position, type GameAction,
} from "./poker-engine"
import { ScoreDisplay } from "@/components/poker/common/score-display"
import {
  Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyMedia, EmptyContent,
} from "@/components/ui/empty"

// ── Internal helpers ───────────────────────────────────────────

/** Parse the `actions` JSON field into structured display data. */
function parseHandActions(hand: HandRecord): {
  heroCards: PokerCard[]
  heroPosition: Position
  numPlayers: number
  history: GameAction[][]
} {
  if (!hand.actions) {
    return { heroCards: [], heroPosition: "CO", numPlayers: 6, history: [] }
  }
  try {
    const parsed = JSON.parse(hand.actions)
    const heroCards = (parsed.heroCards || [])
      .map((c: string) => parseCardCode(c))
      .filter(Boolean) as PokerCard[]
    return {
      heroCards,
      heroPosition: (parsed.heroPosition as Position) || "CO",
      numPlayers: parsed.numPlayers || 6,
      history: parsed.history || [],
    }
  } catch {
    return { heroCards: [], heroPosition: "CO", numPlayers: 6, history: [] }
  }
}

/** Parse board string into flop / turn / river card arrays. */
function parseBoard(hand: HandRecord): {
  flopCards: PokerCard[]
  turnCard: PokerCard | null
  riverCard: PokerCard | null
} {
  const codes = hand.board ? hand.board.split(" ").filter(Boolean) : []
  const flopCards = codes.slice(0, 3).map((c) => parseCardCode(c)).filter(Boolean) as PokerCard[]
  const turnCard = codes.length > 3 ? (parseCardCode(codes[3]) as PokerCard | null) : null
  const riverCard = codes.length > 4 ? (parseCardCode(codes[4]) as PokerCard | null) : null
  return { flopCards, turnCard, riverCard }
}

/** Extract winner positions from HandRecord.winner string. */
function parseWinner(hand: HandRecord): Position[] {
  return hand.winner
    ? hand.winner.split(",").map((p) => p.trim()).filter(Boolean) as Position[]
    : []
}

// ── Types ──────────────────────────────────────────────────────

export type StatusFilterValue = "all" | "complete" | "incomplete"

export interface HandBrowserProps {
  /** All hand records — both complete and incomplete. */
  hands: HandRecord[]
  /** Loading state displayed during initial fetch. */
  loading?: boolean
  /** Session options for the session filter dropdown. */
  sessionOptions?: { id: string; date: string }[]
  /** Called when a hand card is clicked. */
  onHandClick?: (hand: HandRecord) => void
}

// ── Component ──────────────────────────────────────────────────

const STATUS_FILTERS: {
  value: StatusFilterValue
  label: string
  color: string
}[] = [
  { value: "all", label: "全部", color: "text-foreground" },
  { value: "complete", label: "已完成", color: "text-emerald-400" },
  { value: "incomplete", label: "待补全", color: "text-orange-400" },
]

export function HandBrowser({
  hands,
  loading = false,
  sessionOptions,
  onHandClick,
}: HandBrowserProps) {
  // ── Filter state ─────────────────────────────────────────
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("all")
  const [sessionFilter, setSessionFilter] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  // Debounce so filtering doesn't re-run on every keystroke.
  const debouncedSearchQuery = useDebounce(searchQuery, 250)

  // ── Derived: filter results ──────────────────────────────
  const hasActiveFilter =
    statusFilter !== "all" || sessionFilter !== "" || searchQuery.trim().length > 0

  const filteredHands = useMemo(() => {
    let result = [...hands].sort((a, b) => b.date.localeCompare(a.date))

    // Status filter
    if (statusFilter === "complete") {
      result = result.filter((h) => h.isComplete)
    } else if (statusFilter === "incomplete") {
      result = result.filter((h) => !h.isComplete)
    }

    // Session filter
    if (sessionFilter) {
      result = result.filter((h) => h.sessionId === sessionFilter)
    }

    // Text search across date, tags, notes
    // Uses debounced query so rapid typing doesn't re-filter on every keystroke.
    const query = debouncedSearchQuery.trim().toLowerCase()
    if (query) {
      result = result.filter((h) => {
        if (h.date.toLowerCase().includes(query)) return true
        if (h.tags?.toLowerCase().includes(query)) return true
        if (h.notes?.toLowerCase().includes(query)) return true
        // Search in parsed hero cards
        const info = parseHandActions(h)
        const cardStr = info.heroCards.map(cardName).join(" ").toLowerCase()
        if (cardStr.includes(query)) return true
        return false
      })
    }

    return result
  }, [hands, statusFilter, sessionFilter, debouncedSearchQuery])

  // Handlers
  const clearSearch = useCallback(() => setSearchQuery(""), [])

  const clearAllFilters = useCallback(() => {
    setStatusFilter("all")
    setSessionFilter("")
    setSearchQuery("")
  }, [])

  // ── Count badges ────────────────────────────────────────
  const completeCount = hands.filter((h) => h.isComplete).length
  const incompleteCount = hands.filter((h) => !h.isComplete).length

  // ── Render: loading ─────────────────────────────────────
  if (loading) {
    return (
      <Card className="border-border/40 bg-card/60 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="text-lg">🃏</span> 手牌记录
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12 text-muted-foreground/60">
            <div className="flex flex-col items-center gap-2">
              <div className="size-5 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
              <span className="text-sm">加载手牌记录中...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // ── Render: empty — no data at all ──────────────────────
  if (hands.length === 0) {
    return (
      <Card className="border-border/40 bg-card/60 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="text-lg">🃏</span> 手牌记录
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filterBar({
            statusFilter,
            sessionFilter,
            searchQuery,
            sessionOptions,
            hasActiveFilter,
            onStatusChange: setStatusFilter,
            onSessionChange: setSessionFilter,
            onSearchChange: setSearchQuery,
            onClearSearch: clearSearch,
            onClearAll: clearAllFilters,
          })}
          <Empty className="py-10">
            <EmptyMedia>🃏</EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>暂无手牌记录</EmptyTitle>
              <EmptyDescription>
                使用「完整记录」或「快速记录」来录入第一手牌
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    )
  }

  // ── Render: filtered empty ──────────────────────────────
  if (filteredHands.length === 0) {
    return (
      <Card className="border-border/40 bg-card/60 backdrop-blur">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="text-lg">🃏</span> 手牌记录
            </CardTitle>
            <div className="flex gap-2 text-xs text-muted-foreground">
              {completeCount > 0 && (
                <span className="text-emerald-400">{completeCount} 已完成</span>
              )}
              {incompleteCount > 0 && (
                <span className="text-orange-400">{incompleteCount} 待补全</span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filterBar({
            statusFilter,
            sessionFilter,
            searchQuery,
            sessionOptions,
            hasActiveFilter,
            onStatusChange: setStatusFilter,
            onSessionChange: setSessionFilter,
            onSearchChange: setSearchQuery,
            onClearSearch: clearSearch,
            onClearAll: clearAllFilters,
          })}
          <Empty className="py-10">
            <EmptyMedia>🔍</EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>没有匹配的记录</EmptyTitle>
              <EmptyDescription>
                试试调整筛选条件或搜索关键词
              </EmptyDescription>
              <EmptyContent>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllFilters}
                  className="mt-2"
                >
                  清除筛选条件
                </Button>
              </EmptyContent>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    )
  }

  // ── Render: data ────────────────────────────────────────
  return (
    <Card className="border-border/40 bg-card/60 backdrop-blur">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="text-lg">🃏</span> 手牌记录
          </CardTitle>
          <div className="flex gap-2 text-xs text-muted-foreground">
            {completeCount > 0 && (
              <span className="text-emerald-400">{completeCount} 已完成</span>
            )}
            {incompleteCount > 0 && (
              <span className="text-orange-400">{incompleteCount} 待补全</span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          {filterBar({
            statusFilter,
            sessionFilter,
            searchQuery,
            sessionOptions,
            hasActiveFilter,
            onStatusChange: setStatusFilter,
            onSessionChange: setSessionFilter,
            onSearchChange: setSearchQuery,
            onClearSearch: clearSearch,
            onClearAll: clearAllFilters,
          })}
        </div>

        <div className="space-y-2">
          {filteredHands.map((hand) => (
            <HandRecordCard
              key={hand.id}
              hand={hand}
              onClick={onHandClick ? () => onHandClick(hand) : undefined}
            />
          ))}
        </div>

        {filteredHands.length > 0 && (
          <div className="mt-3 text-center text-[11px] text-muted-foreground/50">
            共 {filteredHands.length} 条记录
            {filteredHands.length < hands.length && (
              <span>（已筛选，总计 {hands.length} 条）</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ── Hand record card ───────────────────────────────────────────

interface HandRecordCardProps {
  hand: HandRecord
  onClick?: () => void
}

function HandRecordCard({ hand, onClick }: HandRecordCardProps) {
  const handActions = useMemo(() => parseHandActions(hand), [hand])
  const boardCards = useMemo(() => parseBoard(hand), [hand])
  const winners = useMemo(() => parseWinner(hand), [hand])
  const hasBoard = boardCards.flopCards.length > 0 || boardCards.turnCard || boardCards.riverCard

  return (
    <div
      role="button"
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") onClick() } : undefined}
      className={cn(
        "border border-border/50 rounded-lg p-3 space-y-2 transition-colors",
        hand.isComplete
          ? "bg-muted/10"
          : "bg-orange-500/5 border-l-2 border-l-orange-500",
        onClick && "cursor-pointer hover:bg-accent/30",
      )}
    >
      {/* Header row: date, status, session */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-medium shrink-0">{hand.date}</span>
          {!hand.isComplete && (
            <Badge
              variant="outline"
              className="text-orange-400 border-orange-500/40 bg-orange-500/10 text-[10px] shrink-0"
            >
              待补全
            </Badge>
          )}
          {hand.quickMode && (
            <span className="text-[10px] text-muted-foreground/60 font-mono shrink-0">
              快速记录
            </span>
          )}
          {hand.sessionId && (
            <span className="text-[10px] text-muted-foreground/60 font-mono truncate hidden sm:inline">
              对局#{hand.sessionId.slice(0, 6)}
            </span>
          )}
        </div>
        {hand.result !== undefined && hand.result !== null && hand.result !== 0 && (
          <ScoreDisplay score={hand.result} className="text-sm font-semibold shrink-0" />
        )}
      </div>

      {/* Hero cards + position */}
      {handActions.heroCards.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-muted-foreground shrink-0">手牌:</span>
          <div className="flex items-center gap-1">
            {handActions.heroCards.map((c) => (
              <CardDisplay key={c} card={c} size="sm" />
            ))}
          </div>
          {handActions.heroPosition && (
            <span className="text-[11px] font-mono text-primary font-medium">
              ★{handActions.heroPosition}
            </span>
          )}
          {handActions.numPlayers > 0 && (
            <span className="text-[10px] text-muted-foreground font-mono">
              {handActions.numPlayers}人
            </span>
          )}
        </div>
      )}

      {/* Board cards */}
      {hasBoard && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-muted-foreground shrink-0">公共牌:</span>
          <div className="flex items-center gap-1">
            {boardCards.flopCards.map((c) => (
              <CardDisplay key={c} card={c} size="sm" />
            ))}
            {boardCards.turnCard && <CardDisplay card={boardCards.turnCard} size="sm" />}
            {boardCards.riverCard && <CardDisplay card={boardCards.riverCard} size="sm" />}
          </div>
        </div>
      )}

      {/* Winners */}
      {winners.length > 0 && (
        <div className="text-xs text-emerald-400">
          🏆 {winners.join(", ")}
        </div>
      )}

      {/* Action history (compact) */}
      {handActions.history.length > 0 && (
        <div className="space-y-0.5">
          {handActions.history.map((actions, si) => {
            if (actions.length === 0) return null
            const labels = ["翻前", "翻牌", "转牌", "河牌"]
            return (
              <div key={si} className="flex items-baseline gap-1.5">
                <span className="text-[10px] text-muted-foreground font-medium shrink-0 w-6">
                  {labels[si]}
                </span>
                <div className="flex flex-wrap gap-1">
                  {actions.slice(0, 3).map((a, j) => (
                    <span key={j}>{formatActionLine(a, handActions.heroPosition)}</span>
                  ))}
                  {actions.length > 3 && (
                    <span className="text-[11px] text-muted-foreground">
                      +{actions.length - 3}...
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Tags */}
      {hand.tags && (
        <div className="flex gap-1 flex-wrap">
          {hand.tags.split(",").map((tag, j) => (
            <span
              key={j}
              className={cn(
                "text-[10px] px-1.5 py-0.5 rounded",
                hand.isComplete
                  ? "bg-muted/20 text-muted-foreground"
                  : "bg-orange-500/10 text-orange-300",
              )}
            >
              {tag.trim()}
            </span>
          ))}
        </div>
      )}

      {/* Notes (truncated) */}
      {hand.notes && (
        <p className="text-xs text-muted-foreground italic truncate">
          &ldquo;{hand.notes}&rdquo;
        </p>
      )}
    </div>
  )
}

// ── Filter bar (shared across all render paths) ────────────────

interface FilterBarProps {
  statusFilter: StatusFilterValue
  sessionFilter: string
  searchQuery: string
  sessionOptions?: { id: string; date: string }[]
  hasActiveFilter: boolean
  onStatusChange: (v: StatusFilterValue) => void
  onSessionChange: (v: string) => void
  onSearchChange: (v: string) => void
  onClearSearch: () => void
  onClearAll: () => void
}

function filterBar({
  statusFilter,
  sessionFilter,
  searchQuery,
  sessionOptions,
  hasActiveFilter,
  onStatusChange,
  onSessionChange,
  onSearchChange,
  onClearSearch,
  onClearAll,
}: FilterBarProps) {
  return (
    <div className="space-y-3">
      {/* Search + session filter row */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60 pointer-events-none" />
          <Input
            placeholder="搜索日期、标签、笔记..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8 h-9 text-sm bg-background/60"
          />
          {searchQuery && (
            <button
              onClick={onClearSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
              aria-label="清除搜索"
            >
              <XIcon className="size-4" />
            </button>
          )}
        </div>

        {/* Session filter — only show if we have session options */}
        {sessionOptions && sessionOptions.length > 0 && (
          <div className="w-[140px] shrink-0">
            <select
              value={sessionFilter}
              onChange={(e) => onSessionChange(e.target.value)}
              className="w-full h-9 rounded-md border border-border bg-background/60 px-2.5 text-sm text-muted-foreground"
              aria-label="按对局筛选"
            >
              <option value="">全部对局</option>
              {sessionOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.date} #{s.id.slice(0, 5)}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Status filter chips */}
      <div className="flex flex-wrap gap-1.5">
        {STATUS_FILTERS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onStatusChange(opt.value)}
            className={cn(
              "px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200",
              statusFilter === opt.value
                ? "bg-primary/15 text-primary ring-1 ring-primary/30"
                : "bg-muted/40 text-muted-foreground/70 hover:bg-muted/70 hover:text-foreground/80",
            )}
          >
            {opt.label}
          </button>
        ))}

        {/* Clear filter button */}
        {hasActiveFilter && (
          <button
            onClick={onClearAll}
            className="px-2 py-1 rounded-full text-xs font-medium text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/30 transition-all"
          >
            清除筛选
          </button>
        )}
      </div>
    </div>
  )
}
