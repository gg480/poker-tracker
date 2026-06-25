"use client"

interface EquityDisplayProps {
  equity: number
  potOdds: number
  ev: number
}

export function EquityDisplay({ equity, potOdds, ev }: EquityDisplayProps) {
  const equityPct = (equity * 100).toFixed(1)
  const potOddsPct = (potOdds * 100).toFixed(1)
  const isEvPositive = ev >= 0

  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="flex flex-col items-center p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
        <span className="text-[10px] text-muted-foreground/70 font-medium">胜率</span>
        <span className="text-sm font-bold text-blue-400 font-mono">{equityPct}%</span>
      </div>

      <div className="flex flex-col items-center p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
        <span className="text-[10px] text-muted-foreground/70 font-medium">底池赔率</span>
        <span className="text-sm font-bold text-amber-400 font-mono">{potOddsPct}%</span>
      </div>

      <div className="flex flex-col items-center p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
        <span className="text-[10px] text-muted-foreground/70 font-medium">EV</span>
        <span className={`text-sm font-bold font-mono ${isEvPositive ? "text-emerald-400" : "text-red-400"}`}>
          {ev >= 0 ? "+" : ""}{ev.toFixed(1)}
        </span>
      </div>
    </div>
  )
}
