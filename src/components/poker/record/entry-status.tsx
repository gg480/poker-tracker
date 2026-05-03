"use client"

interface EntryStatusProps {
  players: string[]
  enteredPlayers: Set<string>
  playerScores?: Record<string, number>
  onPlayerClick?: (player: string) => void
}

export function EntryStatus({
  players,
  enteredPlayers,
  playerScores,
  onPlayerClick,
}: EntryStatusProps) {
  const entered = players.filter((p) => enteredPlayers.has(p))
  const pending = players.filter((p) => !enteredPlayers.has(p))

  return (
    <div className="space-y-2">
      <div className="text-xs text-muted-foreground">
        录入进度: {entered.length}/{players.length} 人
      </div>
      <div className="flex flex-wrap gap-1.5">
        {players.map((player, i) => {
          const isEntered = enteredPlayers.has(player)
          const score = playerScores?.[player]

          return (
            <button
              key={player || `player-${i}`}
              onClick={() => !isEntered && onPlayerClick?.(player)}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors ${
                isEntered
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                  : "bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 cursor-pointer"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isEntered ? "bg-emerald-400" : "bg-amber-400"}`} />
              <span>{player}</span>
              {isEntered && score !== undefined && (
                <span className="font-mono ml-0.5">
                  {score > 0 ? "+" : ""}{score}
                </span>
              )}
              {!isEntered && <span className="text-[10px] opacity-70">待录入</span>}
            </button>
          )
        })}
      </div>
      {pending.length > 0 && (
        <div className="text-xs text-amber-400/70">
          等待 {pending.join("、")} 录入
        </div>
      )}
    </div>
  )
}
