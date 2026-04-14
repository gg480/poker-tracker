import { useMemo } from "react";
import type { PokerRecord, ComputedStats, PlayerStats, CumulativePoint, TrendPoint, DailyBest } from "./data";

export function computeStats(records: PokerRecord[]): ComputedStats {
  const playerMap: Record<string, {
    name: string; total: number; wins: number; losses: number;
    games: number; maxWin: number; maxLoss: number; scores: number[];
    dates: Set<string>;
  }> = {};

  const dateMap: Record<string, PokerRecord[]> = {};

  for (const r of records) {
    if (!playerMap[r.player]) {
      playerMap[r.player] = {
        name: r.player, total: 0, wins: 0, losses: 0,
        games: 0, maxWin: 0, maxLoss: 0, scores: [], dates: new Set(),
      };
    }
    const p = playerMap[r.player];
    p.total += r.score;
    p.games++;
    if (r.score > 0) p.wins++;
    else if (r.score < 0) p.losses++;
    p.maxWin = Math.max(p.maxWin, r.score);
    p.maxLoss = Math.min(p.maxLoss, r.score);
    p.scores.push(r.score);
    p.dates.add(r.date);

    if (!dateMap[r.date]) dateMap[r.date] = [];
    dateMap[r.date].push(r);
  }

  const players: PlayerStats[] = Object.values(playerMap).map(p => ({
    ...p,
    winRate: p.games > 0 ? (p.wins / p.games * 100).toFixed(1) : "0",
    avgScore: p.games > 0 ? Math.round(p.total / p.games) : 0,
    sessionCount: p.dates.size,
  }));

  // Daily best records
  const dailyBests: Record<string, DailyBest> = {};
  for (const [date, recs] of Object.entries(dateMap)) {
    for (const r of recs) {
      if (!dailyBests[r.player] || r.score > dailyBests[r.player].score) {
        dailyBests[r.player] = { score: r.score, date };
      }
    }
  }

  // Cumulative by date
  const dates = [...new Set(records.map(r => r.date))].sort();
  const cumulative: Record<string, CumulativePoint[]> = {};

  for (const d of dates) {
    const dayRecs = dateMap[d];
    for (const r of dayRecs) {
      if (!cumulative[r.player]) cumulative[r.player] = [];
      const prev = cumulative[r.player].length > 0
        ? cumulative[r.player][cumulative[r.player].length - 1].cum
        : 0;
      cumulative[r.player].push({ date: d, cum: prev + r.score });
    }
  }

  // Build trend data
  const trendData: TrendPoint[] = dates.map(d => {
    const point: TrendPoint = { date: d.slice(5) };
    for (const pName of Object.keys(cumulative)) {
      const entries = cumulative[pName].filter(e => e.date <= d);
      if (entries.length > 0) {
        (point as Record<string, string | number>)[pName] = entries[entries.length - 1].cum;
      }
    }
    return point;
  });

  return {
    players: players.sort((a, b) => b.total - a.total),
    totalGames: Object.keys(dateMap).length,
    totalRecords: records.length,
    dates,
    dateMap,
    dailyBests,
    trendData,
    cumulative,
  };
}

export function useStats(records: PokerRecord[]): ComputedStats {
  return useMemo(() => computeStats(records), [records]);
}

// Chart color palette
export const CHART_COLORS = [
  '#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16',
  '#e11d48', '#a855f7', '#0ea5e9',
];
