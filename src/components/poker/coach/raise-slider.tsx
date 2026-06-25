"use client"

import { useState, useCallback } from "react"

interface RaiseSliderProps {
  minRaise: number
  maxRaise: number
  onConfirm: (amount: number) => void
  onCancel: () => void
}

export function RaiseSlider({ minRaise, maxRaise, onConfirm, onCancel }: RaiseSliderProps) {
  const [amount, setAmount] = useState(minRaise)

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(Number(e.target.value))
  }, [])

  const handleConfirm = useCallback(() => {
    onConfirm(amount)
  }, [amount, onConfirm])

  return (
    <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-card/80 border border-border/40">
      <div className="flex items-center gap-2 w-full">
        <span className="text-xs text-muted-foreground/70 font-mono">{minRaise.toLocaleString()}</span>
        <input
          type="range"
          min={minRaise}
          max={maxRaise}
          step={10}
          value={amount}
          onChange={handleChange}
          className="flex-1 h-1.5 rounded-full appearance-none bg-primary/20 accent-primary cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-lg"
        />
        <span className="text-xs text-muted-foreground/70 font-mono">{maxRaise.toLocaleString()}</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="px-3 py-1 rounded-lg bg-primary/10 border border-primary/20">
          <span className="text-sm font-bold text-primary font-mono">{amount.toLocaleString()}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleConfirm}
          className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          确认加注
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-1.5 text-xs font-medium rounded-lg bg-muted/30 text-muted-foreground hover:bg-muted/50 transition-colors"
        >
          取消
        </button>
      </div>
    </div>
  )
}
