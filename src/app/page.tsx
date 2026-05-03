"use client"

import { useEffect, useCallback, useMemo, useState } from "react"
import type { PokerRecord, Season, PlayerSettlement, ComputedStats, ClearRadarAlert, ShareCardData } from "@/lib/types"
import {
  loadRecords as fetchRecords, saveRecords as persistRecords,
  loadSeasons as fetchSeasons, saveSeasons as persistSeasons,
  loadSettlements as fetchSettlements, saveSettlement as persistSettlement,
  SEED_RECORDS, SEED_SEASONS, SEED_SETTLEMENTS,
  getRecordsForSeason, getSettlementsForSeason,
  getSettlementForPlayer, calcBalance,
} from "@/lib/data"
import { useUIStore } from "@/stores/ui-store"
import { useRecordStore } from "@/stores/record-store"
import { useSeasonStore } from "@/stores/season-store"
import { useSettlementStore } from "@/stores/settlement-store"
import { useStats, computeStats, computeAwards } from "@/lib/stats"
import { getClearRadarAlerts } from "@/services/clear-radar-service"
import { APP_NAME, APP_SLOGAN } from "@/lib/constants"

import { SeasonOverview } from "@/components/poker/home/season-overview"
import { TodaySummary } from "@/components/poker/home/today-summary"
import { ClearRadarAlerts } from "@/components/poker/home/clear-radar-alerts"
import { QuickActions } from "@/components/poker/home/quick-actions"
import { CollaborativeEntry } from "@/components/poker/record/collaborative-entry"
import { SessionList } from "@/components/poker/record/session-list"
import { RankingPage } from "@/components/poker/ranking/ranking-page"
import { HandPage } from "@/components/poker/hand/hand-page"
import { ProfilePage } from "@/components/poker/profile/profile-page"
import { Dashboard } from "@/components/poker/dashboard"
import { PlayerView } from "@/components/poker/player-view"
import { Awards } from "@/components/poker/awards"
import { AwardsPage } from "@/components/poker/ranking/awards-page"
import { SeasonManager } from "@/components/poker/season-manager"
import { AIAnalysis } from "@/components/poker/ai-analysis"
import { ShareButton } from "@/components/poker/share/share-button"

const TABS = [
  { key: "home", label: "首页", icon: "🏠" },
  { key: "record", label: "记录", icon: "✏️" },
  { key: "ranking", label: "排行", icon: "🏆" },
  { key: "hand", label: "手牌", icon: "🃏" },
  { key: "profile", label: "我的", icon: "👤" },
] as const

type TabKey = (typeof TABS)[number]["key"]

async function apiGet<T>(path: string): Promise<T[]> {
  const res = await fetch(path)
  const json = await res.json()
  return json.success ? json.data : []
}

async function apiPost<T>(path: string, body: unknown): Promise<T | null> {
  const res = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
  const json = await res.json()
  return json.success ? json.data : null
}

async function apiPut<T>(path: string, body: unknown): Promise<T | null> {
  const res = await fetch(path, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
  const json = await res.json()
  return json.success ? json.data : null
}

export default function PokerTracker() {
  const { activeTab, seasonFilter, selectedPlayer, setActiveTab, setSeasonFilter, setSelectedPlayer } = useUIStore()
  const { records: allRecords, loadRecords, setLoading: setRecordLoading } = useRecordStore()
  const { seasons, activeSeason, loadSeasons, setLoading: setSeasonLoading } = useSeasonStore()
  const { settlements, loadSettlements, upsertSettlement } = useSettlementStore()
  const recordLoading = useRecordStore((s) => s.loading)
  const seasonLoading = useSeasonStore((s) => s.loading)
  const loading = recordLoading || seasonLoading

  const [shareData, setShareData] = useState<ShareCardData | null>(null)
  const [shareOpen, setShareOpen] = useState(false)

  useEffect(() => {
    async function loadData() {
      setRecordLoading(true)
      setSeasonLoading(true)
      try {
        const [apiRecords, apiSeasons, apiSettlements] = await Promise.all([
          apiGet("/api/poker-records"),
          apiGet("/api/seasons"),
          apiGet("/api/settlements"),
        ])
        if (apiRecords.length > 0) {
          loadRecords(apiRecords)
        } else {
          const [stored, storedSeasons, storedSettlements] = await Promise.all([fetchRecords(), fetchSeasons(), fetchSettlements()])
          if (stored.length > 0) { loadRecords(stored) } else { loadRecords(SEED_RECORDS); persistRecords(SEED_RECORDS) }
          if (storedSeasons.length > 0) { loadSeasons(storedSeasons) } else { loadSeasons(SEED_SEASONS); persistSeasons(SEED_SEASONS) }
          if (storedSettlements.length > 0) { loadSettlements(storedSettlements) } else { loadSettlements(SEED_SETTLEMENTS); SEED_SETTLEMENTS.forEach(persistSettlement) }
          return
        }
        loadRecords(apiRecords)
        loadSeasons(apiSeasons.length > 0 ? apiSeasons : SEED_SEASONS)
        loadSettlements(apiSettlements.length > 0 ? apiSettlements : SEED_SETTLEMENTS)
      } catch {
        const [stored, storedSeasons, storedSettlements] = await Promise.all([fetchRecords(), fetchSeasons(), fetchSettlements()])
        loadRecords(stored.length > 0 ? stored : SEED_RECORDS)
        loadSeasons(storedSeasons.length > 0 ? storedSeasons : SEED_SEASONS)
        loadSettlements(storedSettlements.length > 0 ? storedSettlements : SEED_SETTLEMENTS)
        if (stored.length === 0) { persistRecords(SEED_RECORDS); persistSeasons(SEED_SEASONS); SEED_SETTLEMENTS.forEach(persistSettlement) }
      } finally {
        setRecordLoading(false)
        setSeasonLoading(false)
      }
    }
    loadData()
  }, [])

  useEffect(() => {
    function handleShareEvent(e: Event) {
      const detail = (e as CustomEvent).detail
      if (detail) {
        setShareData({
          seasonName: detail.seasonName || activeSeason?.name,
          date: detail.date,
          records: detail.entries.map((e: any) => ({ player: e.player, score: Number(e.score) })),
        })
        setShareOpen(true)
      }
    }
    window.addEventListener("poker:share", handleShareEvent)
    return () => window.removeEventListener("poker:share", handleShareEvent)
  }, [activeSeason])

  const tab = activeTab as TabKey
  const currentSeason = seasonFilter === "all" ? null : seasons.find((s: any) => s.id === seasonFilter) ?? null
  const filteredRecords = currentSeason ? getRecordsForSeason(allRecords as PokerRecord[], currentSeason) : allRecords as PokerRecord[]
  const filteredSettlements = useMemo(() => currentSeason ? getSettlementsForSeason(settlements as PlayerSettlement[], (currentSeason as any).id) : settlements as PlayerSettlement[], [currentSeason, settlements])
  const stats = useStats(filteredRecords)
  const awards = computeAwards(stats, filteredSettlements)

  const radarAlerts = useMemo(() => {
    if (!currentSeason) return []
    return getClearRadarAlerts(
      stats.players,
      (currentSeason as any).id,
      filteredSettlements
    )
  }, [currentSeason, stats.players, filteredSettlements])

  const saveRecords = useCallback(async (newRecords: PokerRecord[]) => {
    loadRecords(newRecords)
    persistRecords(newRecords)
    try { await apiPost("/api/poker-records", newRecords) } catch {}
  }, [loadRecords])

  const updateSettlement = useCallback(async (settlement: PlayerSettlement) => {
    upsertSettlement(settlement as any)
    persistSettlement(settlement)
    try { await apiPost("/api/settlements", settlement) } catch {}
  }, [upsertSettlement])

  const handleSettlePlayer = useCallback((player: string) => {
    if (!activeSeason) return
    const existing = getSettlementForPlayer(settlements as PlayerSettlement[], player, (activeSeason as any).id)
    updateSettlement({ player, seasonId: (activeSeason as any).id, settleScore: (existing?.settleScore ?? 0) + 8000, seasonAdjust: existing?.seasonAdjust ?? 0 })
  }, [activeSeason, settlements, updateSettlement])

  const handleEndSeason = useCallback(async () => {
    if (!activeSeason) return
    const seasonId = (activeSeason as any).id
    const seasonStats = computeStats(getRecordsForSeason(allRecords as PokerRecord[], activeSeason))
    const seasonSettlements = getSettlementsForSeason(settlements as PlayerSettlement[], seasonId)
    const updatedSettlements = [...settlements as PlayerSettlement[]]
    for (const p of seasonStats.players) {
      const existing = getSettlementForPlayer(seasonSettlements, p.name, seasonId)
      const settleScore = existing?.settleScore ?? 0
      const currentSeasonAdjust = existing?.seasonAdjust ?? 0
      const balance = calcBalance(p.total, { player: p.name, seasonId, settleScore, seasonAdjust: currentSeasonAdjust })
      if (balance !== 0) {
        const newSettlement: PlayerSettlement = { player: p.name, seasonId, settleScore, seasonAdjust: currentSeasonAdjust + (-balance) }
        const idx = updatedSettlements.findIndex((s) => s.player === p.name && s.seasonId === seasonId)
        if (idx >= 0) { updatedSettlements[idx] = newSettlement } else { updatedSettlements.push(newSettlement) }
        persistSettlement(newSettlement)
        try { await apiPost("/api/settlements", newSettlement) } catch {}
      }
    }
    loadSettlements(updatedSettlements)
    const updatedSeasons = seasons.map((s: any) => s.id === seasonId ? { ...s, active: false, endDate: new Date().toISOString().slice(0, 10) } : s)
    loadSeasons(updatedSeasons)
    persistSeasons(updatedSeasons)
    try { await apiPut("/api/seasons", { id: seasonId, active: false, endDate: new Date().toISOString().slice(0, 10) }) } catch {}
  }, [activeSeason, allRecords, settlements, seasons, loadSettlements, loadSeasons])

  const handleCreateSeason = useCallback(async (name: string) => {
    try {
      const data = await apiPost("/api/seasons", { name, start_date: new Date().toISOString().slice(0, 10), active: true })
      if (data) {
        const newSeason = { id: (data as any).id, name, startDate: new Date().toISOString().slice(0, 10), active: true }
        loadSeasons([newSeason, ...seasons as any])
      }
    } catch {}
  }, [seasons, loadSeasons])

  const handleExport = useCallback(async () => {
    try {
      const res = await fetch("/api/import-export")
      if (!res.ok) throw new Error("Export failed")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      const date = new Date().toISOString().split("T")[0]
      link.download = `poker-tracker-backup-${date}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Export failed:", error)
    }
  }, [])

  const handleImport = useCallback(async (file: File) => {
    try {
      const text = await file.text()
      const res = await fetch("/api/import-export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: text,
      })
      const json = await res.json()
      if (json.success) {
        window.location.reload()
      } else {
        alert(json.error || "导入失败")
      }
    } catch (error) {
      alert("导入失败: " + (error instanceof Error ? error.message : "未知错误"))
    }
  }, [])

  if (loading) return <div className="flex justify-center items-center h-screen text-primary text-lg">加载中...</div>

  return (
    <div className="min-h-screen pb-20 bg-background">
      <header className="sticky top-0 z-40 px-4 sm:px-6 py-3 border-b border-border/60 bg-gradient-to-b from-[#111827]/95 to-[#0a0e1a]/95 backdrop-blur-xl">
        <div className="flex justify-between items-center max-w-[1200px] mx-auto">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-lg sm:text-xl tracking-wider text-muted-foreground/80">{APP_SLOGAN}</span>
            <h1 className="text-base sm:text-lg font-bold bg-gradient-to-r from-primary via-indigo-400 to-amber-500 bg-clip-text text-transparent gradient-shimmer">{APP_NAME}</h1>
          </div>
          <div className="flex gap-3 items-center">
            <span className="text-[10px] sm:text-xs text-muted-foreground/70 font-mono">{stats.totalGames} 场</span>
            <span className="text-[10px] sm:text-xs text-muted-foreground/70 font-mono">{stats.players.length} 人</span>
          </div>
        </div>
      </header>

      <div className="sticky top-[52px] z-30 px-4 sm:px-6 py-2 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="flex items-center gap-1.5 max-w-[1200px] mx-auto overflow-x-auto scrollbar-hide">
          <button onClick={() => setSeasonFilter("all")} className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 ${seasonFilter === "all" ? "bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30" : "text-muted-foreground/70 hover:bg-primary/10 hover:text-primary/80"}`}>全部</button>
          {seasons.map((s: any, i: number) => (<button key={s.id || `season-${i}`} onClick={() => setSeasonFilter(s.id)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 ${seasonFilter === s.id ? "bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30" : s.active ? "text-green-400/80 hover:bg-green-500/10" : "text-muted-foreground/70 hover:bg-primary/10 hover:text-primary/80"}`}>{s.name}{s.active && <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse align-middle" />}</button>))}
        </div>
      </div>

      <main className="px-4 sm:px-6 pt-4 pb-6 max-w-[1200px] mx-auto tab-content">
        {tab === "home" && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SeasonOverview season={currentSeason as any} totalGames={stats.totalGames} totalPlayers={stats.players.length} settlements={filteredSettlements} />
              <TodaySummary records={filteredRecords} seasonName={currentSeason ? (currentSeason as any).name : undefined} />
            </div>
            <ClearRadarAlerts alerts={radarAlerts} onSettle={handleSettlePlayer} />
            <QuickActions onNavigate={(t) => setActiveTab(t as any)} />
            <Dashboard stats={stats} settlements={filteredSettlements} onPlayerClick={(name) => { setSelectedPlayer(name); setActiveTab("ranking" as any) }} />
            <AIAnalysis stats={stats} />
          </div>
        )}
        {tab === "record" && (
          <div className="space-y-5">
            <CollaborativeEntry records={allRecords as PokerRecord[]} stats={stats} onSave={saveRecords} activeSeasonId={(activeSeason as any)?.id} />
            <SessionList sessions={[]} records={filteredRecords} seasonName={currentSeason ? (currentSeason as any).name : undefined} />
          </div>
        )}
        {tab === "ranking" && (
          <div className="space-y-5">
            <RankingPage stats={stats} settlements={filteredSettlements} records={filteredRecords} onPlayerClick={(name) => { setSelectedPlayer(name) }} />
            <AwardsPage stats={stats} settlements={filteredSettlements} onPlayerClick={(name) => { setSelectedPlayer(name) }} />
            {selectedPlayer && (
              <PlayerView stats={stats} records={filteredRecords} settlements={filteredSettlements} selected={selectedPlayer} onSelect={(name) => setSelectedPlayer(name)} />
            )}
          </div>
        )}
        {tab === "hand" && <HandPage records={filteredRecords} stats={stats} activeSeasonId={(activeSeason as any)?.id} />}
        {tab === "profile" && (
          <ProfilePage
            seasons={seasons as Season[]}
            activeSeason={activeSeason as Season | null}
            stats={stats}
            settlements={filteredSettlements}
            records={filteredRecords.map((r) => ({ date: r.date, player: r.player, score: r.score }))}
            onEndSeason={handleEndSeason}
            onCreateSeason={handleCreateSeason}
            onExport={handleExport}
            onImport={handleImport}
            onImportCSVRecords={(csvRecords) => {
              const newRecs: PokerRecord[] = csvRecords.map((r) => ({
                date: r.date,
                player: r.player,
                score: r.score,
                win: (r.score > 0 ? 1 : -1) as 1 | -1,
              }))
              saveRecords([...allRecords as PokerRecord[], ...newRecs])
            }}
          />
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-[#0f172a]/90 backdrop-blur-xl border-t border-border/40 flex justify-around py-1.5 px-2 z-50 safe-area-bottom">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key as any)}
            className={`relative flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all duration-300 ease-out group ${
              tab === t.key
                ? "text-primary scale-105"
                : "text-muted-foreground/70 hover:text-primary/70 active:scale-95"
            }`}
          >
            {tab === t.key && (
              <span className="absolute inset-0 -z-10 bg-primary/8 rounded-xl blur-sm" />
            )}
            <span className={`text-lg transition-transform duration-300 ${tab === t.key ? "scale-110 -translate-y-0.5" : "group-hover:scale-105"}`}>{t.icon}</span>
            <span className={`text-[10px] font-medium transition-all duration-300 ${tab === t.key ? "font-semibold" : ""}`}>{t.label}</span>
          </button>
        ))}
      </nav>
      <ShareButton data={shareData} open={shareOpen} onOpenChange={setShareOpen} />
    </div>
  )
}
