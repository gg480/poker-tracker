import { useMemo } from "react";
import type { PokerRecord, ComputedStats, PlayerStats, CumulativePoint, TrendPoint, DailyBest, ClearRecord } from "./data";

export function computeStats(records: PokerRecord[]): ComputedStats {
  const playerMap: Record<string, {
    name: string; total: number; wins: number; losses: number;
    games: number; maxWin: number; maxLoss: number; scores: number[];
    dates: Set<string>; dateRecords: Map<string, number>;
  }> = {};

  const dateMap: Record<string, PokerRecord[]> = {};

  for (const r of records) {
    if (!playerMap[r.player]) {
      playerMap[r.player] = {
        name: r.player, total: 0, wins: 0, losses: 0,
        games: 0, maxWin: 0, maxLoss: 0, scores: [], dates: new Set(),
        dateRecords: new Map(),
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
    // Track per-date score for streak calculation
    p.dateRecords.set(r.date, (p.dateRecords.get(r.date) || 0) + r.score);

    if (!dateMap[r.date]) dateMap[r.date] = [];
    dateMap[r.date].push(r);
  }

  const players: PlayerStats[] = Object.values(playerMap).map(p => {
    // Calculate longest winning streak (consecutive dates where total score > 0)
    const sortedDates = [...p.dates].sort();
    let longestStreak = 0;
    let currentStreak = 0;
    for (const d of sortedDates) {
      if ((p.dateRecords.get(d) || 0) > 0) {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }

    return {
      ...p,
      winRate: p.games > 0 ? (p.wins / p.games * 100).toFixed(1) : "0",
      avgScore: p.games > 0 ? Math.round(p.total / p.games) : 0,
      sessionCount: p.dates.size,
      longestWinStreak: longestStreak,
    };
  });

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

// ==================== AWARDS ====================
export interface Award {
  key: string;
  title: string;
  icon: string;
  description: string;
  winner: string;
  value: string;
}

export function computeAwards(stats: ComputedStats, clears: ClearRecord[]): Award[] {
  const eligible = stats.players.filter(p => p.games >= 1);
  if (eligible.length === 0) return [];

  // 1. 🏆 赛季MVP - 最高累计积分
  const mvp = [...eligible].sort((a, b) => b.total - a.total)[0];

  // 2. 💰 日进斗金 - 单日最高得分
  const dailyBest = [...eligible].sort((a, b) => b.maxWin - a.maxWin)[0];

  // 3. 📈 常胜将军 - 最高胜率(≥5场)
  const winRateEligible = eligible.filter(p => p.games >= 5);
  const general = winRateEligible.length > 0
    ? [...winRateEligible].sort((a, b) => Number(b.winRate) - Number(a.winRate))[0]
    : eligible[0];

  // 4. 🔥 势如破竹 - 最长连胜
  const streak = [...eligible].sort((a, b) => b.longestWinStreak - a.longestWinStreak)[0];

  // 5. 💎 场均之王 - 场均最高(≥5场)
  const avgKing = winRateEligible.length > 0
    ? [...winRateEligible].sort((a, b) => b.avgScore - a.avgScore)[0]
    : eligible[0];

  // 6. 🎯 铁人奖 - 出勤最多(参与局数)
  const ironman = [...eligible].sort((a, b) => b.sessionCount - a.sessionCount)[0];

  // 7. 🎲 大起大落 - 波动最大(标准差)
  const volatile = [...eligible].sort((a, b) => {
    const stdA = standardDeviation(a.scores);
    const stdB = standardDeviation(b.scores);
    return stdB - stdA;
  })[0];

  // 8. 🤝 散财童子 - 清分次数最多
  const clearCounts: Record<string, number> = {};
  for (const c of clears) {
    clearCounts[c.player] = (clearCounts[c.player] || 0) + 1;
  }
  const benefactor = Object.keys(clearCounts).length > 0
    ? Object.entries(clearCounts).sort((a, b) => b[1] - a[1])[0][0]
    : '暂无';

  return [
    {
      key: 'mvp',
      title: '赛季MVP',
      icon: '🏆',
      description: '最高累计积分',
      winner: mvp.name,
      value: `${mvp.total > 0 ? '+' : ''}${mvp.total.toLocaleString()}`,
    },
    {
      key: 'dailyBest',
      title: '日进斗金',
      icon: '💰',
      description: '单日最高得分',
      winner: dailyBest.name,
      value: `+${dailyBest.maxWin.toLocaleString()}`,
    },
    {
      key: 'general',
      title: '常胜将军',
      icon: '📈',
      description: '最高胜率(≥5场)',
      winner: general.name,
      value: `${general.winRate}%`,
    },
    {
      key: 'streak',
      title: '势如破竹',
      icon: '🔥',
      description: '最长连胜记录',
      winner: streak.name,
      value: `${streak.longestWinStreak}连`,
    },
    {
      key: 'avgKing',
      title: '场均之王',
      icon: '💎',
      description: '场均得分最高(≥5场)',
      winner: avgKing.name,
      value: `${avgKing.avgScore > 0 ? '+' : ''}${avgKing.avgScore.toLocaleString()}`,
    },
    {
      key: 'ironman',
      title: '铁人奖',
      icon: '🎯',
      description: '出勤场次最多',
      winner: ironman.name,
      value: `${ironman.sessionCount}场`,
    },
    {
      key: 'volatile',
      title: '大起大落',
      icon: '🎲',
      description: '波动最大(标准差)',
      winner: volatile.name,
      value: `σ=${Math.round(standardDeviation(volatile.scores)).toLocaleString()}`,
    },
    {
      key: 'benefactor',
      title: '散财童子',
      icon: '🤝',
      description: '清分次数最多',
      winner: benefactor,
      value: `${clearCounts[benefactor] || 0}次`,
    },
  ];
}

function standardDeviation(arr: number[]): number {
  if (arr.length === 0) return 0;
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const squareDiffs = arr.map(v => (v - mean) ** 2);
  return Math.sqrt(squareDiffs.reduce((a, b) => a + b, 0) / arr.length);
}
