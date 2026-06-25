"use client"

import { PokerCard, parseCardCode } from "@/components/poker/hand/poker-card"

interface HoleCardsProps {
  cards: string[]
  highlight?: boolean
}

export function HoleCards({ cards, highlight = false }: HoleCardsProps) {
  if (cards.length === 0) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-10 h-14 rounded-lg bg-muted/30 border border-dashed border-muted-foreground/30 flex items-center justify-center">
          <span className="text-xs text-muted-foreground/50">?</span>
        </div>
        <div className="w-10 h-14 rounded-lg bg-muted/30 border border-dashed border-muted-foreground/30 flex items-center justify-center">
          <span className="text-xs text-muted-foreground/50">?</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-1.5 ${highlight ? "scale-110" : ""}`}>
      {cards.map((code, i) => {
        const parsed = parseCardCode(code)
        if (!parsed) {
          return (
            <div key={i} className="w-10 h-14 rounded-lg bg-muted/30 border border-dashed border-muted-foreground/30 flex items-center justify-center">
              <span className="text-xs text-muted-foreground/50">?</span>
            </div>
          )
        }
        return (
          <PokerCard
            key={`${code}-${i}`}
            suit={parsed.suit}
            rank={parsed.rank}
            size="md"
            className={highlight ? "ring-2 ring-amber-400 rounded-lg" : ""}
          />
        )
      })}
    </div>
  )
}
