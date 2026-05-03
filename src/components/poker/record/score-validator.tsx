"use client"

interface ScoreValidatorProps {
  totalScore: number
  playerCount: number
  minPlayers?: number
}

export function ScoreValidator({
  totalScore,
  playerCount,
  minPlayers = 2,
}: ScoreValidatorProps) {
  const isZero = totalScore === 0
  const hasEnough = playerCount >= minPlayers
  const isValid = isZero && hasEnough

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
        isValid
          ? "bg-emerald-500/10 border border-emerald-500/30"
          : isZero && !hasEnough
            ? "bg-amber-500/10 border border-amber-500/30"
            : "bg-red-500/10 border border-red-500/30"
      }`}
    >
      {isValid && (
        <>
          <span className="text-emerald-400 text-base">✓</span>
          <span className="text-emerald-400 font-medium">合计为零，可以确认保存</span>
        </>
      )}
      {isZero && !hasEnough && (
        <>
          <span className="text-amber-400 text-base">⏳</span>
          <span className="text-amber-400">
            合计为零，但需至少 {minPlayers} 人录入（当前 {playerCount} 人）
          </span>
        </>
      )}
      {!isZero && (
        <>
          <span className="text-red-400 text-base">✗</span>
          <span className="text-red-400">
            合计差额: <span className="font-mono font-semibold">{totalScore > 0 ? "+" : ""}{totalScore}</span>
            ，请调整至零和
          </span>
        </>
      )}
    </div>
  )
}
