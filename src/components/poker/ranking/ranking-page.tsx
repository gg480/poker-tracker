"use client"

import { useMemo, useState } from "react"
import type { ComputedStats, PlayerSettlement, PokerRecord, Season, GameSession } from "@/lib/types"
import { MIN_GAMES_FOR_AWARD } from "@/lib/constants"
import { computeAttendanceBoard, computeClearBoard } from "@/services/stats-service"
import { Card, CardContent } from "@/components/ui/card"
import { PlayerDialog } from "@/components/poker/player/player-dialog"
import { ScoreDisplay } from "@/components/poker/common/score-display"
import { useUIStore } from "@/stores/ui-store"

interface RankingPageProps {
  stats: ComputedStats
  settlements: PlayerSettlement[]
  records: PokerRecord[]
  allRecords: PokerRecord[]
  seasons: Season[]
  sessions: GameSession[]
  currentSeason: Season | null
  onPlayerClick?: (name: string) => void
}

interface BoardSection {
  key: string
  icon: string
  title: string
  subtitle: string
  render: () => React.ReactNode
}

export function RankingPage({ stats, settlements, records, allRecords, seasons, sessions, currentSeason, onPlayerClick }: RankingPageProps) {
  const selectedPlayer = useUIStore((s) => s.selectedPlayer)
  const setSelectedPlayer = useUIStore((s) => s.setSelectedPlayer)
  const sortedByTotal = useMemo(() => [...stats.players].sort((a, b) => b.total - a.total), [stats.players])
  const sortedByWinRate = useMemo(() => [...stats.players]
    .filter((p) => p.games >= MIN_GAMES_FOR_AWARD)
    .sort((a, b) => Number(b.winRate) - Number(a.winRate)), [stats.players])
  const sortedByAvg = useMemo(() => [...stats.players].filter((p) => p.games >= MIN_GAMES_FOR_AWARD).sort((a, b) => b.avgScore - a.avgScore), [stats.players])
  const attendanceBoard = useMemo(() => computeAttendanceBoard(records), [records])
  const clearBoard = useMemo(() => computeClearBoard(settlements), [settlements])

  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    leaderboard: true,
  })

  const toggle = (key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  // 统一奖牌样式：前3名显示奖牌+对应背景色
  function rankDisplay(index: number) {
    if (index === 0) {
      return {
        icon: <span className="text-base">🥇</span>,
        rowClass: "bg-amber-500/5 hover:bg-amber-500/10",
        nameClass: "font-semibold",
      }
    }
    if (index === 1) {
      return {
        icon: <span className="text-base">🥈</span>,
        rowClass: "bg-slate-400/5 hover:bg-slate-400/10",
        nameClass: "font-semibold",
      }
    }
    if (index === 2) {
      return {
        icon: <span className="text-base">🥉</span>,
        rowClass: "bg-orange-600/5 hover:bg-orange-600/10",
        nameClass: "font-semibold",
      }
    }
    return {
      icon: <span className="w-5 text-center text-xs text-muted-foreground/60">{index + 1}</span>,
      rowClass: "hover:bg-muted/15",
      nameClass: "text-muted-foreground/80",
    }
  }

  const sections: BoardSection[] = [
    {
      key: "leaderboard",
      icon: "🐉",
      title: "龙虎榜",
      subtitle: "累计积分排行",
      render: () => (
        <div className="space-y-1">
          {sortedByTotal.map((p, i) => {
            const rd = rankDisplay(i)
            return (
              <div key={p.name}
                className={`flex items-center justify-between py-2.5 px-3 rounded-lg cursor-pointer transition-all duration-200 ${rd.rowClass} focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2`}
                role="button" tabIndex={0}
                onClick={() => onPlayerClick?.(p.name)}
                onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && onPlayerClick) { e.preventDefault(); onPlayerClick(p.name) } }}>
                <div className="flex items-center gap-3">
                  {rd.icon}
                  <span className={rd.nameClass}>{p.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-muted-foreground/60">{p.games} 场</span>
                  <span className="min-w-[60px] text-right">
                    <ScoreDisplay score={p.total} className="text-sm font-semibold" />
                  </span>
                </div>
              </div>
            )
          })}
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
          {sortedByWinRate.map((p, i) => {
            const rd = rankDisplay(i)
            return (
              <div key={p.name} className={`flex items-center justify-between py-2.5 px-3 rounded-lg cursor-pointer transition-all duration-200 ${rd.rowClass} focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2`}
                role="button" tabIndex={0}
                onClick={() => onPlayerClick?.(p.name)}
                onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && onPlayerClick) { e.preventDefault(); onPlayerClick(p.name) } }}>
                  <span className="text-[10px] text-muted-foreground/60">{p.wins}胜 {p.losses}负</span>
                  <div className="w-full max-w-[200px] flex-1 bg-muted/20 rounded-full h-1.5">
                    <div className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-1.5 rounded-full transition-all duration-500" style={{ width: `${Number(p.winRate)}%` }} />
                  </div>
                  <span className="font-mono text-xs text-emerald-400 min-w-[36px] text-right">{p.winRate}%</span>
                </div>
            )
          })}
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
          {sortedByAvg.map((p, i) => {
            const rd = rankDisplay(i)
            return (
              <div key={p.name} className={`flex items-center justify-between py-2.5 px-3 rounded-lg cursor-pointer transition-all duration-200 ${rd.rowClass} focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2`}
                role="button" tabIndex={0}
                onClick={() => onPlayerClick?.(p.name)}
                onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && onPlayerClick) { e.preventDefault(); onPlayerClick(p.name) } }}>
                <div className="flex items-center gap-3">
                  {rd.icon}
                  <span className={rd.nameClass}>{p.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-muted-foreground/60">{p.wins}胜 {p.losses}负</span>
                  <ScoreDisplay score={p.avgScore} className="text-sm font-semibold" />
                </div>
              </div>
            )
          })}
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
            {clearBoard.map((p, i) => {
              const rd = rankDisplay(i)
              return (
                <div key={p.name} className={`flex items-center justify-between py-2.5 px-3 rounded-lg cursor-pointer transition-all duration-200 ${rd.rowClass} focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2`}
                role="button" tabIndex={0}
                onClick={() => onPlayerClick?.(p.name)}
                onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && onPlayerClick) { e.preventDefault(); onPlayerClick(p.name) } }}>
                  <div className="flex items-center gap-3">
                    {rd.icon}
                    <span className={rd.nameClass}>{p.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-muted-foreground/60">{p.clearCount} 次</span>
                    <span className="font-mono text-sm font-semibold text-amber-400">{p.totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              )
            })}
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
          {attendanceBoard.map((p, i) => {
            const rd = rankDisplay(i)
            return (
              <div key={p.name} className={`flex items-center justify-between py-2.5 px-3 rounded-lg cursor-pointer transition-all duration-200 ${rd.rowClass} focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2`}
                role="button" tabIndex={0}
                onClick={() => onPlayerClick?.(p.name)}
                onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && onPlayerClick) { e.preventDefault(); onPlayerClick(p.name) } }}>
                <div className="flex items-center gap-3">
                  {rd.icon}
                  <span className={rd.nameClass}>{p.name}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-[10px] text-muted-foreground/60">{p.sessions}/{p.totalSessions} 场</span>
                  <div className="w-14 bg-muted/20 rounded-full h-1.5">
                    <div className="bg-gradient-to-r from-blue-600 to-blue-400 h-1.5 rounded-full transition-all duration-500" style={{ width: `${parseFloat(p.attendanceRate)}%` }} />
                  </div>
                  <span className="font-mono text-xs text-blue-400 min-w-[36px] text-right">{p.attendanceRate}%</span>
                </div>
              </div>
            )
          })}
        </div>
      ),
    },
  ]

  return (
    <>
      <div className="space-y-3">
        {sections.map((section) => (
        <Card key={section.key} className="border-border/40 bg-card/60 backdrop-blur overflow-hidden">
          <button
            onClick={() => toggle(section.key)}
            aria-expanded={expanded[section.key]}
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
      <PlayerDialog
        open={selectedPlayer !== null}
        onClose={() => setSelectedPlayer(null)}
        playerName={selectedPlayer}
        stats={stats}
        records={records}
        settlements={settlements}
      />
    </>
  )
}
