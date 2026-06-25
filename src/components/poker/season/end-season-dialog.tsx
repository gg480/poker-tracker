"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import type { PlayerSettlement, PlayerStats } from "@/lib/types"
import { calcPlayerBalance } from "@/services/clear-radar-service"
import { CLEAR_THRESHOLD } from "@/lib/constants"
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
  sessionCount: number
  pendingSessionCount: number
  collectedSessionCount: number
  incompleteHandsCount: number
  seasonRecordCount: number
  seasonPlayerCount: number
  onConfirm: () => void
}

export function EndSeasonDialog({
  open,
  onOpenChange,
  seasonName,
  seasonId,
  players,
  settlements,
  sessionCount,
  pendingSessionCount,
  collectedSessionCount,
  incompleteHandsCount,
  seasonRecordCount,
  seasonPlayerCount,
  onConfirm,
}: EndSeasonDialogProps) {
  const [step, setStep] = useState<"checklist" | "summary" | "confirm">("checklist")
  const titleRef = useRef<HTMLHeadingElement>(null)

  // Focus the dialog title when step changes for screen reader announcement
  useEffect(() => {
    if (open) {
      // Small delay to allow dialog render and transition
      const id = setTimeout(() => titleRef.current?.focus(), 100)
      return () => clearTimeout(id)
    }
  }, [open, step])

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

  const overThresholdCount = useMemo(() => {
    return clearSummary.filter((b) => Math.abs(b.balance) >= CLEAR_THRESHOLD).length
  }, [clearSummary])

  const handleConfirm = () => {
    if (step === "checklist") {
      setStep("summary")
    } else if (step === "summary") {
      setStep("confirm")
    } else {
      onConfirm()
      setStep("checklist")
    }
  }

  const handleCancel = () => {
    setStep("checklist")
    onOpenChange(false)
  }

  const hasWarnings = pendingSessionCount > 0 || collectedSessionCount > 0 || incompleteHandsCount > 0

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle ref={titleRef} tabIndex={-1} className="focus:outline-none">
            {step === "checklist" && "结束赛季 - 盘点清单"}
            {step === "summary" && "结束赛季 - 清分摘要"}
            {step === "confirm" && "最终确认"}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            {step === "checklist" ? (
              <div className="space-y-4">
                <p>
                  即将结束 <span className="font-medium text-foreground">{seasonName}</span>，请确认以下盘点项：
                </p>

                <div className="bg-muted/30 rounded-lg p-3 text-sm space-y-3">
                  <div className="font-medium text-xs text-muted-foreground mb-2">
                    📊 赛季数据总览
                  </div>
                  <div className="grid grid-cols-2 gap-y-2 text-xs">
                    <span className="text-muted-foreground">总场次</span>
                    <span className="text-right font-mono">{sessionCount}</span>
                    <span className="text-muted-foreground">总记录数</span>
                    <span className="text-right font-mono">{seasonRecordCount}</span>
                    <span className="text-muted-foreground">参与玩家</span>
                    <span className="text-right font-mono">{seasonPlayerCount} 人</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <CheckItem
                    label="场次状态"
                    passed={pendingSessionCount === 0 && collectedSessionCount === 0}
                    detail={
                      pendingSessionCount > 0
                        ? `${pendingSessionCount} 个场次等待录入`
                        : collectedSessionCount > 0
                          ? `${collectedSessionCount} 个场次已收齐待确认`
                          : "所有场次已确认"
                    }
                  />
                  <CheckItem
                    label="手牌记录"
                    passed={incompleteHandsCount === 0}
                    detail={
                      incompleteHandsCount > 0
                        ? `${incompleteHandsCount} 条手牌记录未完成`
                        : "无未完成手牌"
                    }
                  />
                  <CheckItem
                    label="清分状态"
                    passed={overThresholdCount === 0}
                    detail={
                      overThresholdCount > 0
                        ? `${overThresholdCount} 位玩家余额超清分线 ${CLEAR_THRESHOLD}`
                        : "无超警戒线余额"
                    }
                  />
                </div>

                {hasWarnings && (
                  <p className="text-xs text-amber-400">
                    ⚠️ 存在未完成项，建议处理后再结束赛季
                  </p>
                )}
              </div>
            ) : step === "summary" ? (
              <div className="space-y-3">
                <p>
                  以下为 <span className="font-medium text-foreground">{seasonName}</span> 全员清分摘要：
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
              <div className="space-y-3">
                <p className="text-red-400 font-medium">
                  ⚠️ 此操作不可撤销！
                </p>
                <div className="bg-muted/30 rounded-lg p-3 text-sm space-y-1">
                  <p>结束赛季后：</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                    <li>所有玩家余额将归零（通过 season_adjust 调整）</li>
                    <li>赛季数据将变为只读</li>
                    <li>无法再向本赛季录入积分</li>
                  </ul>
                </div>
                <p>确认要结束 <span className="font-medium text-foreground">{seasonName}</span> 吗？</p>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>
            {step === "checklist" ? "取消" : "返回"}
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>
            {step === "checklist" ? "下一步，查看清分" : step === "summary" ? "下一步，最终确认" : "确认结束赛季"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function CheckItem({
  label,
  passed,
  detail,
}: {
  label: string
  passed: boolean
  detail: string
}) {
  return (
    <div className="flex items-start gap-2 p-2 rounded-md bg-muted/20">
      <span className="text-base leading-5 mt-0.5" aria-hidden="true">
        {passed ? "✅" : "⚠️"}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium">{label}</div>
        <div className={`text-xs ${passed ? "text-emerald-400" : "text-amber-400"}`}>
          {detail}
        </div>
      </div>
    </div>
  )
}
