"use client"

import { useState, useMemo, useCallback } from "react"
import { SearchIcon, XIcon } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"
import type { PokerRecord, GameSession } from "@/lib/types"
import { SESSION_STATUS } from "@/lib/constants"
import { SessionCard } from "./session-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface SessionListProps {
  sessions: GameSession[]
  records: PokerRecord[]
  seasonName?: string
  onSessionClick?: (session: GameSession) => void
  onEditSession?: (session: GameSession, records: { player: string; score: number }[]) => void
  onDeleteSession?: (session: GameSession) => void
}

type StatusFilterValue = "all" | "pending" | "collected" | "confirmed"

const STATUS_FILTER_OPTIONS: {
  value: StatusFilterValue
  label: string
  color: string
}[] = [
  { value: "all", label: "全部", color: "text-foreground" },
  { value: "pending", label: "等待录入", color: "text-gray-400" },
  { value: "collected", label: "待确认", color: "text-blue-400" },
  { value: "confirmed", label: "已确认", color: "text-emerald-400" },
]

export function SessionList({
  sessions,
  records,
  seasonName,
  onSessionClick,
  onEditSession,
  onDeleteSession,
}: SessionListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("all")

  // Debounce the search query so filtering only recalculates after
  // the user pauses typing (250ms).  The input remains responsive
  // because `searchQuery` still drives `value` immediately.
  const debouncedSearchQuery = useDebounce(searchQuery, 250)

  const sessionRecordsMap = useMemo(() => {
    const map: Record<string, { player: string; score: number }[]> = {}
    for (const r of records) {
      const sid = r.sessionId
      if (!sid) continue
      if (!map[sid]) map[sid] = []
      map[sid].push({ player: r.player, score: r.score })
    }
    return map
  }, [records])

  const dateRecordsMap = useMemo(() => {
    const map: Record<string, { player: string; score: number }[]> = {}
    for (const r of records) {
      if (!map[r.date]) map[r.date] = []
      map[r.date].push({ player: r.player, score: r.score })
    }
    return map
  }, [records])

  // ── Filtering logic ──────────────────────────────────────

  const hasActiveFilter = statusFilter !== "all" || searchQuery.trim().length > 0

  const filteredSessions = useMemo(() => {
    let result = [...sessions].sort((a, b) => b.date.localeCompare(a.date))

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((s) => s.status === statusFilter)
    }

    // Search filter — matches date or any player name in the session's records
    // Uses debounced query so rapid typing doesn't re-filter on every keystroke
    const query = debouncedSearchQuery.trim().toLowerCase()
    if (query) {
      result = result.filter((session) => {
        if (session.date.toLowerCase().includes(query)) return true
        const recs = sessionRecordsMap[session.id] || []
        return recs.some((r) => r.player.toLowerCase().includes(query))
      })
    }

    return result
  }, [sessions, statusFilter, debouncedSearchQuery, sessionRecordsMap])

  // Counts for the header badges (unfiltered so they reflect the whole dataset)
  const pendingCount = sessions.filter((s) => s.status === SESSION_STATUS.PENDING).length
  const collectedCount = sessions.filter((s) => s.status === SESSION_STATUS.COLLECTED).length
  const confirmedCount = sessions.filter((s) => s.status === SESSION_STATUS.CONFIRMED).length

  // Date-grouped view when no GameSession objects exist (mode 2)
  const showDateGroupedView = sessions.length === 0 && records.length > 0

  const filteredDates = useMemo(() => {
    if (!showDateGroupedView) return []
    const query = debouncedSearchQuery.trim().toLowerCase()
    const allDates = [...new Set(records.map((r) => r.date))]
      .sort()
      .reverse()

    if (!query) return allDates

    return allDates.filter((date) => {
      if (date.toLowerCase().includes(query)) return true
      const recs = dateRecordsMap[date] || []
      return recs.some((r) => r.player.toLowerCase().includes(query))
    })
  }, [showDateGroupedView, records, debouncedSearchQuery, dateRecordsMap])

  // ── Handlers ─────────────────────────────────────────────

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }, [])

  const handleShareDate = useCallback(
    (date: string, recs: { player: string; score: number }[]) => {
      const event = new CustomEvent("poker:share", {
        detail: {
          date,
          seasonName,
          entries: recs,
        },
      })
      window.dispatchEvent(event)
    },
    [seasonName],
  )

  const clearSearch = useCallback(() => setSearchQuery(""), [])

  // ── Shared filter bar ────────────────────────────────────

  const filterBar = (
    <div className="space-y-3">
      {/* Search input */}
      <div className="relative">
        <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60 pointer-events-none" />
        <Input
          placeholder="搜索日期或玩家..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8 h-9 text-sm bg-background/60"
        />
        {searchQuery && (
          <button
            onClick={clearSearch}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            aria-label="清除搜索"
          >
            <XIcon className="size-4" />
          </button>
        )}
      </div>

      {/* Status filter chips */}
      <div className="flex flex-wrap gap-1.5">
        {STATUS_FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setStatusFilter(opt.value)}
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

        {/* Clear filter button — only visible when a filter is active */}
        {hasActiveFilter && (
          <button
            onClick={() => {
              setStatusFilter("all")
              setSearchQuery("")
            }}
            className="px-2 py-1 rounded-full text-xs font-medium text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/30 transition-all"
          >
            清除筛选
          </button>
        )}
      </div>
    </div>
  )

  // ── Empty state — no data at all ─────────────────────────

  if (sessions.length === 0 && records.length === 0) {
    return (
      <Card className="border-border/40 bg-card/60 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="text-lg">📋</span> 历史场次
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filterBar}
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground/60">
            <span className="text-4xl mb-3 opacity-30">📭</span>
            <p className="text-sm">暂无场次记录</p>
            <p className="text-xs mt-1">去「记录」页面录入第一场数据吧</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // ── Mode 2: date-grouped view (sessions array empty) ─────

  if (showDateGroupedView) {
    return (
      <Card className="border-border/40 bg-card/60 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="text-lg">📋</span> 历史场次
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filterBar}

          {filteredDates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground/60">
              <span className="text-3xl mb-2 opacity-30">🔍</span>
              <p className="text-sm">没有匹配的场次</p>
              <button
                onClick={() => {
                  setStatusFilter("all")
                  setSearchQuery("")
                }}
                className="text-xs text-primary/70 hover:text-primary mt-2 underline underline-offset-2"
              >
                清除筛选条件
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredDates.map((date) => {
                const dateRecs = dateRecordsMap[date] || []
                const total = dateRecs.reduce((s, r) => s + r.score, 0)
                const sorted = [...dateRecs].sort((a, b) => b.score - a.score)
                const isExpanded = expandedId === date

                return (
                  <div
                    key={date}
                    className="border border-border/50 rounded-lg p-3 hover:bg-card/60 transition-colors"
                  >
                    <div
                      className="flex items-center justify-between focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 rounded"
                      role="button" tabIndex={0}
                      onClick={() => handleToggleExpand(date)}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleToggleExpand(date) } }}
                    >
                      <span className="text-sm font-medium">{date}</span>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{dateRecs.length} 人</span>
                        <span
                          className={`font-mono ${total > 0 ? "text-emerald-500" : total < 0 ? "text-red-500" : "text-muted-foreground"}`}
                        >
                          合计: {total > 0 ? "+" : ""}
                          {total}
                        </span>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="mt-2 space-y-1 border-t border-border/30 pt-2">
                        {sorted.map((r, i) => (
                          <div
                            key={r.player || `player-${i}`}
                            className="flex justify-between text-sm"
                          >
                            <span
                              className={i < 3 ? "font-medium" : "text-muted-foreground"}
                            >
                              {i === 0 && "🥇 "}
                              {i === 1 && "🥈 "}
                              {i === 2 && "🥉 "}
                              {r.player}
                            </span>
                            <span
                              className={`font-mono ${r.score > 0 ? "text-emerald-500" : r.score < 0 ? "text-red-500" : ""}`}
                            >
                              {r.score > 0 ? "+" : ""}
                              {r.score}
                            </span>
                          </div>
                        ))}
                        <div className="pt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-7 px-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleShareDate(date, sorted)
                            }}
                          >
                            📸 分享本场
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // ── Mode 1: GameSession cards (primary path) ─────────────

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="text-lg">📋</span> 历史场次
          </CardTitle>
          <div className="flex gap-2 text-xs text-muted-foreground">
            {pendingCount > 0 && (
              <span className="text-gray-400">{pendingCount} 等待录入</span>
            )}
            {collectedCount > 0 && (
              <span className="text-blue-400">{collectedCount} 待确认</span>
            )}
            {confirmedCount > 0 && (
              <span className="text-emerald-400">{confirmedCount} 已确认</span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">{filterBar}</div>

        {filteredSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground/60">
            <span className="text-3xl mb-2 opacity-30">🔍</span>
            <p className="text-sm">没有匹配的场次</p>
            <button
              onClick={() => {
                setStatusFilter("all")
                setSearchQuery("")
              }}
              className="text-xs text-primary/70 hover:text-primary mt-2 underline underline-offset-2"
            >
              清除筛选条件
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredSessions.map((session) => (
              <div key={session.id} className="relative">
                <SessionCard
                  session={session}
                  records={sessionRecordsMap[session.id] || []}
                  expanded={expandedId === session.id}
                  onClick={() => {
                    handleToggleExpand(session.id)
                    onSessionClick?.(session)
                  }}
                  onEdit={() => {
                    onEditSession?.(session, sessionRecordsMap[session.id] || [])
                  }}
                  onDelete={() => {
                    onDeleteSession?.(session)
                  }}
                />
                {expandedId === session.id &&
                  sessionRecordsMap[session.id]?.length > 0 && (
                    <div className="px-4 pb-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7 px-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleShareDate(
                            session.date,
                            sessionRecordsMap[session.id],
                          )
                        }}
                      >
                        📸 分享本场
                      </Button>
                    </div>
                  )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
