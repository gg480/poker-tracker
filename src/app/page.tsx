"use client";

import { useState, useEffect, useCallback } from "react";
import type { PokerRecord } from "@/lib/data";
import { loadRecords, saveRecords as persistRecords, SEED_RECORDS } from "@/lib/data";
import { useStats } from "@/lib/stats";
import { Dashboard } from "@/components/poker/dashboard";
import { RecordEntry } from "@/components/poker/record-entry";
import { PlayerView } from "@/components/poker/player-view";
import { AIAnalysis } from "@/components/poker/ai-analysis";
import { Badge } from "@/components/ui/badge";

const TABS = [
  { key: "overview", label: "总览", icon: "📊" },
  { key: "entry", label: "录入", icon: "✏️" },
  { key: "player", label: "玩家", icon: "👤" },
  { key: "ai", label: "AI分析", icon: "🤖" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function PokerTracker() {
  const [records, setRecords] = useState<PokerRecord[]>([]);
  const [tab, setTab] = useState<TabKey>("overview");
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);

  // Load data from localStorage on mount
  useEffect(() => {
    const stored = loadRecords();
    if (stored.length > 0) {
      setRecords(stored);
    } else {
      setRecords(SEED_RECORDS);
      persistRecords(SEED_RECORDS);
    }
    setLoading(false);
  }, []);

  const saveRecords = useCallback((newRecords: PokerRecord[]) => {
    setRecords(newRecords);
    persistRecords(newRecords);
  }, []);

  const stats = useStats(records);

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
          <Badge variant="secondary" className="text-[10px] bg-primary/20 text-primary font-semibold">
            赛季2
          </Badge>
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
            onPlayerClick={(name) => {
              setSelectedPlayer(name);
              setTab("player");
            }}
          />
        )}
        {tab === "entry" && (
          <RecordEntry records={records} stats={stats} onSave={saveRecords} />
        )}
        {tab === "player" && (
          <PlayerView
            stats={stats}
            records={records}
            selected={selectedPlayer}
            onSelect={setSelectedPlayer}
          />
        )}
        {tab === "ai" && (
          <AIAnalysis stats={stats} />
        )}
      </main>
    </div>
  );
}
