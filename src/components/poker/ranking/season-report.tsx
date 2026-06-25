"use client"

import { useMemo } from "react"
import type { Season, PokerRecord, PlayerSettlement, GameSession } from "@/lib/types"
import { getRecordsForSeason, getSettlementsForSeason } from "@/lib/data"
import { TOP_N_LEADERBOARD } from "@/lib/constants"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface SeasonReportProps {
  season: Season
  allRecords: PokerRecord[]
  settlements: PlayerSettlement[]
  sessions: GameSession[]
  prevSeason?: Season
  prevRecords?: PokerRecord[]
  prevSettlements?: PlayerSettlement[]
}

function calcStreaks(records: PokerRecord[]) {
  const playerSorted: Record<string, { date: string; score: number }[]> = {}
  for (const r of records) {
    if (!playerSorted[r.player]) playerSorted[r.player] = []
    playerSorted[r.player].push({ date: r.date, score: r.score })
  }
  for (const p of Object.keys(playerSorted)) {
    playerSorted[p].sort((a, b) => a.date.localeCompare(b.date))
  }

  let longestStreak = { player: "", count: 0, start: "", end: "" }
  let longestWin = { player: "", score: 0, date: "" }
  let biggestComeback = { player: "", gap: 0, date: "" }
  let mostActive = { player: "", count: 0 }

  for (const [player, entries] of Object.entries(playerSorted)) {
    if (entries.length > mostActive.count) {
      mostActive = { player, count: entries.length }
    }

    let streak = 0
    for (let i = 0; i < entries.length; i++) {
      if (entries[i].score > 0) {
        streak++
        if (i === entries.length - 1 && streak > longestStreak.count) {
          longestStreak = {
            player,
            count: streak,
            start: entries[i - streak + 1].date,
            end: entries[i].date,
          }
        }
      } else {
        if (streak > longestStreak.count) {
          longestStreak = {
            player,
            count: streak,
            start: entries[i - streak].date,
            end: entries[i - 1].date,
          }
        }
        streak = 0
      }
    }

    for (const e of entries) {
      if (e.score > longestWin.score) {
        longestWin = { player, score: e.score, date: e.date }
      }
    }
  }

  for (const [player, entries] of Object.entries(playerSorted)) {
    for (let i = 1; i < entries.length; i++) {
      if (entries[i].score > 0 && entries[i - 1].score < 0) {
        const gap = entries[i].score - entries[i - 1].score
        if (gap > biggestComeback.gap) {
          biggestComeback = { player, gap, date: entries[i].date }
        }
      }
    }
  }

  return { longestStreak, longestWin, biggestComeback, mostActive }
}

export function SeasonReport({
  season,
  allRecords,
  settlements,
  sessions,
  prevSeason,
  prevRecords,
  prevSettlements,
}: SeasonReportProps) {
  const seasonRecords = useMemo(
    () => getRecordsForSeason(allRecords as PokerRecord[], season),
    [allRecords, season]
  )
  const seasonSettlements = useMemo(
    () => getSettlementsForSeason(settlements, season.id),
    [settlements, season.id]
  )
  const seasonSessions = useMemo(
    () => sessions.filter((s) => s.seasonId === season.id),
    [sessions, season.id]
  )

  const playerTotals = useMemo(() => {
    const map: Record<string, number> = {}
    for (const r of seasonRecords) {
      map[r.player] = (map[r.player] || 0) + r.score
    }
    return Object.entries(map)
      .map(([player, total]) => ({ player, total }))
      .sort((a, b) => b.total - a.total)
  }, [seasonRecords])

  const playerGames = useMemo(() => {
    const map: Record<string, Set<string>> = {}
    for (const r of seasonRecords) {
      if (!map[r.player]) map[r.player] = new Set()
      map[r.player].add(r.date)
    }
    return Object.fromEntries(
      Object.entries(map).map(([p, dates]) => [p, dates.size])
    )
  }, [seasonRecords])
  // NOTE: avgAbsScore uses |score| (absolute value), unlike the "avgScore" in PlayerStats
  // which uses net score. This is intentional — it measures game intensity (stakes volume),
  // not performance. The label "场均绝对值" reflects this.
  const avgAbsScore = seasonRecords.length > 0
    ? Math.round(seasonRecords.reduce((s: number, r: PokerRecord) => s + Math.abs(r.score), 0) / seasonRecords.length)
    : 0

  const { longestStreak, longestWin, biggestComeback, mostActive } = useMemo(
    () => calcStreaks(seasonRecords),
    [seasonRecords]
  )

  const dailyScores = useMemo(() => {
    const dateMap: Record<string, number> = {}
    for (const r of seasonRecords) {
      const key = r.date
      dateMap[key] = (dateMap[key] || 0) + r.score
    }
    return Object.entries(dateMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, score]) => ({ date, score }))
  }, [seasonRecords])

  const totalScoreFlow = seasonRecords.reduce((s: number, r: PokerRecord) => s + Math.abs(r.score), 0)

  const prevSeasonData = useMemo(() => {
    if (!prevSeason || !prevRecords) return null
    const rs = getRecordsForSeason(prevRecords as PokerRecord[], prevSeason)
    const s = getSettlementsForSeason(prevSettlements ?? [], prevSeason.id)
    const total = rs.reduce((sum: number, r: PokerRecord) => sum + Math.abs(r.score), 0)
    return {
      records: rs,
      settlements: s,
      playerCount: new Set(rs.map((r: PokerRecord) => r.player)).size,
      totalGames: new Set(rs.map((r: PokerRecord) => r.date)).size,
      avgAbsScore: rs.length > 0 ? Math.round(total / rs.length) : 0,
    }
  }, [prevSeason, prevRecords, prevSettlements])

  const maxScore = Math.max(...dailyScores.map((d) => Math.abs(d.score)), 1)

  return (
    <div className="space-y-5">
      <Card className="border-border/40 bg-card/60 backdrop-blur">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="text-lg">📊</span> {season.name} · 赛季总结
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="总场次" value={seasonSessions.length} icon="🎮" />
            <StatCard label="参与玩家" value={playerTotals.length} icon="👥" />
            <StatCard label="场均绝对值" value={avgAbsScore} icon="📈" />
            <StatCard label="积分总流量" value={totalScoreFlow.toLocaleString()} icon="💫" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-border/40 bg-card/60 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <span className="text-lg">🏆</span> 排行榜
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {playerTotals.slice(0, TOP_N_LEADERBOARD).map((p, i) => (
              <div key={p.player} className="flex justify-between items-center text-sm">
                <span>
                  <span className="mr-1.5">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}</span>
                  {p.player}
                </span>
                <span className={`font-mono font-medium ${p.total > 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {p.total > 0 ? "+" : ""}{p.total.toLocaleString()}
                </span>
              </div>
            ))}
            {playerTotals.length > TOP_N_LEADERBOARD && (
              <p className="text-xs text-muted-foreground text-center pt-1">
                + {playerTotals.length - TOP_N_LEADERBOARD} 位其他玩家
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-card/60 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <span className="text-lg">🔥</span> 大事记
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <MilestoneItem
              icon="💰"
              label="单场最高盈利"
              value={`${longestWin.player} +${longestWin.score}`}
              sub={`${longestWin.date}`}
            />
            <MilestoneItem
              icon="⚡"
              label="最长连胜"
              value={`${longestStreak.player} ${longestStreak.count} 场`}
              sub={longestStreak.count > 1 ? `${longestStreak.start} ~ ${longestStreak.end}` : ""}
            />
            <MilestoneItem
              icon="🔄"
              label="最大逆转"
              value={`${biggestComeback.player}`}
              sub={biggestComeback.gap > 0 ? `逆转差额 ${biggestComeback.gap}` : "暂无数据"}
            />
            <MilestoneItem
              icon="🎯"
              label="最活跃玩家"
              value={`${mostActive.player} ${mostActive.count} 次`}
              sub=""
            />
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/40 bg-card/60 backdrop-blur">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <span className="text-lg">📈</span> 每日积分走势
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dailyScores.length > 0 ? (
            <div className="flex items-end gap-1 h-32 overflow-x-auto pb-1">
              {dailyScores.map((d) => {
                const h = Math.max(4, (Math.abs(d.score) / maxScore) * 100)
                return (
                  <div key={d.date} className="flex flex-col items-center gap-0.5 min-w-[24px]">
                    <span className={`text-[10px] font-mono ${d.score > 0 ? "text-emerald-400" : d.score < 0 ? "text-red-400" : "text-muted-foreground"}`}>
                      {d.score > 0 ? "+" : ""}{d.score}
                    </span>
                    <div
                      className={`w-full rounded-t-sm ${d.score > 0 ? "bg-emerald-500/60" : d.score < 0 ? "bg-red-500/60" : "bg-muted-foreground/30"}`}
                      style={{ height: `${h}%` }}
                    />
                    <span className="text-[8px] text-muted-foreground truncate max-w-[24px]">
                      {d.date.slice(5)}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">暂无数据</p>
          )}
        </CardContent>
      </Card>

      {prevSeasonData && (
        <Card className="border-border/40 bg-card/60 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <span className="text-lg">📊</span> 与 {prevSeason?.name} 对比
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <CompareItem
                label="参与人数"
                current={playerTotals.length}
                prev={prevSeasonData.playerCount}
              />
              <CompareItem
                label="总场次"
                current={seasonSessions.length}
                prev={prevSeasonData.totalGames}
              />
              <CompareItem
                label="场均绝对值"
                current={avgAbsScore}
                prev={prevSeasonData.avgAbsScore}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function StatCard({ label, value, icon }: { label: string; value: number | string; icon: string }) {
  return (
    <div className="bg-muted/20 rounded-lg p-3 text-center">
      <span className="text-lg block mb-0.5">{icon}</span>
      <div className="text-lg font-bold font-mono">{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  )
}

function MilestoneItem({ icon, label, value, sub }: { icon: string; label: string; value: string; sub: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-base w-5 text-center shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-sm font-medium truncate">{value}</div>
        {sub && <div className="text-[10px] text-muted-foreground">{sub}</div>}
      </div>
    </div>
  )
}

function CompareItem({ label, current, prev }: { label: string; current: number; prev: number }) {
  const diff = current - prev
  const pct = prev > 0 ? Math.round((diff / prev) * 100) : 0
  return (
    <div className="bg-muted/20 rounded-lg p-3 text-center">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="flex items-center justify-center gap-2">
        <span className="text-sm font-mono font-bold">{current}</span>
        <span className="text-[10px] text-muted-foreground line-through">{prev}</span>
      </div>
      <span className={`text-[10px] font-mono ${diff > 0 ? "text-emerald-400" : diff < 0 ? "text-red-400" : "text-muted-foreground"}`}>
        {diff > 0 ? "↑" : diff < 0 ? "↓" : "→"} {Math.abs(pct)}%
      </span>
    </div>
  )
}
