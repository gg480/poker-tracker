interface MedalBadgeProps {
  rank: number
  className?: string
}

const MEDAL_MAP: Record<number, { emoji: string; label: string }> = {
  1: { emoji: "🥇", label: "冠军" },
  2: { emoji: "🥈", label: "亚军" },
  3: { emoji: "🥉", label: "季军" },
}

export function MedalBadge({ rank, className = "" }: MedalBadgeProps) {
  const medal = MEDAL_MAP[rank]
  if (!medal) return null

  return (
    <span className={`inline-flex items-center ${className}`} title={medal.label}>
      {medal.emoji}
    </span>
  )
}
