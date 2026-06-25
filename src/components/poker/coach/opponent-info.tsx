"use client"

import type { OpponentStyle, UserAction as PlayerAction } from "@/lib/types"

interface OpponentInfoProps {
  stack: number
  style: OpponentStyle
  lastAction: { action: PlayerAction; betAmount: number } | null
  handNumber: number
}

const STYLE_LABELS: Record<OpponentStyle, string> = {
  aggressive: "激进",
  passive: "被动",
  gto: "GTO",
}

const ACTION_LABELS: Record<PlayerAction, string> = {
  fold: "弃牌",
  check: "过牌",
  call: "跟注",
  raise: "加注",
  all_in: "全下",
}

export function OpponentInfo({ stack, style, lastAction, handNumber }: OpponentInfoProps) {
  return (
    <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-card/50 border border-border/40">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-400/20 to-red-600/20 border border-red-500/30 flex items-center justify-center">
        <span className="text-lg">🤖</span>
      </div>

      <div className="text-center">
        <div className="text-xs font-semibold text-muted-foreground">AI 对手</div>
        <div className="text-[10px] text-muted-foreground/50">
          {STYLE_LABELS[style]}
        </div>
      </div>

      <div className="text-sm font-bold text-red-400 font-mono">
        {stack.toLocaleString()}
      </div>

      {lastAction && (
        <div className="text-[10px] text-muted-foreground/60 bg-muted/20 px-2 py-0.5 rounded">
          上轮: {ACTION_LABELS[lastAction.action]}
          {lastAction.betAmount > 0 && ` ${lastAction.betAmount.toLocaleString()}`}
        </div>
      )}

      {handNumber > 0 && (
        <div className="text-[10px] text-muted-foreground/40 font-mono">
          第 {handNumber} 手
        </div>
      )}
    </div>
  )
}
