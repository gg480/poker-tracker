"use client"

interface PlayerSelectProps {
  players: string[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function PlayerSelect({
  players,
  value,
  onChange,
  placeholder = "选择玩家",
  className = "",
}: PlayerSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`bg-background/80 border border-border rounded-md px-3 py-1.5 text-sm ${className}`}
    >
      <option value="">{placeholder}</option>
      {players.map((p) => (
        <option key={p} value={p}>
          {p}
        </option>
      ))}
    </select>
  )
}
