"use client"

import { useEffect, useMemo, useState } from "react"
import type { PokerRecord, HandRecord, Season, PlayerSettlement, ShareCardData, GameSession } from "@/lib/types"
import {
  loadRecords as fetchRecords, saveRecords as persistRecords,
  loadSeasons as fetchSeasons, saveSeasons as persistSeasons,
  loadSettlements as fetchSettlements, saveSettlement as persistSettlement,
  SEED_RECORDS, SEED_SEASONS, SEED_SETTLEMENTS,
  getRecordsForSeason, getSettlementsForSeason,
} from "@/lib/data"
import { useUIStore } from "@/stores/ui-store"
import { useRecordStore } from "@/stores/record-store"
import { useSeasonStore } from "@/stores/season-store"
import { useSettlementStore } from "@/stores/settlement-store"
import { useStats } from "@/hooks/use-stats"
import { APP_NAME, APP_SLOGAN } from "@/lib/constants"

import { HomeTabContent } from "@/components/poker/home/home-tab-content"
import { SessionList } from "@/components/poker/record/session-list"
import { HandBrowser } from "@/components/poker/hand/hand-browser"
import { RankingPage } from "@/components/poker/ranking/ranking-page"
import { ShareButton } from "@/components/poker/share/share-button"
import { TabErrorBoundary } from "@/components/poker/common/error-boundary"
import { HomeSkeleton, RankingSkeleton, RecordSkeleton } from "@/components/ui/skeleton-page"
import Link from "next/link"
import { Home, Pencil, Trophy, FileBarChart, Upload, GraduationCap } from "lucide-react"

const TABS = [
  { key: "home", label: "首页", icon: Home },
  { key: "record", label: "记录", icon: Pencil },
  { key: "ranking", label: "排行", icon: Trophy },
] as const

type TabKey = (typeof TABS)[number]["key"]

async function apiGet<T>(path: string): Promise<T[]> {
  const res = await fetch(path)
  const json = await res.json()
  return json.success ? json.data : []
}

export default function PokerTracker() {
  const { activeTab, seasonFilter, selectedPlayer, setActiveTab, setSeasonFilter, setSelectedPlayer, currentSessionId, setCurrentSessionId } = useUIStore()
  const { records: allRecords, loadRecords, setLoading: setRecordLoading, sessions, loadSessions } = useRecordStore()
  const { seasons, activeSeason, loadSeasons, setLoading: setSeasonLoading } = useSeasonStore()
  const { settlements, loadSettlements } = useSettlementStore()
  const recordLoading = useRecordStore((s) => s.loading)
  const seasonLoading = useSeasonStore((s) => s.loading)
  const loading = recordLoading || seasonLoading

  const [shareData, setShareData] = useState<ShareCardData | null>(null)
  const [shareOpen, setShareOpen] = useState(false)
  const [hands, setHands] = useState<HandRecord[]>([])

  useEffect(() => {
    async function loadData() {
      setRecordLoading(true)
      setSeasonLoading(true)
      try {
        const [apiRecords, apiSeasons, apiSettlements, apiSessions, apiHands] = await Promise.all([
          apiGet<PokerRecord>("/api/poker-records"),
          apiGet<Season>("/api/seasons"),
          apiGet<PlayerSettlement>("/api/settlements"),
          apiGet<GameSession>("/api/sessions"),
          apiGet<HandRecord>("/api/hand-records"),
        ])
        if (apiRecords.length > 0) {
          loadRecords(apiRecords)
          loadSeasons(apiSeasons.length > 0 ? apiSeasons : SEED_SEASONS)
          loadSettlements(apiSettlements.length > 0 ? apiSettlements : SEED_SETTLEMENTS)
          loadSessions(apiSessions)
          setHands(apiHands)
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
        loadSessions(apiSessions)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    function handleShareEvent(e: Event) {
      const detail = (e as CustomEvent).detail as { seasonName?: string; date: string; entries: Array<{ player: string; score: string | number }> } | undefined
      if (detail) {
        setShareData({
          seasonName: detail.seasonName || activeSeason?.name,
          date: detail.date,
          records: detail.entries.map((entry) => ({ player: entry.player, score: Number(entry.score) })),
        })
        setShareOpen(true)
      }
    }
    window.addEventListener("poker:share", handleShareEvent)
    return () => window.removeEventListener("poker:share", handleShareEvent)
  }, [activeSeason])

  const tab = activeTab as TabKey
  const currentSeason = seasonFilter === "all" ? null : seasons.find((s: Season) => s.id === seasonFilter) ?? null
  const filteredRecords = currentSeason ? getRecordsForSeason(allRecords as PokerRecord[], currentSeason) : allRecords as PokerRecord[]
  const filteredSettlements = useMemo(() => currentSeason ? getSettlementsForSeason(settlements as PlayerSettlement[], currentSeason.id) : settlements as PlayerSettlement[], [currentSeason, settlements])
  const stats = useStats(filteredRecords)

  if (loading) {
    return (
      <div className="min-h-screen bg-background px-4 sm:px-6 pt-4 pb-6 max-w-[1200px] mx-auto">
        {tab === "home" && <HomeSkeleton />}
        {tab === "record" && <RecordSkeleton />}
        {tab === "ranking" && <RankingSkeleton />}
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20 bg-background relative">
      <header className="sticky top-0 z-40 px-4 sm:px-6 py-3 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="flex justify-between items-center max-w-[1200px] mx-auto">
          <div className="flex items-baseline gap-2 sm:gap-3">
            <span className="text-xs sm:text-sm tracking-wider text-muted-foreground/60 font-medium uppercase">{APP_SLOGAN}</span>
            <h1 className="text-lg sm:text-xl font-bold font-display text-foreground">{APP_NAME}</h1>
          </div>
          <div className="flex gap-3 items-center">
            <span className="text-xs text-muted-foreground/70 font-mono">{stats.totalGames} 场</span>
            <span className="text-xs text-muted-foreground/70 font-mono">{stats.players.length} 人</span>
          </div>
        </div>
      </header>

      <div className="sticky top-[52px] z-30 px-4 sm:px-6 py-2 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="flex items-center gap-1.5 max-w-[1200px] mx-auto overflow-x-auto scrollbar-hide">
          <button onClick={() => setSeasonFilter("all")} className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 ${seasonFilter === "all" ? "bg-primary/15 text-primary ring-1 ring-primary/30" : "text-muted-foreground/70 hover:bg-primary/10 hover:text-primary/80"}`}>全部</button>
          {seasons.map((s: Season, i: number) => (<button key={s.id || `season-${i}`} onClick={() => setSeasonFilter(s.id)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 ${seasonFilter === s.id ? "bg-primary/15 text-primary ring-1 ring-primary/30" : s.active ? "text-emerald-400/80 hover:bg-emerald-500/10" : "text-muted-foreground/70 hover:bg-primary/10 hover:text-primary/80"}`}>{s.name}{s.active && <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse align-middle" />}</button>))}
        </div>
      </div>

      <main className="px-4 sm:px-6 pt-4 pb-6 max-w-[1200px] mx-auto tab-content relative z-10">
        <TabErrorBoundary>
          {tab === "home" && (
            <HomeTabContent
              currentSeason={currentSeason}
              stats={stats}
              filteredRecords={filteredRecords}
              filteredSettlements={filteredSettlements}
              setActiveTab={setActiveTab}
              setSelectedPlayer={setSelectedPlayer}
            />
          )}
        </TabErrorBoundary>
        <TabErrorBoundary>
          {tab === "record" && (
            <div className="space-y-5">
              <SessionList
                sessions={sessions}
                records={filteredRecords}
                seasonName={currentSeason?.name}
                onSessionClick={(session) => {
                  setCurrentSessionId(session.id)
                  setActiveTab("hand")
                }}
              />
            </div>
          )}
        </TabErrorBoundary>
        <TabErrorBoundary>
          {tab === "ranking" && (
            <div className="space-y-5">
              <RankingPage stats={stats} settlements={filteredSettlements} records={filteredRecords} allRecords={allRecords as PokerRecord[]} seasons={seasons as Season[]} sessions={sessions} currentSeason={currentSeason} onPlayerClick={(name) => { setSelectedPlayer(name) }} />
            </div>
          )}
        </TabErrorBoundary>
        <TabErrorBoundary>
          {(tab as string) === "hand" && (
            <div className="space-y-5">
              <HandBrowser
                hands={currentSessionId ? hands.filter((h) => h.sessionId === currentSessionId) : hands}
                sessionOptions={sessions.map((s) => ({ id: s.id, date: s.date }))}
                onHandClick={(hand) => {
                  setCurrentSessionId(hand.sessionId ?? null)
                }}
              />
              <div className="text-center">
                <button
                  onClick={() => { setActiveTab("record"); setCurrentSessionId(null) }}
                  className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors underline underline-offset-2"
                >
                  ← 返回场次列表
                </button>
              </div>
            </div>
          )}
        </TabErrorBoundary>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-xl border-t border-border/40 flex justify-around py-1.5 px-2 z-50 safe-area-bottom">
        {TABS.map((t) => {
          const Icon = t.icon
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-300 ease-out group ${
                tab === t.key
                  ? "text-primary scale-105"
                  : "text-muted-foreground/70 hover:text-primary/70 active:scale-95"
              }`}
            >
              {tab === t.key && (
                <span className="absolute inset-0 -z-10 bg-primary/8 rounded-xl blur-sm" />
              )}
              <Icon className={`size-[18px] transition-transform duration-300 ${tab === t.key ? "scale-110 -translate-y-0.5" : "group-hover:scale-105"}`} strokeWidth={tab === t.key ? 2.5 : 2} />
              <span className={`text-[10px] font-medium transition-all duration-300 ${tab === t.key ? "font-semibold" : ""}`}>{t.label}</span>
            </button>
          )
        })}
        <Link
          href="/coach"
          className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-300 ease-out group text-muted-foreground/70 hover:text-primary/70 active:scale-95"
        >
          <GraduationCap className="size-[18px] transition-transform duration-300 group-hover:scale-105" strokeWidth={2} />
          <span className="text-[10px] font-medium">教练</span>
        </Link>
        <Link
          href="/import-status"
          className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-300 ease-out group text-muted-foreground/70 hover:text-primary/70 active:scale-95"
        >
          <Upload className="size-[18px] transition-transform duration-300 group-hover:scale-105" strokeWidth={2} />
          <span className="text-[10px] font-medium">导入</span>
        </Link>
        <Link
          href="/season-report"
          className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-300 ease-out group text-muted-foreground/70 hover:text-primary/70 active:scale-95"
        >
          <FileBarChart className="size-[18px] transition-transform duration-300 group-hover:scale-105" strokeWidth={2} />
          <span className="text-[10px] font-medium">赛季报告</span>
        </Link>
      </nav>
      <ShareButton data={shareData} open={shareOpen} onOpenChange={setShareOpen} />
    </div>
  )
}
