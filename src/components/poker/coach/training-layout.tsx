"use client"

import { useCallback, useMemo } from "react"
import { useCoachStore } from "@/stores/coach-store"
import { TrainingTable } from "./training-table"
import { CoachPanel } from "./coach-panel"
import type { UserAction as PlayerAction, GTOAction } from "@/lib/types"

interface TrainingLayoutProps {
  onBack: () => void
}

export function TrainingLayout({ onBack }: TrainingLayoutProps) {
  const {
    holeCards, boardCards, street, isUserTurn, handNumber,
    potSize, currentCallAmount,
    feedbacks, decisions,
    getCurrentAdvice, getCurrentEquity, getPotOdds, getCurrentEV,
  } = useCoachStore()

  // useMemo deps include all store fields read by each getter,
  // ensuring recalculation when board/stack/pot changes
  const advice = useMemo(() => {
    if (holeCards.length === 0 || !isUserTurn) return null
    return getCurrentAdvice()
  }, [holeCards, boardCards, street, isUserTurn, getCurrentAdvice])

  const equity = useMemo(() => {
    if (holeCards.length === 0) return 0
    return getCurrentEquity()
  }, [holeCards, boardCards, getCurrentEquity])

  const potOdds = useMemo(() => {
    return getPotOdds()
  }, [potSize, currentCallAmount, getPotOdds])

  const ev = useMemo(() => {
    if (holeCards.length === 0) return 0
    return getCurrentEV()
  }, [holeCards, boardCards, potSize, currentCallAmount, getCurrentEV])

  const lastFeedback = useMemo(() => {
    if (feedbacks.length === 0) return null
    return feedbacks[feedbacks.length - 1]
  }, [feedbacks])

  const handleEndSession = useCallback(() => {
    onBack()
  }, [onBack])

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      {/* 左侧：牌桌区域 */}
      <div className="flex-1 min-w-0">
        <TrainingTable onEndSession={handleEndSession} />
      </div>

      {/* 右侧：教练面板 */}
      <div className="w-full lg:w-72 shrink-0">
        <CoachPanel
          advice={advice}
          equity={equity}
          potOdds={potOdds}
          ev={ev}
          feedback={lastFeedback}
          handNumber={handNumber}
        />
      </div>
    </div>
  )
}
