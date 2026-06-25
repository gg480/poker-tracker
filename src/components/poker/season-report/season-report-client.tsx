"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import type { PokerRecord, Season, PlayerSettlement, ComputedStats } from "@/lib/types"
import { computeStats } from "@/lib/stats"
import { useSeasonStore } from "@/stores/season-store"
import { useRecordStore } from "@/stores/record-store"
import { useSettlementStore } from "@/stores/settlement-store"
import { getRecordsForSeason, getSettlementsForSeason } from "@/lib/data"
import { StatsDashboard } from "./stats-dashboard"
import { HighlightsList } from "./highlights-list"
import { TrendChart } from "./trend-chart"
import { SeasonAwards } from "./season-awards"
import { SeasonComparison } from "./season-comparison"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ChevronLeft, FileText } from "lucide-react"
import Link from "next/link"

async function apiGet<T>(path: string): Promise<T[]> {
  const res = await fetch(path)
  const json = await res.json()
  return json.success ? json.data : []
}

export function SeasonReportClient() {
  const { seasons, activeSeason, loadSeasons } = useSeasonStore()
  const { records: allRecords, loadRecords, sessions } = useRecordStore()
  const { settlements, loadSettlements } = useSettlementStore()
  const [loading, setLoading] = useState(true)
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const [apiRecords, apiSeasons, apiSettlements] = await Promise.all([
          apiGet<PokerRecord>("/api/poker-records"),
          apiGet<Season>("/api/seasons"),
          apiGet<PlayerSettlement>("/api/settlements"),
        ])
        loadRecords(apiRecords)
        loadSeasons(apiSeasons)
        loadSettlements(apiSettlements)
      } catch {
        // 静默失败，使用空数据
      } finally {
        setLoading(false)
      }
    }
    if (allRecords.length === 0) {
      loadData()
    } else {
      setLoading(false)
    }
  }, [allRecords.length, loadRecords, loadSeasons, loadSettlements])

  // 确定要显示的赛季
  const displaySeason = useMemo(() => {
    if (selectedSeasonId) {
      return seasons.find((s: Season) => s.id === selectedSeasonId) || null
    }
    // 优先显示当前赛季，其次显示最近的已关闭赛季
    const active = seasons.find((s: Season) => s.active)
    if (active) return active
    const closed = seasons.filter((s: Season) => !s.active)
    return closed.length > 0 ? closed[0] : null
  }, [selectedSeasonId, seasons])

  // 过滤数据到选中赛季
  const filteredRecords = useMemo((): PokerRecord[] => {
    if (!displaySeason) return []
    return getRecordsForSeason(allRecords as PokerRecord[], displaySeason)
  }, [displaySeason, allRecords])

  const filteredSettlements = useMemo((): PlayerSettlement[] => {
    if (!displaySeason) return []
    return getSettlementsForSeason(settlements as PlayerSettlement[], displaySeason.id)
  }, [displaySeason, settlements])

  // 计算统计数据
  const stats = useMemo((): ComputedStats => {
    if (filteredRecords.length === 0) {
      return {
        players: [],
        totalGames: 0,
        totalRecords: 0,
        dates: [],
        dateMap: {},
        dailyBests: {},
        trendData: [],
        cumulative: {},
      }
    }
    return computeStats(filteredRecords)
  }, [filteredRecords])

  // 获取上一赛季用于对比
  const previousSeason = useMemo(() => {
    if (!displaySeason) return null
    const idx = seasons.findIndex((s: Season) => s.id === displaySeason.id)
    if (idx < 0 || idx >= seasons.length - 1) return null
    return seasons[idx + 1] // 数组是按时间倒序排列的
  }, [displaySeason, seasons])

  const previousSeasonRecords = useMemo((): PokerRecord[] => {
    if (!previousSeason) return []
    return getRecordsForSeason(allRecords as PokerRecord[], previousSeason)
  }, [previousSeason, allRecords])

  const handleBack = useCallback(() => {
    window.location.href = "/"
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-6 w-40" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (!displaySeason) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span className="text-lg font-medium">赛季总结报告</span>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">暂无赛季数据</p>
            <p className="text-sm text-muted-foreground/70 mt-1">请先创建赛季并录入比赛记录</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold">赛季总结报告</h1>
          <p className="text-sm text-muted-foreground">{displaySeason.name}</p>
        </div>
      </div>

      {/* 赛季选择器 */}
      {seasons.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {seasons.map((s: Season) => (
            <Button
              key={s.id}
              variant={displaySeason?.id === s.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedSeasonId(s.id)}
              className="whitespace-nowrap"
            >
              {s.name}
              {s.active && <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />}
            </Button>
          ))}
        </div>
      )}

      {/* 数据看板 */}
      <StatsDashboard stats={stats} filteredRecords={filteredRecords} />

      {/* 大事记 */}
      <HighlightsList stats={stats} filteredRecords={filteredRecords} settlements={filteredSettlements} />

      {/* 积分走势图表 */}
      <TrendChart stats={stats} />

      {/* 赛季颁奖 */}
      <SeasonAwards stats={stats} />

      {/* 赛季对比 */}
      {previousSeason && (
        <SeasonComparison
          currentSeasonRecords={filteredRecords}
          previousSeasonRecords={previousSeasonRecords}
          currentSeasonName={displaySeason.name}
          previousSeasonName={previousSeason.name}
        />
      )}
    </div>
  )
}