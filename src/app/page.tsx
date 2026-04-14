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
import { useStats, computeAwards } from "@/lib/stats";
import { Dashboard } from "@/components/poker/dashboard";
import { RecordEntry } from "@/components/poker/record-entry";
import { PlayerView } from "@/components/poker/player-view";
import { AIAnalysis } from "@/components/poker/ai-analysis";
import { Awards } from "@/components/poker/awards";
import { SeasonManager } from "@/components/poker/season-manager";
import { Badge } from "@/components/ui/badge";

const TABS = [
  { key: "overview", label: "总览", icon: "📊" },
  { key: "entry", label: "录入", icon: "✏️" },
  { key: "awards", label: "奖项", icon: "🏆" },
  { key: "player", label: "玩家", icon: "👤" },
  { key: "season", label: "赛季", icon: "🏟️" },
  { key: "ai", label: "AI分析", icon: "🤖" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function PokerTracker() {
  const [allRecords, setAllRecords] = useState<PokerRecord[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [clears, setClears] = useState<ClearRecord[]>([]);
  const [tab, setTab] = useState<TabKey>("overview");
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);

  // Load data from localStorage on mount
  useEffect(() => {
    const stored = loadRecords();
    if (stored.length > 0) {
      setAllRecords(stored);
    } else {
      setAllRecords(SEED_RECORDS);
      persistRecords(SEED_RECORDS);
    }

    const storedSeasons = loadSeasons();
    if (storedSeasons.length > 0) {
      setSeasons(storedSeasons);
    } else {
      setSeasons(SEED_SEASONS);
      persistSeasons(SEED_SEASONS);
    }

    setClears(loadClears());
    setLoading(false);
  }, []);

  // Get active season and filtered data
  const activeSeason = getActiveSeason(seasons);
  const seasonRecords = activeSeason
    ? getRecordsForSeason(allRecords, activeSeason)
    : allRecords;
  const seasonClears = useMemo(() => activeSeason
    ? getClearsForSeason(clears, activeSeason.id)
    : [], [activeSeason, clears]);

  const stats = useStats(seasonRecords);
  const awards = computeAwards(stats, seasonClears);

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
    const newClears: ClearRecord[] = [];
    for (const p of stats.players) {
      if (p.total > 0) {
        const alreadyCleared = seasonClears
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
  }, [activeSeason, stats, seasonClears, clears, seasons, saveClears, saveSeasons]);

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
          {activeSeason && (
            <Badge variant="secondary" className="text-[10px] bg-primary/20 text-primary font-semibold">
              {activeSeason.name}
            </Badge>
          )}
        </div>
        <div className="flex gap-3">
          <span className="text-xs text-muted-foreground font-mono">{stats.totalGames} 场</span>
          <span className="text-xs text-muted-foreground font-mono">{stats.players.length} 人</span>
        </div>
      </header>

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
            clears={seasonClears}
            onPlayerClick={(name) => {
              setSelectedPlayer(name);
              setTab("player");
            }}
          />
        )}
        {tab === "entry" && (
          <RecordEntry records={seasonRecords} stats={stats} onSave={saveRecords} />
        )}
        {tab === "awards" && (
          <Awards awards={awards} />
        )}
        {tab === "player" && (
          <PlayerView
            stats={stats}
            records={seasonRecords}
            selected={selectedPlayer}
            onSelect={setSelectedPlayer}
          />
        )}
        {tab === "season" && activeSeason && (
          <SeasonManager
            season={activeSeason}
            stats={stats}
            clears={seasonClears}
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
