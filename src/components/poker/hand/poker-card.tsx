interface PokerCardProps {
  suit: "spade" | "heart" | "diamond" | "club"
  rank: string
  className?: string
  size?: "sm" | "md" | "lg"
}

const SUIT_SYMBOLS = {
  spade: "♠",
  heart: "♥",
  diamond: "♦",
  club: "♣",
}

const SUIT_COLORS = {
  spade: "#1e293b",
  heart: "#ef4444",
  diamond: "#ef4444",
  club: "#1e293b",
}

const SIZE_MAP = {
  sm: { w: 28, h: 40, fontSize: 12, suitSize: 10 },
  md: { w: 40, h: 56, fontSize: 16, suitSize: 14 },
  lg: { w: 56, h: 80, fontSize: 22, suitSize: 18 },
}

export function PokerCard({ suit, rank, className = "", size = "md" }: PokerCardProps) {
  const s = SIZE_MAP[size]
  const color = SUIT_COLORS[suit]
  const symbol = SUIT_SYMBOLS[suit]

  return (
    <svg
      viewBox={`0 0 ${s.w} ${s.h}`}
      className={`inline-block ${className}`}
      width={s.w}
      height={s.h}
    >
      <rect
        x="1"
        y="1"
        width={s.w - 2}
        height={s.h - 2}
        rx="3"
        fill="white"
        stroke="#e2e8f0"
        strokeWidth="1"
      />
      <text
        x="4"
        y={s.fontSize + 2}
        fontSize={s.fontSize * 0.7}
        fill={color}
        fontFamily="monospace"
        fontWeight="bold"
      >
        {rank}
      </text>
      <text
        x="4"
        y={s.fontSize + s.suitSize * 0.8 + 2}
        fontSize={s.suitSize * 0.7}
        fill={color}
      >
        {symbol}
      </text>
      <text
        x={s.w / 2}
        y={s.h / 2 + s.suitSize * 0.4}
        fontSize={s.suitSize}
        fill={color}
        textAnchor="middle"
      >
        {symbol}
      </text>
    </svg>
  )
}

export function parseBoardCards(boardStr: string): { suit: "spade" | "heart" | "diamond" | "club"; rank: string }[] {
  const cards: { suit: "spade" | "heart" | "diamond" | "club"; rank: string }[] = []
  const parts = boardStr.trim().split(/\s+/)

  for (const part of parts) {
    if (part.length < 2) continue
    const rank = part.slice(0, -1)
    const suitChar = part.slice(-1).toLowerCase()

    let suit: "spade" | "heart" | "diamond" | "club"
    switch (suitChar) {
      case "s": case "♠": suit = "spade"; break
      case "h": case "♥": suit = "heart"; break
      case "d": case "♦": suit = "diamond"; break
      case "c": case "♣": suit = "club"; break
      default: continue
    }

    cards.push({ suit, rank })
  }

  return cards
}

export function BoardDisplay({ board, size = "sm" }: { board: string; size?: "sm" | "md" | "lg" }) {
  const cards = parseBoardCards(board)
  if (cards.length === 0) return null

  return (
    <div className="flex gap-1">
      {cards.map((card, i) => (
        <PokerCard key={`${card.rank}${card.suit}-${i}`} suit={card.suit} rank={card.rank} size={size} />
      ))}
    </div>
  )
}
