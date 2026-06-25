"use client"

import { useState } from "react"
import type { GameSession } from "@/lib/types"
import { SESSION_STATUS, SESSION_PREVIEW_LIMIT, TEXT_POSITIVE, TEXT_NEGATIVE, TEXT_NEUTRAL, BG_POSITIVE, BG_NEGATIVE } from "@/lib/constants"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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

interface SessionCardProps {
  session: GameSession
  records: { player: string; score: number }[]
  expanded?: boolean
  onClick?: () => void
  onEdit?: () => void
  onDelete?: () => void
}

const STATUS_CONFIG = {
  [SESSION_STATUS.PENDING]: {
    label: "等待录入",
    variant: "outline" as const,
    className: "border-gray-500/50 text-gray-400",
  },
  [SESSION_STATUS.COLLECTED]: {
    label: "已收齐待确认",
    variant: "outline" as const,
    className: "border-blue-500/50 text-blue-400",
  },
  [SESSION_STATUS.CONFIRMED]: {
    label: "已确认",
    variant: "outline" as const,
    className: "border-emerald-500/50 text-emerald-400",
  },
}

export function SessionCard({ session, records, expanded, onClick, onEdit, onDelete }: SessionCardProps) {
  const statusConfig = STATUS_CONFIG[session.status] || STATUS_CONFIG[SESSION_STATUS.PENDING]
  const totalScore = records.reduce((sum, r) => sum + r.score, 0)
  const sortedRecords = [...records].sort((a, b) => b.score - a.score)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const handleDelete = () => {
    setDeleteDialogOpen(false)
    onDelete?.()
  }

  return (
    <Card
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-expanded={onClick ? expanded : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick() } } : undefined}
      className={`border-border/40 bg-card/60 backdrop-blur cursor-pointer transition-all duration-200 hover:bg-card/90 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 ${
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
            <span className={`font-mono ${totalScore > 0 ? TEXT_POSITIVE : totalScore < 0 ? TEXT_NEGATIVE : TEXT_NEUTRAL}`}>
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
                      ? TEXT_POSITIVE
                      : r.score < 0
                        ? TEXT_NEGATIVE
                        : TEXT_NEUTRAL
                  }`}
                >
                  {r.score > 0 ? "+" : ""}{r.score}
                </span>
              </div>
            ))}

            {/* 编辑 / 删除按钮 */}
            <div className="flex items-center gap-2 pt-3 border-t border-border/30 mt-2" onClick={(e) => e.stopPropagation()}>
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-7 px-2"
                onClick={() => onEdit?.()}
              >
                ✏️ 编辑
              </Button>
              <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7 px-2 text-red-400 border-red-500/30 hover:bg-red-500/10 hover:text-red-300"
                  >
                    🗑️ 删除
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="max-w-sm">
                  <AlertDialogHeader>
                    <AlertDialogTitle>确认删除本场次？</AlertDialogTitle>
                    <AlertDialogDescription>
                      此操作不可撤销，该场次的所有积分记录将被永久删除。
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="flex-row gap-2 sm:gap-2">
                    <AlertDialogCancel className="flex-1">取消</AlertDialogCancel>
                    <AlertDialogAction
                      className="flex-1 bg-red-600 hover:bg-red-500 text-white"
                      onClick={handleDelete}
                    >
                      确认删除
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        )}

        {!expanded && records.length > 0 && (
          <div className="flex gap-1 flex-wrap mt-1">
            {sortedRecords.slice(0, SESSION_PREVIEW_LIMIT).map((r, i) => (
              <span
                key={r.player || `player-${i}`}
                className={`text-[10px] px-1.5 py-0.5 rounded ${
                  r.score > 0
                    ? BG_POSITIVE
                    : r.score < 0
                      ? BG_NEGATIVE
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {r.player} {r.score > 0 ? "+" : ""}{r.score}
              </span>
            ))}
            {sortedRecords.length > SESSION_PREVIEW_LIMIT && (
              <span className="text-[10px] text-muted-foreground px-1">
                +{sortedRecords.length - SESSION_PREVIEW_LIMIT}人
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
