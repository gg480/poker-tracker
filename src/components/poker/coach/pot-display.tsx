"use client"

interface PotDisplayProps {
  potSize: number
  userStack: number
  opponentStack: number
  userBet?: number
  opponentBet?: number
}

export function PotDisplay({ potSize, userStack, opponentStack, userBet, opponentBet }: PotDisplayProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-3 text-xs text-muted-foreground/70">
        <span className="font-mono">你: <span className="text-emerald-400 font-semibold">{userStack.toLocaleString()}</span></span>
        <span className="font-mono">对手: <span className="text-red-400 font-semibold">{opponentStack.toLocaleString()}</span></span>
      </div>

      <div className="relative px-6 py-2 rounded-full bg-amber-500/10 border border-amber-500/20">
        <span className="text-sm font-bold text-amber-400 font-mono">
          底池: {potSize.toLocaleString()}
        </span>
      </div>

      {(userBet !== undefined && userBet > 0) || (opponentBet !== undefined && opponentBet > 0) ? (
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground/50 font-mono">
          {userBet !== undefined && userBet > 0 && <span>你的下注: {userBet.toLocaleString()}</span>}
          {opponentBet !== undefined && opponentBet > 0 && <span>对手下注: {opponentBet.toLocaleString()}</span>}
        </div>
      ) : null}
    </div>
  )
}
