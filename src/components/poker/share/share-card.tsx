"use client"

import { useMemo } from "react"
import type { ShareCardData } from "@/services/share-service"
import { getMvp } from "@/services/share-service"
import { APP_NAME, APP_SLOGAN } from "@/lib/constants"

interface ShareCardProps {
  data: ShareCardData
}

export function ShareCard({ data }: ShareCardProps) {
  const sortedRecords = useMemo(
    () => [...data.records].sort((a, b) => b.score - a.score),
    [data.records]
  )

  const mvp = useMemo(() => getMvp(data.records), [data.records])

  return (
    <div
      id="share-card"
      className="w-[360px] p-5 rounded-xl bg-gradient-to-br from-[#111827] to-[#0a0e1a] border border-border/30 text-white"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">{APP_SLOGAN}</span>
          <span className="text-sm font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
            {APP_NAME}
          </span>
        </div>
        {data.seasonName && (
          <span className="text-xs text-muted-foreground bg-muted/30 px-2 py-0.5 rounded">
            {data.seasonName}
          </span>
        )}
      </div>

      <div className="text-center mb-4">
        <div className="text-lg font-semibold">{data.date}</div>
        <div className="text-xs text-muted-foreground">
          {data.records.length} 人对局
        </div>
      </div>

      <div className="space-y-1.5 mb-4">
        {sortedRecords.map((r, i) => (
          <div
            key={r.player || `player-${i}`}
            className={`flex items-center justify-between px-3 py-1.5 rounded-md ${
              i === 0
                ? "bg-amber-500/15 border border-amber-500/30"
                : i === 1
                  ? "bg-gray-500/10 border border-gray-500/20"
                  : i === 2
                    ? "bg-amber-700/10 border border-amber-700/20"
                    : "bg-muted/20"
            }`}
          >
            <div className="flex items-center gap-2">
              {i === 0 && <span className="text-sm">🥇</span>}
              {i === 1 && <span className="text-sm">🥈</span>}
              {i === 2 && <span className="text-sm">🥉</span>}
              {i > 2 && (
                <span className="w-5 text-center text-xs text-muted-foreground">
                  {i + 1}
                </span>
              )}
              <span className={`text-sm ${i < 3 ? "font-medium" : "text-muted-foreground"}`}>
                {r.player}
              </span>
            </div>
            <span
              className={`font-mono text-sm font-semibold ${
                r.score > 0
                  ? "text-emerald-400"
                  : r.score < 0
                    ? "text-red-400"
                    : "text-muted-foreground"
              }`}
            >
              {r.score > 0 ? "+" : ""}
              {r.score}
            </span>
          </div>
        ))}
      </div>

      {mvp && (
        <div className="text-center mb-3 py-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
          <span className="text-xs text-amber-400">🏆 MVP</span>
          <span className="ml-2 text-sm font-medium">{mvp.player}</span>
          <span className="ml-1 text-xs text-emerald-400 font-mono">
            +{mvp.score}
          </span>
        </div>
      )}

      <div className="text-center text-[10px] text-muted-foreground/50 mt-2">
        {APP_SLOGAN} {APP_NAME}
      </div>
    </div>
  )
}
