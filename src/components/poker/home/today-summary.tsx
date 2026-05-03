"use client"

import { useMemo, useCallback } from "react"
import type { PokerRecord } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface TodaySummaryProps {
  records: PokerRecord[]
  seasonName?: string
}

export function TodaySummary({ records, seasonName }: TodaySummaryProps) {
  const today = new Date().toISOString().slice(0, 10)

  const todayRecords = useMemo(
    () => records.filter((r) => r.date === today),
    [records, today]
  )

  const sortedRecords = useMemo(
    () => [...todayRecords].sort((a, b) => b.score - a.score),
    [todayRecords]
  )

  const todayTotal = todayRecords.reduce((sum, r) => sum + r.score, 0)

  const handleShare = useCallback(() => {
    const event = new CustomEvent("poker:share", {
      detail: {
        date: today,
        seasonName,
        entries: sortedRecords.map((r) => ({ player: r.player, score: r.score })),
      },
    })
    window.dispatchEvent(event)
  }, [today, seasonName, sortedRecords])

  if (todayRecords.length === 0) {
    return (
      <Card className="border-border/40 bg-card/60 backdrop-blur">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="text-lg">📅</span> 今日速览
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            今日暂无对局记录
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="text-lg">📅</span> 今日速览
            <span className="text-xs text-muted-foreground font-normal">
              {todayRecords.length} 人
            </span>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7 px-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
            onClick={handleShare}
          >
            📸 分享
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {sortedRecords.map((r, i) => (
            <div
              key={r.player || `player-${i}`}
              className="flex items-center justify-between py-1"
            >
              <div className="flex items-center gap-2">
                {i === 0 && <span className="text-xs">🥇</span>}
                {i === 1 && <span className="text-xs">🥈</span>}
                {i === 2 && <span className="text-xs">🥉</span>}
                {i > 2 && (
                  <span className="w-4 text-center text-xs text-muted-foreground">
                    {i + 1}
                  </span>
                )}
                <span className="text-sm">{r.player}</span>
              </div>
              <span
                className={`font-mono text-sm ${
                  r.score > 0
                    ? "text-emerald-400"
                    : r.score < 0
                      ? "text-red-400"
                      : ""
                }`}
              >
                {r.score > 0 ? "+" : ""}
                {r.score}
              </span>
            </div>
          ))}
        </div>
        <div className="border-t border-border/50 mt-2 pt-2 flex justify-between text-xs text-muted-foreground">
          <span>合计</span>
          <span
            className={`font-mono ${
              todayTotal === 0 ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {todayTotal > 0 ? "+" : ""}
            {todayTotal}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
