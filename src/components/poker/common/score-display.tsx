import {
  TEXT_POSITIVE,
  TEXT_NEGATIVE,
  TEXT_NEUTRAL,
} from "@/lib/constants"

interface ScoreDisplayProps {
  score: number
  className?: string
  showSign?: boolean
}

export function ScoreDisplay({ score, className = "", showSign = true }: ScoreDisplayProps) {
  const color =
    score > 0
      ? TEXT_POSITIVE
      : score < 0
        ? TEXT_NEGATIVE
        : TEXT_NEUTRAL

  const display = showSign && score > 0 ? `+${score.toLocaleString()}` : `${score.toLocaleString()}`

  return (
    <span className={`font-mono ${color} ${className}`}>
      {display}
    </span>
  )
}
