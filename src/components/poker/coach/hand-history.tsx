"use client"

import type { CoachDecision } from "@/lib/coach/types"

interface HandHistoryProps {
  decisions: CoachDecision[]
}

const STREET_LABELS: Record<string, string> = {
  preflop: "PF",
  flop: "F",
  turn: "T",
  river: "R",
}

const ACTION_SHORT: Record<string, string> = {
  fold: "F",
  check: "X",
  call: "C",
  raise: "R",
  all_in: "AI",
}

export function HandHistory({ decisions }: HandHistoryProps) {
  if (decisions.length === 0) {
    return (
      <div className="p-3 rounded-xl bg-card/50 border border-border/40">
        <h4 className="text-xs font-semibold text-muted-foreground/70 mb-2">手牌历史</h4>
        <p className="text-xs text-muted-foreground/50">暂无记录</p>
      </div>
    )
  }

  // 按手牌分组
  const grouped = decisions.reduce<Record<number, CoachDecision[]>>((acc, d) => {
    if (!acc[d.handNumber]) acc[d.handNumber] = []
    acc[d.handNumber].push(d)
    return acc
  }, {})

  const handNumbers = Object.keys(grouped).map(Number).sort((a, b) => b - a)

  return (
    <div className="p-3 rounded-xl bg-card/50 border border-border/40">
      <h4 className="text-xs font-semibold text-muted-foreground/70 mb-2">手牌历史</h4>

      <div className="space-y-1 max-h-48 overflow-y-auto">
        {handNumbers.map((handNum) => {
          const handDecisions = grouped[handNum]
          const firstDec = handDecisions[0]
          const lastDec = handDecisions[handDecisions.length - 1]
          const handCards = firstDec.holeCards.join(" ")
          const result = lastDec.result
          const netChips = lastDec.netChips || 0

          return (
            <div
              key={handNum}
              className="flex items-center justify-between px-2 py-1 rounded-lg hover:bg-muted/20 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-muted-foreground/50">#{handNum}</span>
                <span className="text-[10px] font-mono text-muted-foreground/70">{handCards}</span>
                <div className="flex items-center gap-0.5">
                  {handDecisions.map((d, i) => (
                    <span
                      key={i}
                      className={`text-[9px] font-mono px-0.5 rounded ${
                        d.isCorrect ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      {STREET_LABELS[d.street]}
                      {ACTION_SHORT[d.userAction]}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-1">
                {result === "win" && <span className="text-[10px] text-emerald-400">+{netChips.toLocaleString()}</span>}
                {result === "lose" && <span className="text-[10px] text-red-400">-{Math.abs(netChips).toLocaleString()}</span>}
                {result === "fold" && <span className="text-[10px] text-muted-foreground/50">弃牌</span>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
