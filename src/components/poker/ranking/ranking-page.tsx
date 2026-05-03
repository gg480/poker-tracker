"use client"

import { useMemo, useState } from "react"
import type { ComputedStats, PlayerSettlement, PokerRecord } from "@/lib/types"
import { computeAttendanceBoard, computeClearBoard } from "@/services/stats-service"
import { Card, CardContent } from "@/components/ui/card"

interface RankingPageProps {
  stats: ComputedStats
  settlements: PlayerSettlement[]
  records: PokerRecord[]
  onPlayerClick?: (name: string) => void
}

interface BoardSection {
  key: string
  icon: string
  title: string
  subtitle: string
  render: () => React.ReactNode
}

export function RankingPage({ stats, settlements, records, onPlayerClick }: RankingPageProps) {
  const sortedByTotal = useMemo(() => [...stats.players].sort((a, b) => b.total - a.total), [stats.players])
  const sortedByWinRate = useMemo(() => [...stats.players]
    .filter((p) => p.games >= 5)
    .sort((a, b) => parseFloat(b.winRate) - parseFloat(a.winRate)), [stats.players])
  const sortedByAvg = useMemo(() => [...stats.players].filter((p) => p.games >= 5).sort((a, b) => b.avgScore - a.avgScore), [stats.players])
  const attendanceBoard = useMemo(() => computeAttendanceBoard(records), [records])
  const clearBoard = useMemo(() => computeClearBoard(settlements), [settlements])

  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    leaderboard: true,
  })

  const toggle = (key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const sections: BoardSection[] = [
    {
      key: "leaderboard",
      icon: "🐉",
      title: "龙虎榜",
      subtitle: "累计积分排行",
      render: () => (
        <div className="space-y-1">
          {sortedByTotal.map((p, i) => (
            <div key={p.name}
              className={`flex items-center justify-between py-2.5 px-3 rounded-lg cursor-pointer transition-all duration-200 ${
                i === 0 ? "bg-amber-500/5 hover:bg-amber-500/10" :
                i === 1 ? "bg-slate-400/5 hover:bg-slate-400/10" :
                i === 2 ? "bg-orange-600/5 hover:bg-orange-600/10" :
                "hover:bg-muted/15"
              }`}
              onClick={() => onPlayerClick?.(p.name)}>
              <div className="flex items-center gap-3">
                {i === 0 && <span className="text-base">🥇</span>}
                {i === 1 && <span className="text-base">🥈</span>}
                {i === 2 && <span className="text-base">🥉</span>}
                {i > 2 && <span className="w-5 text-center text-xs text-muted-foreground/60">{i + 1}</span>}
                <span className={i < 3 ? "font-semibold" : "text-muted-foreground/80"}>{p.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-muted-foreground/60">{p.games} 场</span>
                <span className={`font-mono text-sm font-semibold min-w-[60px] text-right ${p.total > 0 ? "text-emerald-400" : p.total < 0 ? "text-red-400" : "text-muted-foreground"}`}>
                  {p.total > 0 ? "+" : ""}{p.total.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      key: "winrate",
      icon: "📊",
      title: "胜率榜",
      subtitle: "≥5场",
      render: () => (
        <div className="space-y-1">
          {sortedByWinRate.map((p, i) => (
            <div key={p.name} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/15 cursor-pointer transition-all duration-200" onClick={() => onPlayerClick?.(p.name)}>
              <div className="flex items-center gap-3">
                <span className="w-5 text-center text-xs text-muted-foreground/60">{i + 1}</span>
                <span className="text-muted-foreground/80">{p.name}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-[10px] text-muted-foreground/60">{p.wins}胜 {p.losses}负</span>
                <div className="w-16 bg-muted/20 rounded-full h-1.5">
                  <div className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-1.5 rounded-full transition-all duration-500" style={{ width: `${parseFloat(p.winRate)}%` }} />
                </div>
                <span className="font-mono text-xs text-emerald-400 min-w-[36px] text-right">{p.winRate}%</span>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      key: "avg",
      icon: "🔥",
      title: "场均排行",
      subtitle: "≥5场",
      render: () => (
        <div className="space-y-1">
          {sortedByAvg.map((p, i) => (
            <div key={p.name} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/15 cursor-pointer transition-all duration-200" onClick={() => onPlayerClick?.(p.name)}>
              <div className="flex items-center gap-3">
                <span className="w-5 text-center text-xs text-muted-foreground/60">{i + 1}</span>
                <span className="text-muted-foreground/80">{p.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-muted-foreground/60">{p.games} 场</span>
                <span className={`font-mono text-sm font-semibold ${p.avgScore > 0 ? "text-emerald-400" : p.avgScore < 0 ? "text-red-400" : "text-muted-foreground"}`}>
                  {p.avgScore > 0 ? "+" : ""}{p.avgScore.toFixed(0)}
                </span>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      key: "clear",
      icon: "🤝",
      title: "清分榜",
      subtitle: "请吃饭排行",
      render: () => (
        clearBoard.length === 0 ? (
          <p className="text-sm text-muted-foreground/60 text-center py-6">暂无清分记录</p>
        ) : (
          <div className="space-y-1">
            {clearBoard.map((p, i) => (
              <div key={p.name} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/15 cursor-pointer transition-all duration-200" onClick={() => onPlayerClick?.(p.name)}>
                <div className="flex items-center gap-3">
                  <span className="w-5 text-center text-xs text-muted-foreground/60">{i + 1}</span>
                  <span className="text-muted-foreground/80">{p.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-muted-foreground/60">{p.clearCount} 次</span>
                  <span className="font-mono text-sm font-semibold text-amber-400">{p.totalAmount.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )
      ),
    },
    {
      key: "attendance",
      icon: "🎯",
      title: "出勤榜",
      subtitle: "参与场次排行",
      render: () => (
        <div className="space-y-1">
          {attendanceBoard.map((p, i) => (
            <div key={p.name} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/15 cursor-pointer transition-all duration-200" onClick={() => onPlayerClick?.(p.name)}>
              <div className="flex items-center gap-3">
                {i === 0 && <span className="text-base">🏅</span>}
                {i > 0 && <span className="w-5 text-center text-xs text-muted-foreground/60">{i + 1}</span>}
                <span className="text-muted-foreground/80">{p.name}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-[10px] text-muted-foreground/60">{p.sessions}/{p.totalSessions} 场</span>
                <div className="w-14 bg-muted/20 rounded-full h-1.5">
                  <div className="bg-gradient-to-r from-blue-600 to-blue-400 h-1.5 rounded-full transition-all duration-500" style={{ width: `${parseFloat(p.attendanceRate)}%` }} />
                </div>
                <span className="font-mono text-xs text-blue-400 min-w-[36px] text-right">{p.attendanceRate}%</span>
              </div>
            </div>
          ))}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-3">
      {sections.map((section) => (
        <Card key={section.key} className="border-border/40 bg-card/60 backdrop-blur overflow-hidden">
          <button
            onClick={() => toggle(section.key)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/10 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{section.icon}</span>
              <span className="text-sm font-semibold">{section.title}</span>
              <span className="text-[10px] text-muted-foreground/60">{section.subtitle}</span>
            </div>
            <svg
              className={`w-4 h-4 text-muted-foreground/50 transition-transform duration-300 ${expanded[section.key] ? "rotate-180" : ""}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expanded[section.key] && (
            <CardContent className="pt-0 pb-3 px-2">
              {section.render()}
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  )
}
