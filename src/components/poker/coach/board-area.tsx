"use client"

import { PokerCard, parseCardCode } from "@/components/poker/hand/poker-card"
import type { Street } from "@/lib/types"

interface BoardAreaProps {
  cards: string[]
  street: Street
}

const STREET_LABELS: Record<Street, string> = {
  preflop: "Preflop",
  flop: "Flop",
  turn: "Turn",
  river: "River",
}

export function BoardArea({ cards, street }: BoardAreaProps) {
  const flopCards = cards.slice(0, 3)
  const turnCard = cards.length > 3 ? cards[3] : null
  const riverCard = cards.length > 4 ? cards[4] : null

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-1.5">
        {/* Flop 3 张 */}
        {[0, 1, 2].map((i) => {
          const code = flopCards[i]
          if (!code) {
            return (
              <div key={`flop-${i}`} className="w-9 h-10 rounded-lg bg-muted/20 border border-dashed border-muted-foreground/20 flex items-center justify-center">
                <span className="text-[10px] text-muted-foreground/30">?</span>
              </div>
            )
          }
          const parsed = parseCardCode(code)
          if (!parsed) {
            return (
              <div key={`flop-${i}`} className="w-9 h-10 rounded-lg bg-muted/20 border border-dashed border-muted-foreground/20 flex items-center justify-center">
                <span className="text-[10px] text-muted-foreground/30">?</span>
              </div>
            )
          }
          return <PokerCard key={`flop-${i}`} suit={parsed.suit} rank={parsed.rank} size="sm" />
        })}

        {/* Turn 1 张 */}
        {turnCard ? (
          (() => {
            const parsed = parseCardCode(turnCard)
            return parsed ? (
              <div className="relative">
                <PokerCard suit={parsed.suit} rank={parsed.rank} size="sm" />
                <span className="absolute -top-2 -right-2 text-[8px] bg-amber-500/20 text-amber-400 px-1 rounded">T</span>
              </div>
            ) : null
          })()
        ) : (
          <div className="w-9 h-10 rounded-lg bg-muted/20 border border-dashed border-muted-foreground/20 flex items-center justify-center">
            <span className="text-[10px] text-muted-foreground/30">?</span>
          </div>
        )}

        {/* River 1 张 */}
        {riverCard ? (
          (() => {
            const parsed = parseCardCode(riverCard)
            return parsed ? (
              <div className="relative">
                <PokerCard suit={parsed.suit} rank={parsed.rank} size="sm" />
                <span className="absolute -top-2 -right-2 text-[8px] bg-red-500/20 text-red-400 px-1 rounded">R</span>
              </div>
            ) : null
          })()
        ) : (
          <div className="w-9 h-10 rounded-lg bg-muted/20 border border-dashed border-muted-foreground/20 flex items-center justify-center">
            <span className="text-[10px] text-muted-foreground/30">?</span>
          </div>
        )}
      </div>

      <span className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">
        {STREET_LABELS[street]}
      </span>
    </div>
  )
}
