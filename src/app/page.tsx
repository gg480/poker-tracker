"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { PokerRecord, Season, ClearRecord } from "@/lib/data";
import {
  loadRecords, saveRecords as persistRecords,
  loadSeasons, saveSeasons as persistSeasons,
  loadClears, saveClears as persistClears,
  SEED_RECORDS, SEED_SEASONS,
  getActiveSeason, getRecordsForSeason, getClearsForSeason,
} from "@/lib/data";
import { useStats, computeStats, computeAwards } from "@/lib/stats";
import { Dashboard } from "@/components/poker/dashboard";
import { RecordEntry } from "@/components/poker/record-entry";
import { PlayerView } from "@/components/poker/player-view";
import { AIAnalysis } from "@/components/poker/ai-analysis";
import { Awards } from "@/components/poker/awards";
import { SeasonManager } from "@/components/poker/season-manager";

const TABS = [
  { key: "overview", label: "总览", icon: "📊" },
  { key: "entry", label: "录入", icon: "✏️" },
  { key: "awards", label: "奖项", icon: "🏆" },
  { key: "player", label: "玩家", icon: "👤" },
  { key: "season", label: "赛季", icon: "🏟️" },
  { key: "ai", label: "AI分析", icon: "🤖" },
] as const;

type TabKey = (typeof TABS)[number]["key"];
// Season filter: "all" = show everything, or a specific season id
type SeasonFilter = string; // "all" | season.id

export default function PokerTracker() {
  const [allRecords, setAllRecords] = useState<PokerRecord[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [clears, setClears] = useState<ClearRecord[]>([]);
  const [tab, setTab] = useState<TabKey>("overview");
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [seasonFilter, setSeasonFilter] = useState<SeasonFilter>("all");

  // Load data from Supabase/localStorage on mount
  useEffect(() => {
    async function loadData() {
      const [stored, storedSeasons, storedClears] = await Promise.all([
        loadRecords(),
        loadSeasons(),
        loadClears(),
      ]);
      
      if (stored.length > 0) {
        setAllRecords(stored);
      } else {
        setAllRecords(SEED_RECORDS);
        persistRecords(SEED_RECORDS);
      }

      if (storedSeasons.length > 0) {
        setSeasons(storedSeasons);
      } else {
        setSeasons(SEED_SEASONS);
        persistSeasons(SEED_SEASONS);
      }

      setClears(storedClears);
      setLoading(false);
    }
    loadData();
  }, []);

  // Get active season for operations that need it (clearing, ending season)
  const activeSeason = getActiveSeason(seasons);

  // Resolve current filter to a Season object or null (= all)
  const currentSeason = seasonFilter === "all"
    ? null
    : seasons.find(s => s.id === seasonFilter) ?? null;

  // Filtered records based on season selection
  const filteredRecords = currentSeason
    ? getRecordsForSeason(allRecords, currentSeason)
    : allRecords;

  // Filtered clears based on season selection
  const filteredClears = useMemo(() =>
    currentSeason
      ? getClearsForSeason(clears, currentSeason.id)
      : [],
    [currentSeason, clears]);

  const stats = useStats(filteredRecords);
  const awards = computeAwards(stats, filteredClears);

  // Save handlers
  const saveRecords = useCallback((newRecords: PokerRecord[]) => {
    setAllRecords(newRecords);
    persistRecords(newRecords);
  }, []);

  const saveSeasons = useCallback((newSeasons: Season[]) => {
    setSeasons(newSeasons);
    persistSeasons(newSeasons);
  }, []);

  const saveClears = useCallback((newClears: ClearRecord[]) => {
    setClears(newClears);
    persistClears(newClears);
  }, []);

  // Clear a specific player's score
  const handleClearPlayer = useCallback((player: string, amount: number) => {
    if (!activeSeason) return;
    const newClear: ClearRecord = {
      id: `clear-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      player,
      amount,
      seasonId: activeSeason.id,
      type: 'threshold',
    };
    saveClears([...clears, newClear]);
  }, [activeSeason, clears, saveClears]);

  // End season: clear all positive-balance players, close season
  const handleEndSeason = useCallback(() => {
    if (!activeSeason) return;

    // Generate season-end clear records for all positive balance players
    const seasonClearsNow = getClearsForSeason(clears, activeSeason.id);
    const seasonStats = computeStats(getRecordsForSeason(allRecords, activeSeason));
    const newClears: ClearRecord[] = [];
    for (const p of seasonStats.players) {
      if (p.total > 0) {
        const alreadyCleared = seasonClearsNow
          .filter(c => c.player === p.name)
          .reduce((s, c) => s + c.amount, 0);
        const remaining = p.total - alreadyCleared;
        if (remaining > 0) {
          newClears.push({
            id: `clear-${Date.now()}-${p.name}`,
            date: new Date().toISOString().slice(0, 10),
            player: p.name,
            amount: remaining,
            seasonId: activeSeason.id,
            type: 'season_end',
          });
        }
      }
    }

    // Close the season
    const updatedSeasons = seasons.map(s =>
      s.id === activeSeason.id
        ? { ...s, active: false, endDate: new Date().toISOString().slice(0, 10) }
        : s
    );

    saveClears([...clears, ...newClears]);
    saveSeasons(updatedSeasons);
  }, [activeSeason, allRecords, clears, seasons, saveClears, saveSeasons]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-primary text-lg">
        加载中...
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-10">
      {/* Header */}
      <header className="flex justify-between items-center px-5 py-4 border-b border-border bg-gradient-to-b from-[#111827] to-[#0a0e1a]">
        <div className="flex items-center gap-3">
          <span className="text-xl tracking-wider">♠♥♦♣</span>
          <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-amber-500 bg-clip-text text-transparent">
            德扑积分榜
          </h1>
        </div>
        <div className="flex gap-3">
          <span className="text-xs text-muted-foreground font-mono">{stats.totalGames} 场</span>
          <span className="text-xs text-muted-foreground font-mono">{stats.players.length} 人</span>
        </div>
      </header>

      {/* Season Filter Tabs */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-border overflow-x-auto">
        <button
          onClick={() => setSeasonFilter("all")}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
            seasonFilter === "all"
              ? "bg-amber-500/20 text-amber-400"
              : "text-muted-foreground hover:bg-primary/10 hover:text-primary/80"
          }`}
        >
          全部
        </button>
        {seasons.map(s => (
          <button
            key={s.id}
            onClick={() => setSeasonFilter(s.id)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
              seasonFilter === s.id
                ? "bg-amber-500/20 text-amber-400"
                : s.active
                  ? "text-green-400 hover:bg-green-500/10"
                  : "text-muted-foreground hover:bg-primary/10 hover:text-primary/80"
            }`}
          >
            {s.name}
            {s.active && <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-green-400 align-middle" />}
          </button>
        ))}
      </div>

      {/* Navigation */}
      <nav className="flex gap-1 px-4 py-2 border-b border-border overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${
              tab === t.key
                ? "bg-primary/20 text-primary"
                : "text-muted-foreground hover:bg-primary/10 hover:text-primary/80"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </nav>

      {/* Main Content */}
      <main className="px-4 pt-4 max-w-[1200px] mx-auto">
        {tab === "overview" && (
          <Dashboard
            stats={stats}
            clears={filteredClears}
            onPlayerClick={(name) => {
              setSelectedPlayer(name);
              setTab("player");
            }}
          />
        )}
        {tab === "entry" && (
          <RecordEntry records={allRecords} stats={stats} onSave={saveRecords} />
        )}
        {tab === "awards" && (
          <Awards awards={awards} />
        )}
        {tab === "player" && (
          <PlayerView
            stats={stats}
            records={filteredRecords}
            selected={selectedPlayer}
            onSelect={setSelectedPlayer}
          />
        )}
        {tab === "season" && activeSeason && (
          <SeasonManager
            season={activeSeason}
            stats={stats}
            clears={filteredClears}
            onClearPlayer={handleClearPlayer}
            onEndSeason={handleEndSeason}
          />
        )}
        {tab === "ai" && (
          <AIAnalysis stats={stats} />
        )}
      </main>
    </div>
  );
}
