"use client"

import { useState, useMemo } from "react"
import type { PlayerSettlement, PlayerStats } from "@/lib/types"
import { CLEAR_THRESHOLD } from "@/lib/constants"
import { calcPlayerBalance } from "@/services/clear-radar-service"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface EndSeasonDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  seasonName: string
  seasonId: string
  players: PlayerStats[]
  settlements: PlayerSettlement[]
  onConfirm: () => void
}

export function EndSeasonDialog({
  open,
  onOpenChange,
  seasonName,
  seasonId,
  players,
  settlements,
  onConfirm,
}: EndSeasonDialogProps) {
  const [step, setStep] = useState<"summary" | "confirm">("summary")

  const clearSummary = useMemo(() => {
    return players
      .map((p) => {
        const settlement = settlements.find(
          (s) => s.player === p.name && s.seasonId === seasonId
        )
        const balance = calcPlayerBalance(
          p.name,
          seasonId,
          p.total,
          settlement
        )
        return balance
      })
      .filter((b) => b.balance !== 0)
      .sort((a, b) => b.balance - a.balance)
  }, [players, settlements, seasonId])

  const totalAdjust = clearSummary.reduce(
    (sum, b) => sum + Math.abs(b.balance),
    0
  )

  const handleConfirm = () => {
    if (step === "summary") {
      setStep("confirm")
    } else {
      onConfirm()
      setStep("summary")
    }
  }

  const handleCancel = () => {
    setStep("summary")
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {step === "summary" ? "结束赛季 - 清分摘要" : "最终确认"}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            {step === "summary" ? (
              <div className="space-y-3">
                <p>
                  即将结束 <span className="font-medium text-foreground">{seasonName}</span>，以下为全员清分摘要：
                </p>
                {clearSummary.length > 0 ? (
                  <div className="bg-muted/50 rounded-md p-2 text-sm space-y-1 max-h-[300px] overflow-y-auto">
                    {clearSummary.map((b, i) => (
                      <div
                        key={b.player || `player-${i}`}
                        className="flex justify-between items-center py-1"
                      >
                        <span className="font-medium">{b.player}</span>
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-mono ${
                              b.balance > 0 ? "text-emerald-400" : "text-red-400"
                            }`}
                          >
                            余额: {b.balance > 0 ? "+" : ""}
                            {b.balance.toLocaleString()}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            → 调整: {b.balance > 0 ? "" : "+"}
                            {Math.abs(b.balance).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                    <div className="border-t border-border/50 mt-2 pt-2 flex justify-between text-xs text-muted-foreground">
                      <span>涉及 {clearSummary.length} 人</span>
                      <span>调整总额: {totalAdjust.toLocaleString()}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-emerald-400 text-center py-2">
                    所有玩家余额已为零，无需清分调整 ✨
                  </p>
                )}
                <p className="text-xs text-amber-400">
                  💡 建议在结束赛季前先导出数据备份
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-red-400 font-medium">
                  ⚠️ 此操作不可撤销！
                </p>
                <p>
                  结束赛季后，所有玩家余额将归零（通过 season_adjust 调整），赛季数据将变为只读。
                </p>
                <p>确认要结束 {seasonName} 吗？</p>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>取消</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>
            {step === "summary" ? "下一步" : "确认结束赛季"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
