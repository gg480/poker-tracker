"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { PokerRecord, Season, PlayerSettlement } from "@/lib/data";
import {
  loadRecords, saveRecords as persistRecords,
  loadSeasons, saveSeasons as persistSeasons,
  loadSettlements, saveSettlement as persistSettlement,
  SEED_RECORDS, SEED_SEASONS, SEED_SETTLEMENTS,
  getActiveSeason, getRecordsForSeason, getSettlementsForSeason,
  getSettlementForPlayer, calcBalance,
} from "@/lib/data";
import { useStats, computeStats, computeAwards } from "@/lib/stats";
import { Dashboard } from "@/components/poker/dashboard";
import { RecordEntry } from "@/components/poker/record-entry";
import { PlayerView } from "@/components/poker/player-view";
import { AIAnalysis } from "@/components/poker/ai-analysis";
import { Awards } from "@/components/poker/awards";
import { SeasonManager } from "@/components/poker/season-manager";
import { Card, CardContent } from "@/components/ui/card";

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
  const [settlements, setSettlements] = useState<PlayerSettlement[]>([]);
  const [tab, setTab] = useState<TabKey>("overview");
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [seasonFilter, setSeasonFilter] = useState<SeasonFilter>("all");

  // Load data from Supabase/localStorage on mount
  useEffect(() => {
    async function loadData() {
      const [stored, storedSeasons, storedSettlements] = await Promise.all([
        loadRecords(),
        loadSeasons(),
        loadSettlements(),
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

      if (storedSettlements.length > 0) {
        setSettlements(storedSettlements);
      } else {
        setSettlements(SEED_SETTLEMENTS);
        // Persist each settlement individually
        for (const s of SEED_SETTLEMENTS) {
          persistSettlement(s);
        }
      }
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

  // Filtered settlements based on season selection
  // "all" = include all settlements (for merged balance view)
  // specific season = only that season's settlements
  const filteredSettlements = useMemo(() =>
    currentSeason
      ? getSettlementsForSeason(settlements, currentSeason.id)
      : settlements,
    [currentSeason, settlements]);

  const stats = useStats(filteredRecords);
  const awards = computeAwards(stats, filteredSettlements);

  // Save handlers
  const saveRecords = useCallback((newRecords: PokerRecord[]) => {
    setAllRecords(newRecords);
    persistRecords(newRecords);
  }, []);

  const saveSeasons = useCallback((newSeasons: Season[]) => {
    setSeasons(newSeasons);
    persistSeasons(newSeasons);
  }, []);

  const updateSettlement = useCallback((settlement: PlayerSettlement) => {
    setSettlements(prev => {
      const idx = prev.findIndex(s => s.player === settlement.player && s.seasonId === settlement.seasonId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = settlement;
        return next;
      }
      return [...prev, settlement];
    });
    persistSettlement(settlement);
  }, []);

  // 请吃饭清分：用户输入正数，增加 settleScore
  // balance = total - settleScore + seasonAdjust
  const handleSettlePlayer = useCallback((player: string, amount: number) => {
    if (!activeSeason) return;
    const existing = getSettlementForPlayer(settlements, player, activeSeason.id);
    const settlement: PlayerSettlement = {
      player,
      seasonId: activeSeason.id,
      settleScore: (existing?.settleScore ?? 0) + Math.abs(amount), // 请吃饭清分累加
      seasonAdjust: existing?.seasonAdjust ?? 0,
    };
    updateSettlement(settlement);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSeason, settlements]);

  // End season: 全员清分，season_adjust += -balance
  const handleEndSeason = useCallback(() => {
    if (!activeSeason) return;

    const seasonStats = computeStats(getRecordsForSeason(allRecords, activeSeason));
    const seasonSettlements = getSettlementsForSeason(settlements, activeSeason.id);
    
    // For each player, update season_adjust
    const updatedSettlements = [...settlements];
    for (const p of seasonStats.players) {
      const existing = getSettlementForPlayer(seasonSettlements, p.name, activeSeason.id);
      const settleScore = existing?.settleScore ?? 0;
      const currentSeasonAdjust = existing?.seasonAdjust ?? 0;
      const balance = calcBalance(p.total, { player: p.name, seasonId: activeSeason.id, settleScore, seasonAdjust: currentSeasonAdjust });
      
      if (balance !== 0) {
        const newSettlement: PlayerSettlement = {
          player: p.name,
          seasonId: activeSeason.id,
          settleScore,
          seasonAdjust: currentSeasonAdjust + (-balance), // season_adjust += -balance → balance归零
        };
        
        const idx = updatedSettlements.findIndex(s => s.player === p.name && s.seasonId === activeSeason.id);
        if (idx >= 0) {
          updatedSettlements[idx] = newSettlement;
        } else {
          updatedSettlements.push(newSettlement);
        }
        persistSettlement(newSettlement);
      }
    }

    setSettlements(updatedSettlements);

    // Close the season
    const updatedSeasons = seasons.map(s =>
      s.id === activeSeason.id
        ? { ...s, active: false, endDate: new Date().toISOString().slice(0, 10) }
        : s
    );
    saveSeasons(updatedSeasons);
  }, [activeSeason, allRecords, settlements, seasons, saveSeasons]);

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
            settlements={filteredSettlements}
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
        {tab === "season" && currentSeason && (
          <SeasonManager
            season={currentSeason}
            stats={stats}
            settlements={filteredSettlements}
            onSettlePlayer={handleSettlePlayer}
            onEndSeason={handleEndSeason}
          />
        )}
        {tab === "season" && !currentSeason && (
          <Card className="border-border/50 bg-card/80 backdrop-blur">
            <CardContent className="py-10 text-center text-muted-foreground">
              <p className="text-sm">请在上方选择一个赛季查看详情</p>
              <p className="text-xs mt-1">当前为全部数据视图，赛季管理需选择具体赛季</p>
            </CardContent>
          </Card>
        )}
        {tab === "ai" && (
          <AIAnalysis stats={stats} />
        )}
      </main>
    </div>
  );
}
