interface ScoreDisplayProps {
  score: number
  className?: string
  showSign?: boolean
}

export function ScoreDisplay({ score, className = "", showSign = true }: ScoreDisplayProps) {
  const color =
    score > 0
      ? "text-emerald-500"
      : score < 0
        ? "text-red-500"
        : "text-muted-foreground"

  const display = showSign && score > 0 ? `+${score}` : `${score}`

  return (
    <span className={`font-mono ${color} ${className}`}>
      {display}
    </span>
  )
}
