"use client"

import { useState, useCallback } from "react"
import { RaiseSlider } from "./raise-slider"
import type { UserAction as PlayerAction } from "@/lib/types"

interface ActionButtonsProps {
  canCheck: boolean
  callAmount: number
  minRaise: number
  maxRaise: number
  disabled: boolean
  onAction: (action: PlayerAction, betAmount: number) => void
}

export function ActionButtons({ canCheck, callAmount, minRaise, maxRaise, disabled, onAction }: ActionButtonsProps) {
  const [showRaiseSlider, setShowRaiseSlider] = useState(false)

  const handleFold = useCallback(() => {
    onAction("fold", 0)
  }, [onAction])

  const handleCheck = useCallback(() => {
    onAction("check", 0)
  }, [onAction])

  const handleCall = useCallback(() => {
    onAction("call", callAmount)
  }, [onAction, callAmount])

  const handleRaiseClick = useCallback(() => {
    setShowRaiseSlider(true)
  }, [])

  const handleRaiseConfirm = useCallback((amount: number) => {
    onAction("raise", amount)
    setShowRaiseSlider(false)
  }, [onAction])

  const handleRaiseCancel = useCallback(() => {
    setShowRaiseSlider(false)
  }, [])

  const handleAllIn = useCallback(() => {
    onAction("all_in", maxRaise)
  }, [onAction, maxRaise])

  if (showRaiseSlider) {
    return (
      <RaiseSlider
        minRaise={minRaise}
        maxRaise={maxRaise}
        onConfirm={handleRaiseConfirm}
        onCancel={handleRaiseCancel}
      />
    )
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap justify-center">
      <button
        onClick={handleFold}
        disabled={disabled}
        className="px-4 py-2 text-xs font-semibold rounded-lg bg-red-500/15 text-red-400 border border-red-500/20
          hover:bg-red-500/25 hover:border-red-500/30 transition-all duration-200
          disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-red-500/15"
      >
        Fold
      </button>

      {canCheck ? (
        <button
          onClick={handleCheck}
          disabled={disabled}
          className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/20
            hover:bg-blue-500/25 hover:border-blue-500/30 transition-all duration-200
            disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-blue-500/15"
        >
          Check
        </button>
      ) : (
        <button
          onClick={handleCall}
          disabled={disabled}
          className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/20
            hover:bg-blue-500/25 hover:border-blue-500/30 transition-all duration-200
            disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-blue-500/15"
        >
          Call {callAmount > 0 ? callAmount.toLocaleString() : ""}
        </button>
      )}

      <button
        onClick={handleRaiseClick}
        disabled={disabled}
        className="px-4 py-2 text-xs font-semibold rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/20
          hover:bg-amber-500/25 hover:border-amber-500/30 transition-all duration-200
          disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-amber-500/15"
      >
        Raise
      </button>

      <button
        onClick={handleAllIn}
        disabled={disabled}
        className="px-4 py-2 text-xs font-semibold rounded-lg bg-purple-500/15 text-purple-400 border border-purple-500/20
          hover:bg-purple-500/25 hover:border-purple-500/30 transition-all duration-200
          disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-purple-500/15"
      >
        All-in
      </button>
    </div>
  )
}
