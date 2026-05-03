"use client"

import { useState, useMemo, useCallback } from "react"
import type { PokerRecord, GameSession } from "@/lib/types"
import { SESSION_STATUS } from "@/lib/constants"
import { SessionCard } from "./session-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface SessionListProps {
  sessions: GameSession[]
  records: PokerRecord[]
  seasonName?: string
  onSessionClick?: (session: GameSession) => void
}

export function SessionList({ sessions, records, seasonName, onSessionClick }: SessionListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const sessionRecordsMap = useMemo(() => {
    const map: Record<string, { player: string; score: number }[]> = {}
    for (const r of records) {
      const sid = (r as any).sessionId
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

  const sortedSessions = useMemo(
    () => [...sessions].sort((a, b) => b.date.localeCompare(a.date)),
    [sessions]
  )

  const pendingCount = sessions.filter((s) => s.status === SESSION_STATUS.PENDING).length
  const confirmedCount = sessions.filter((s) => s.status === SESSION_STATUS.CONFIRMED).length

  const handleShareDate = useCallback((date: string, recs: { player: string; score: number }[]) => {
    const event = new CustomEvent("poker:share", {
      detail: {
        date,
        seasonName,
        entries: recs,
      },
    })
    window.dispatchEvent(event)
  }, [seasonName])

  if (sessions.length === 0) {
    const dates = [...new Set(records.map((r) => r.date))].sort().reverse()
    return (
      <Card className="border-border/40 bg-card/60 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="text-lg">📋</span> 历史场次
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {dates.map((date) => {
              const dateRecs = dateRecordsMap[date] || []
              const total = dateRecs.reduce((s, r) => s + r.score, 0)
              const sorted = [...dateRecs].sort((a, b) => b.score - a.score)
              const isExpanded = expandedId === date

              return (
                <div
                  key={date}
                  className="border border-border/50 rounded-lg p-3 cursor-pointer hover:bg-card/60 transition-colors"
                >
                  <div
                    className="flex items-center justify-between"
                    onClick={() => setExpandedId(isExpanded ? null : date)}
                  >
                    <span className="text-sm font-medium">{date}</span>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{dateRecs.length} 人</span>
                      <span className={`font-mono ${total === 0 ? "text-emerald-500" : "text-red-500"}`}>
                        合计: {total > 0 ? "+" : ""}{total}
                      </span>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="mt-2 space-y-1 border-t border-border/30 pt-2">
                      {sorted.map((r, i) => (
                        <div key={r.player || `player-${i}`} className="flex justify-between text-sm">
                          <span className={i < 3 ? "font-medium" : "text-muted-foreground"}>
                            {i === 0 && "🥇 "}{i === 1 && "🥈 "}{i === 2 && "🥉 "}
                            {r.player}
                          </span>
                          <span className={`font-mono ${r.score > 0 ? "text-emerald-500" : r.score < 0 ? "text-red-500" : ""}`}>
                            {r.score > 0 ? "+" : ""}{r.score}
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
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="text-lg">📋</span> 历史场次
          </CardTitle>
          <div className="flex gap-2 text-xs text-muted-foreground">
            {pendingCount > 0 && (
              <span className="text-amber-400">{pendingCount} 待录入</span>
            )}
            {confirmedCount > 0 && (
              <span className="text-emerald-400">{confirmedCount} 已确认</span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {sortedSessions.map((session) => (
            <div key={session.id} className="relative">
              <SessionCard
                session={session}
                records={sessionRecordsMap[session.id] || []}
                expanded={expandedId === session.id}
                onClick={() => {
                  setExpandedId(expandedId === session.id ? null : session.id)
                  onSessionClick?.(session)
                }}
              />
              {expandedId === session.id && sessionRecordsMap[session.id]?.length > 0 && (
                <div className="px-4 pb-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7 px-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleShareDate(session.date, sessionRecordsMap[session.id])
                    }}
                  >
                    📸 分享本场
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
