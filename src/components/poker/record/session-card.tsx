"use client"

import type { GameSession } from "@/lib/types"
import { SESSION_STATUS } from "@/lib/constants"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface SessionCardProps {
  session: GameSession
  records: { player: string; score: number }[]
  expanded?: boolean
  onClick?: () => void
}

const STATUS_CONFIG = {
  [SESSION_STATUS.PENDING]: {
    label: "待录入",
    variant: "outline" as const,
    className: "border-amber-500/50 text-amber-400",
  },
  [SESSION_STATUS.COLLECTED]: {
    label: "已收齐",
    variant: "outline" as const,
    className: "border-blue-500/50 text-blue-400",
  },
  [SESSION_STATUS.CONFIRMED]: {
    label: "已确认",
    variant: "outline" as const,
    className: "border-emerald-500/50 text-emerald-400",
  },
}

export function SessionCard({ session, records, expanded, onClick }: SessionCardProps) {
  const statusConfig = STATUS_CONFIG[session.status] || STATUS_CONFIG[SESSION_STATUS.PENDING]
  const totalScore = records.reduce((sum, r) => sum + r.score, 0)
  const sortedRecords = [...records].sort((a, b) => b.score - a.score)

  return (
    <Card
      className={`border-border/40 bg-card/60 backdrop-blur cursor-pointer transition-all duration-200 hover:bg-card/90 ${
        expanded ? "ring-1 ring-primary/30" : ""
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{session.date}</span>
            <Badge variant={statusConfig.variant} className={`text-[10px] px-1.5 py-0 ${statusConfig.className}`}>
              {statusConfig.label}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{records.length} 人</span>
            <span className={`font-mono ${totalScore === 0 ? "text-emerald-500" : "text-red-500"}`}>
              合计: {totalScore > 0 ? "+" : ""}{totalScore}
            </span>
          </div>
        </div>

        {expanded && records.length > 0 && (
          <div className="mt-3 space-y-1 border-t border-border/50 pt-2">
            {sortedRecords.map((r, i) => (
              <div
                key={r.player || `player-${i}`}
                className="flex items-center justify-between text-sm py-0.5"
              >
                <div className="flex items-center gap-2">
                  {i === 0 && <span className="text-amber-400 text-xs">🥇</span>}
                  {i === 1 && <span className="text-gray-400 text-xs">🥈</span>}
                  {i === 2 && <span className="text-amber-600 text-xs">🥉</span>}
                  {i > 2 && <span className="w-4 text-center text-muted-foreground text-xs">{i + 1}</span>}
                  <span className={i < 3 ? "font-medium" : "text-muted-foreground"}>
                    {r.player}
                  </span>
                </div>
                <span
                  className={`font-mono ${
                    r.score > 0
                      ? "text-emerald-500"
                      : r.score < 0
                        ? "text-red-500"
                        : "text-muted-foreground"
                  }`}
                >
                  {r.score > 0 ? "+" : ""}{r.score}
                </span>
              </div>
            ))}
          </div>
        )}

        {!expanded && records.length > 0 && (
          <div className="flex gap-1 flex-wrap mt-1">
            {sortedRecords.slice(0, 4).map((r, i) => (
              <span
                key={r.player || `player-${i}`}
                className={`text-[10px] px-1.5 py-0.5 rounded ${
                  r.score > 0
                    ? "bg-emerald-500/10 text-emerald-400"
                    : r.score < 0
                      ? "bg-red-500/10 text-red-400"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {r.player} {r.score > 0 ? "+" : ""}{r.score}
              </span>
            ))}
            {sortedRecords.length > 4 && (
              <span className="text-[10px] text-muted-foreground px-1">
                +{sortedRecords.length - 4}人
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
