// ==================== TYPES ====================
export interface PokerRecord {
  date: string;
  player: string;
  score: number;
  win: 1 | -1;
}

export interface Season {
  id: string;
  name: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD, undefined if active
  active: boolean;
}

export interface ClearRecord {
  id: string;
  date: string;
  player: string;
  amount: number;
  seasonId: string;
  type: 'threshold' | 'season_end';
}

export interface AICacheItem {
  label: string;
  prompt: string;
  result: string;
  time: string;
}

export interface PlayerStats {
  name: string;
  total: number;
  wins: number;
  losses: number;
  games: number;
  maxWin: number;
  maxLoss: number;
  scores: number[];
  sessionCount: number;
  winRate: string;
  avgScore: number;
  longestWinStreak: number;
}

export interface DailyBest {
  score: number;
  date: string;
}

export interface CumulativePoint {
  date: string;
  cum: number;
}

export interface TrendPoint {
  date: string;
  [playerName: string]: string | number;
}

export interface ComputedStats {
  players: PlayerStats[];
  totalGames: number;
  totalRecords: number;
  dates: string[];
  dateMap: Record<string, PokerRecord[]>;
  dailyBests: Record<string, DailyBest>;
  trendData: TrendPoint[];
  cumulative: Record<string, CumulativePoint[]>;
}

// ==================== STORAGE ====================
// 使用 Next.js API Routes 作为数据代理层
// Supabase 凭证仅在服务端可用，客户端通过 API Routes 访问

// Legacy localStorage Keys (降级备份)
const STORAGE_KEY = 'poker-tracker-records';
const SEASONS_KEY = 'poker-tracker-seasons';
const CLEARS_KEY = 'poker-tracker-clears';
const AI_CACHE_KEY = 'poker-tracker-ai-cache';

// ==================== API HELPER ====================
async function apiGet(path: string): Promise<unknown> {
  const res = await fetch(path);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'API error');
  return json.data;
}

async function apiPost(path: string, body: unknown): Promise<unknown> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'API error');
  return json.data;
}

async function apiPut(path: string, body: unknown): Promise<unknown> {
  const res = await fetch(path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'API error');
  return json.data;
}

async function apiDelete(path: string, body: unknown): Promise<unknown> {
  const res = await fetch(path, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'API error');
  return json.data;
}

// ==================== DATA LOADER ====================

export async function loadRecords(): Promise<PokerRecord[]> {
  if (typeof window === 'undefined') return [];
  try {
    const data = await apiGet('/api/poker-records') as Array<{ date: string; player: string; score: number; win: number }>;
    return data.map(r => ({
      date: r.date,
      player: r.player,
      score: r.score,
      win: r.win as 1 | -1,
    }));
  } catch (e) {
    console.warn("Failed to load from API, falling back to localStorage", e);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as PokerRecord[];
    } catch {
      // ignore parse errors
    }
  }
  return [];
}

export async function saveRecords(records: PokerRecord[]): Promise<void> {
  if (typeof window === 'undefined') return;
  // 保存到 localStorage 作为本地缓存
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  try {
    await apiPost('/api/poker-records', records.map(r => ({
      date: r.date,
      player: r.player,
      score: r.score,
      win: r.win,
    })));
  } catch (e) {
    console.error("Failed to save records to API", e);
  }
}

export async function loadSeasons(): Promise<Season[]> {
  if (typeof window === 'undefined') return [];
  try {
    const data = await apiGet('/api/seasons') as Array<{ id: string; name: string; start_date: string; end_date: string | null; active: boolean }>;
    return data.map(s => ({
      id: s.id,
      name: s.name,
      startDate: s.start_date,
      endDate: s.end_date || undefined,
      active: s.active,
    }));
  } catch (e) {
    console.warn("Failed to load seasons from API, falling back to localStorage", e);
    try {
      const raw = localStorage.getItem(SEASONS_KEY);
      if (raw) return JSON.parse(raw) as Season[];
    } catch {
      // ignore
    }
  }
  return [];
}

export async function saveSeasons(seasons: Season[]): Promise<void> {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SEASONS_KEY, JSON.stringify(seasons));
  try {
    for (const s of seasons) {
      await apiPost('/api/seasons', {
        name: s.name,
        start_date: s.startDate,
        end_date: s.endDate,
        active: s.active,
      });
    }
  } catch (e) {
    console.error("Failed to save seasons to API", e);
  }
}

export async function loadClears(): Promise<ClearRecord[]> {
  if (typeof window === 'undefined') return [];
  try {
    const data = await apiGet('/api/clear-records') as Array<{ id: string; date: string; player: string; amount: number; season_id: string; clear_type: string }>;
    return data.map(c => ({
      id: c.id,
      date: c.date,
      player: c.player,
      amount: c.amount,
      seasonId: c.season_id,
      type: c.clear_type as 'threshold' | 'season_end',
    }));
  } catch (e) {
    console.warn("Failed to load clears from API, falling back to localStorage", e);
    try {
      const raw = localStorage.getItem(CLEARS_KEY);
      if (raw) return JSON.parse(raw) as ClearRecord[];
    } catch {
      // ignore
    }
  }
  return SEED_CLEARS;
}

export async function saveClear(record: ClearRecord): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    await apiPost('/api/clear-records', {
      date: record.date,
      player: record.player,
      amount: record.amount,
      season_id: record.seasonId,
      clear_type: record.type,
    });
  } catch (e) {
    console.error("Failed to save clear to API", e);
  }
}

// Legacy sync function for backward compatibility
export function saveClears(clears: ClearRecord[]): void {
  localStorage.setItem(CLEARS_KEY, JSON.stringify(clears));
}

export async function loadAICache(): Promise<AICacheItem[]> {
  if (typeof window === 'undefined') return [];
  try {
    const data = await apiGet('/api/ai-cache') as Array<{ label: string; prompt: string; result: string; time: string }>;
    return data.map(c => ({
      label: c.label,
      prompt: c.prompt,
      result: c.result,
      time: c.time,
    }));
  } catch (e) {
    console.warn("Failed to load AI cache from API, falling back to localStorage", e);
    try {
      const raw = localStorage.getItem(AI_CACHE_KEY);
      if (raw) return JSON.parse(raw) as AICacheItem[];
    } catch {
      // ignore
    }
  }
  return [];
}

export async function saveAICacheItem(item: AICacheItem): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    await apiPost('/api/ai-cache', {
      label: item.label,
      prompt: item.prompt,
      result: item.result,
      time: item.time,
    });
  } catch (e) {
    console.error("Failed to save AI cache to API", e);
  }
  // 也更新 localStorage
  try {
    const raw = localStorage.getItem(AI_CACHE_KEY);
    const cache: AICacheItem[] = raw ? JSON.parse(raw) : [];
    const existingIndex = cache.findIndex(c => c.label === item.label);
    if (existingIndex >= 0) {
      cache[existingIndex] = item;
    } else {
      cache.push(item);
    }
    localStorage.setItem(AI_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // ignore
  }
}

export async function endSeason(seasonId: string): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    await apiPut('/api/seasons', { id: seasonId, active: false });
  } catch (e) {
    console.error("Failed to end season via API", e);
  }
}

// ==================== SEASON HELPERS ====================
export function getRecordsForSeason(records: PokerRecord[], season: Season): PokerRecord[] {
  return records.filter(r => {
    if (r.date < season.startDate) return false;
    if (season.endDate && r.date > season.endDate) return false;
    return true;
  });
}

export function getActiveSeason(seasons: Season[]): Season | undefined {
  return seasons.find(s => s.active);
}

export function getClearsForSeason(clears: ClearRecord[], seasonId: string): ClearRecord[] {
  return clears.filter(c => c.seasonId === seasonId);
}

export function getPlayerClearedAmount(clears: ClearRecord[], player: string): number {
  if (!clears) return 0;
  return clears.filter(c => c.player === player).reduce((sum, c) => sum + c.amount, 0);
}

export function getPostClearBalance(totalScore: number, clears: ClearRecord[], player: string): number {
  if (!clears) return totalScore;
  return totalScore - getPlayerClearedAmount(clears, player);
}

// ==================== SEED DATA ====================
export const SEED_SEASONS: Season[] = [
  { id: 's1', name: '赛季1', startDate: '2025-10-25', endDate: '2026-04-11', active: false },
  { id: 's2', name: '赛季2', startDate: '2026-04-12', active: true },
];

// 赛季1已结束，所有正余额玩家在赛季结束时全额清分
export const SEED_CLEARS: ClearRecord[] = [
  { id: 'clear-s1-佳', date: '2026-04-11', player: '佳', amount: 31190, seasonId: 's1', type: 'season_end' },
  { id: 'clear-s1-茄', date: '2026-04-11', player: '茄', amount: 16000, seasonId: 's1', type: 'season_end' },
  { id: 'clear-s1-锦辉', date: '2026-04-11', player: '锦辉', amount: 6120, seasonId: 's1', type: 'season_end' },
  { id: 'clear-s1-fafa', date: '2026-04-11', player: 'fafa', amount: 4960, seasonId: 's1', type: 'season_end' },
  { id: 'clear-s1-卢老师', date: '2026-04-11', player: '卢老师', amount: 2870, seasonId: 's1', type: 'season_end' },
  { id: 'clear-s1-润年老表', date: '2026-04-11', player: '润年老表', amount: 2220, seasonId: 's1', type: 'season_end' },
  { id: 'clear-s1-谦', date: '2026-04-11', player: '谦', amount: 1110, seasonId: 's1', type: 'season_end' },
];

export const SEED_RECORDS: PokerRecord[] = [
  {"date":"2025-10-26","player":"志","score":-2240,"win":-1},
  {"date":"2025-10-26","player":"茄","score":2700,"win":1},
  {"date":"2025-10-26","player":"润","score":230,"win":1},
  {"date":"2025-10-26","player":"谦","score":-1220,"win":-1},
  {"date":"2025-10-26","player":"楠","score":530,"win":1},
  {"date":"2025-10-25","player":"谦","score":1540,"win":1},
  {"date":"2025-10-25","player":"茄","score":250,"win":1},
  {"date":"2025-10-25","player":"润","score":-1790,"win":-1},
  {"date":"2025-11-01","player":"润","score":-100,"win":-1},
  {"date":"2025-11-01","player":"茄","score":-2000,"win":-1},
  {"date":"2025-11-01","player":"杰仔","score":2000,"win":1},
  {"date":"2025-11-01","player":"锦辉","score":400,"win":1},
  {"date":"2025-11-01","player":"卢老师","score":4300,"win":1},
  {"date":"2025-11-01","player":"楠","score":-3700,"win":-1},
  {"date":"2025-11-01","player":"谦","score":-900,"win":-1},
  {"date":"2025-11-07","player":"卢老师","score":3800,"win":1},
  {"date":"2025-11-07","player":"茄","score":-1670,"win":-1},
  {"date":"2025-11-07","player":"佳","score":1470,"win":1},
  {"date":"2025-11-07","player":"锦辉","score":1360,"win":1},
  {"date":"2025-11-07","player":"杰仔","score":-1440,"win":-1},
  {"date":"2025-11-07","player":"谦","score":-1820,"win":-1},
  {"date":"2025-11-07","player":"达","score":-1760,"win":-1},
  {"date":"2025-11-07","player":"志","score":60,"win":1},
  {"date":"2025-11-09","player":"润","score":-2000,"win":-1},
  {"date":"2025-11-09","player":"柱","score":-2000,"win":-1},
  {"date":"2025-11-09","player":"杰仔","score":1450,"win":1},
  {"date":"2025-11-09","player":"楠","score":-4600,"win":-1},
  {"date":"2025-11-09","player":"佳","score":2100,"win":1},
  {"date":"2025-11-09","player":"志","score":-3000,"win":-1},
  {"date":"2025-11-09","player":"卢老师","score":-2000,"win":-1},
  {"date":"2025-11-09","player":"茄","score":10050,"win":1},
  {"date":"2025-11-14","player":"谦","score":570,"win":1},
  {"date":"2025-11-14","player":"卢老师","score":-2000,"win":-1},
  {"date":"2025-11-14","player":"润","score":1600,"win":1},
  {"date":"2025-11-14","player":"茄","score":-1390,"win":-1},
  {"date":"2025-11-14","player":"杰仔","score":330,"win":1},
  {"date":"2025-11-14","player":"佳","score":890,"win":1},
  {"date":"2025-11-18","player":"润","score":-2870,"win":-1},
  {"date":"2025-11-18","player":"茄","score":0,"win":-1},
  {"date":"2025-11-18","player":"卢老师","score":1050,"win":1},
  {"date":"2025-11-18","player":"佳","score":320,"win":1},
  {"date":"2025-11-18","player":"志","score":1500,"win":1},
  {"date":"2025-11-23","player":"志","score":2570,"win":1},
  {"date":"2025-11-23","player":"茄","score":1300,"win":1},
  {"date":"2025-11-23","player":"润","score":-2580,"win":-1},
  {"date":"2025-11-23","player":"杰仔","score":-540,"win":-1},
  {"date":"2025-11-23","player":"fafa","score":-2970,"win":-1},
  {"date":"2025-11-23","player":"佳","score":-1000,"win":-1},
  {"date":"2025-11-23","player":"锦辉","score":-3000,"win":-1},
  {"date":"2025-11-23","player":"谦","score":120,"win":1},
  {"date":"2025-11-23","player":"卢老师","score":6100,"win":1},
  {"date":"2025-11-30","player":"杰仔","score":-1000,"win":-1},
  {"date":"2025-11-30","player":"茄","score":5310,"win":1},
  {"date":"2025-11-30","player":"润年老表","score":0,"win":-1},
  {"date":"2025-11-30","player":"柱","score":-2000,"win":-1},
  {"date":"2025-11-30","player":"卢老师","score":1900,"win":1},
  {"date":"2025-11-30","player":"润","score":-6000,"win":-1},
  {"date":"2025-11-30","player":"志","score":3790,"win":1},
  {"date":"2025-11-30","player":"楠","score":-2000,"win":-1},
  {"date":"2025-12-03","player":"润","score":-400,"win":-1},
  {"date":"2025-12-03","player":"茄","score":3120,"win":1},
  {"date":"2025-12-03","player":"楠","score":-1820,"win":-1},
  {"date":"2025-12-03","player":"佳","score":-200,"win":-1},
  {"date":"2025-12-03","player":"卢老师","score":-700,"win":-1},
  {"date":"2025-12-06","player":"茄","score":-2100,"win":-1},
  {"date":"2025-12-06","player":"卢老师","score":0,"win":-1},
  {"date":"2025-12-06","player":"杰仔","score":1070,"win":1},
  {"date":"2025-12-06","player":"佳","score":5000,"win":1},
  {"date":"2025-12-06","player":"谦","score":1900,"win":1},
  {"date":"2025-12-06","player":"达","score":630,"win":1},
  {"date":"2025-12-06","player":"润","score":-6500,"win":-1},
  {"date":"2025-12-13","player":"润","score":-3120,"win":-1},
  {"date":"2025-12-13","player":"谦","score":2480,"win":1},
  {"date":"2025-12-13","player":"志","score":-1670,"win":-1},
  {"date":"2025-12-13","player":"佳","score":520,"win":1},
  {"date":"2025-12-13","player":"卢老师","score":-1500,"win":-1},
  {"date":"2025-12-13","player":"茄","score":3290,"win":1},
  {"date":"2025-12-15","player":"志","score":-60,"win":-1},
  {"date":"2025-12-15","player":"茄","score":-4300,"win":-1},
  {"date":"2025-12-15","player":"润","score":1420,"win":1},
  {"date":"2025-12-15","player":"谦","score":500,"win":1},
  {"date":"2025-12-15","player":"楠","score":190,"win":1},
  {"date":"2025-12-15","player":"卢老师","score":-1000,"win":-1},
  {"date":"2025-12-15","player":"杰仔","score":3250,"win":1},
  {"date":"2025-12-21","player":"志","score":1870,"win":1},
  {"date":"2025-12-21","player":"茄","score":4250,"win":1},
  {"date":"2025-12-21","player":"润","score":0,"win":-1},
  {"date":"2025-12-21","player":"卢老师","score":-700,"win":-1},
  {"date":"2025-12-21","player":"楠","score":-660,"win":-1},
  {"date":"2025-12-21","player":"谦","score":240,"win":1},
  {"date":"2025-12-21","player":"杰仔","score":-5000,"win":-1},
  {"date":"2025-12-23","player":"茄","score":-1050,"win":-1},
  {"date":"2025-12-23","player":"志","score":1000,"win":1},
  {"date":"2025-12-23","player":"佳","score":1650,"win":1},
  {"date":"2025-12-23","player":"卢老师","score":-1600,"win":-1},
  {"date":"2025-12-24","player":"茄","score":-2000,"win":-1},
  {"date":"2025-12-24","player":"志","score":-4000,"win":-1},
  {"date":"2025-12-24","player":"卢老师","score":3450,"win":1},
  {"date":"2025-12-24","player":"佳","score":2460,"win":1},
  {"date":"2025-12-24","player":"润","score":3100,"win":1},
  {"date":"2025-12-24","player":"谦","score":-3010,"win":-1},
  {"date":"2025-12-27","player":"志","score":-1920,"win":-1},
  {"date":"2025-12-27","player":"润","score":1800,"win":1},
  {"date":"2025-12-27","player":"卢老师","score":-2530,"win":-1},
  {"date":"2025-12-27","player":"佳","score":2300,"win":1},
  {"date":"2025-12-27","player":"润年老表","score":2270,"win":1},
  {"date":"2025-12-27","player":"柱","score":-1520,"win":-1},
  {"date":"2025-12-27","player":"茄","score":-400,"win":-1},
  {"date":"2025-12-28","player":"达","score":3130,"win":1},
  {"date":"2025-12-28","player":"锦辉","score":4860,"win":1},
  {"date":"2025-12-28","player":"润","score":370,"win":1},
  {"date":"2025-12-28","player":"杰仔","score":-1850,"win":-1},
  {"date":"2025-12-28","player":"谦","score":1080,"win":1},
  {"date":"2025-12-28","player":"佳","score":1000,"win":1},
  {"date":"2025-12-28","player":"茄","score":3860,"win":1},
  {"date":"2025-12-28","player":"卢老师","score":-1450,"win":-1},
  {"date":"2025-12-28","player":"志","score":-7000,"win":-1},
  {"date":"2025-12-28","player":"楠","score":-4000,"win":-1},
  {"date":"2026-01-02","player":"柱","score":0,"win":-1},
  {"date":"2026-01-02","player":"润年老表","score":2950,"win":1},
  {"date":"2026-01-02","player":"杰仔","score":4500,"win":1},
  {"date":"2026-01-02","player":"润","score":-7450,"win":-1},
  {"date":"2026-01-03","player":"茄","score":-2000,"win":-1},
  {"date":"2026-01-03","player":"润","score":690,"win":1},
  {"date":"2026-01-17","player":"达","score":-400,"win":-1},
  {"date":"2026-01-03","player":"佳","score":620,"win":1},
  {"date":"2026-01-03","player":"杰仔","score":-2100,"win":-1},
  {"date":"2026-01-03","player":"卢老师","score":2790,"win":1},
  {"date":"2026-01-10","player":"茄","score":-5220,"win":-1},
  {"date":"2026-01-10","player":"润","score":4520,"win":1},
  {"date":"2026-01-10","player":"谦","score":-6000,"win":-1},
  {"date":"2026-01-10","player":"佳","score":-640,"win":-1},
  {"date":"2026-01-10","player":"锦辉","score":4810,"win":1},
  {"date":"2026-01-10","player":"杰仔","score":1000,"win":1},
  {"date":"2026-01-10","player":"卢老师","score":520,"win":1},
  {"date":"2026-01-10","player":"柱","score":1010,"win":1},
  {"date":"2026-01-17","player":"志","score":-2070,"win":-1},
  {"date":"2026-01-17","player":"润","score":-1470,"win":-1},
  {"date":"2026-01-17","player":"谦","score":1900,"win":1},
  {"date":"2026-01-17","player":"楠","score":-3000,"win":-1},
  {"date":"2026-01-17","player":"佳","score":-1580,"win":-1},
  {"date":"2026-01-17","player":"fafa","score":3240,"win":1},
  {"date":"2026-01-17","player":"锦辉","score":2060,"win":1},
  {"date":"2026-01-17","player":"杰仔","score":1320,"win":1},
  {"date":"2026-01-19","player":"达","score":0,"win":-1},
  {"date":"2026-01-19","player":"志","score":-1200,"win":-1},
  {"date":"2026-01-19","player":"润","score":-1530,"win":-1},
  {"date":"2026-01-19","player":"谦","score":1040,"win":1},
  {"date":"2026-01-19","player":"楠","score":1750,"win":1},
  {"date":"2026-01-19","player":"佳","score":1140,"win":1},
  {"date":"2026-01-19","player":"茄","score":-400,"win":-1},
  {"date":"2026-01-19","player":"卢老师","score":-800,"win":-1},
  {"date":"2026-01-24","player":"达","score":-2000,"win":-1},
  {"date":"2026-01-24","player":"志","score":-3000,"win":-1},
  {"date":"2026-01-24","player":"茄","score":3700,"win":1},
  {"date":"2026-01-24","player":"润","score":-1400,"win":-1},
  {"date":"2026-01-24","player":"谦","score":180,"win":1},
  {"date":"2026-01-24","player":"佳","score":2960,"win":1},
  {"date":"2026-01-24","player":"fafa","score":-3490,"win":-1},
  {"date":"2026-01-24","player":"杰仔","score":2500,"win":1},
  {"date":"2026-01-24","player":"卢老师","score":550,"win":1},
  {"date":"2026-01-25","player":"志","score":3150,"win":1},
  {"date":"2026-01-25","player":"茄","score":-2000,"win":-1},
  {"date":"2026-01-25","player":"润","score":1300,"win":1},
  {"date":"2026-01-25","player":"润年老表","score":-2000,"win":-1},
  {"date":"2026-01-25","player":"谦","score":-5000,"win":-1},
  {"date":"2026-01-25","player":"佳","score":5150,"win":1},
  {"date":"2026-01-25","player":"锦辉","score":1570,"win":1},
  {"date":"2026-01-25","player":"杰仔","score":-2690,"win":-1},
  {"date":"2026-01-25","player":"卢老师","score":520,"win":1},
  {"date":"2026-02-28","player":"茄","score":4500,"win":1},
  {"date":"2026-01-31","player":"达","score":-2000,"win":-1},
  {"date":"2026-01-31","player":"茄","score":1050,"win":1},
  {"date":"2026-01-31","player":"润","score":-2300,"win":-1},
  {"date":"2026-01-31","player":"谦","score":-2000,"win":-1},
  {"date":"2026-01-31","player":"佳","score":3630,"win":1},
  {"date":"2026-01-31","player":"卢老师","score":160,"win":1},
  {"date":"2026-01-31","player":"楠","score":1460,"win":1},
  {"date":"2026-02-04","player":"志","score":2930,"win":1},
  {"date":"2026-02-04","player":"茄","score":4930,"win":1},
  {"date":"2026-02-04","player":"润","score":-2300,"win":-1},
  {"date":"2026-02-04","player":"谦","score":100,"win":1},
  {"date":"2026-02-04","player":"杰仔","score":-2360,"win":-1},
  {"date":"2026-02-04","player":"佳","score":-2300,"win":-1},
  {"date":"2026-02-04","player":"卢老师","score":-1000,"win":-1},
  {"date":"2026-02-07","player":"茄","score":1500,"win":1},
  {"date":"2026-02-07","player":"志","score":4580,"win":1},
  {"date":"2026-02-07","player":"润","score":20,"win":1},
  {"date":"2026-02-07","player":"佳","score":-1900,"win":-1},
  {"date":"2026-02-07","player":"fafa","score":800,"win":1},
  {"date":"2026-02-07","player":"锦辉","score":-3460,"win":-1},
  {"date":"2026-02-07","player":"杰仔","score":460,"win":1},
  {"date":"2026-02-07","player":"卢老师","score":-2000,"win":-1},
  {"date":"2026-02-09","player":"茄","score":-1000,"win":-1},
  {"date":"2026-02-09","player":"润","score":4950,"win":1},
  {"date":"2026-02-09","player":"佳","score":550,"win":1},
  {"date":"2026-02-09","player":"fafa","score":-1300,"win":-1},
  {"date":"2026-02-09","player":"杰仔","score":-3200,"win":-1},
  {"date":"2026-02-10","player":"茄","score":-2400,"win":-1},
  {"date":"2026-02-10","player":"志","score":50,"win":1},
  {"date":"2026-02-10","player":"润","score":2130,"win":1},
  {"date":"2026-02-10","player":"fafa","score":-2000,"win":-1},
  {"date":"2026-02-10","player":"达","score":2400,"win":1},
  {"date":"2026-02-10","player":"杰仔","score":20,"win":1},
  {"date":"2026-02-10","player":"佳","score":-470,"win":-1},
  {"date":"2026-02-10","player":"谦","score":270,"win":1},
  {"date":"2026-02-20","player":"志","score":3350,"win":1},
  {"date":"2026-02-20","player":"茄","score":780,"win":1},
  {"date":"2026-02-20","player":"润","score":-5100,"win":-1},
  {"date":"2026-02-20","player":"谦","score":240,"win":1},
  {"date":"2026-02-20","player":"楠","score":280,"win":1},
  {"date":"2026-02-20","player":"佳","score":-940,"win":-1},
  {"date":"2026-02-20","player":"卢老师","score":1390,"win":1},
  {"date":"2026-02-23","player":"志","score":3500,"win":1},
  {"date":"2026-02-23","player":"润","score":-1800,"win":-1},
  {"date":"2026-02-23","player":"茄","score":-2600,"win":-1},
  {"date":"2026-02-23","player":"谦","score":4310,"win":1},
  {"date":"2026-02-23","player":"楠","score":2520,"win":1},
  {"date":"2026-02-23","player":"fafa","score":1100,"win":1},
  {"date":"2026-02-23","player":"佳","score":-2050,"win":-1},
  {"date":"2026-02-23","player":"卢老师","score":1200,"win":1},
  {"date":"2026-02-23","player":"杰仔","score":-6180,"win":-1},
  {"date":"2026-02-24","player":"茄","score":-850,"win":-1},
  {"date":"2026-02-24","player":"润","score":1000,"win":1},
  {"date":"2026-02-24","player":"卢老师","score":700,"win":1},
  {"date":"2026-02-24","player":"佳","score":-990,"win":-1},
  {"date":"2026-02-24","player":"楠","score":140,"win":1},
  {"date":"2026-04-12","player":"达","score":550,"win":1},
  {"date":"2026-02-28","player":"润","score":520,"win":1},
  {"date":"2026-02-28","player":"谦","score":-420,"win":-1},
  {"date":"2026-02-28","player":"佳","score":-2000,"win":-1},
  {"date":"2026-02-28","player":"fafa","score":590,"win":1},
  {"date":"2026-02-28","player":"杰仔","score":-5000,"win":-1},
  {"date":"2026-02-28","player":"卢老师","score":-370,"win":-1},
  {"date":"2026-02-28","player":"楠","score":2180,"win":1},
  {"date":"2026-03-01","player":"志","score":1300,"win":1},
  {"date":"2026-03-01","player":"茄","score":-8300,"win":-1},
  {"date":"2026-03-01","player":"楠","score":6610,"win":1},
  {"date":"2026-03-01","player":"润","score":-2320,"win":-1},
  {"date":"2026-03-01","player":"佳","score":3050,"win":1},
  {"date":"2026-03-01","player":"fafa","score":-2440,"win":-1},
  {"date":"2026-03-01","player":"卢老师","score":2100,"win":1},
  {"date":"2026-03-08","player":"茄","score":0,"win":-1},
  {"date":"2026-03-08","player":"卢老师","score":-1980,"win":-1},
  {"date":"2026-03-08","player":"润","score":6430,"win":1},
  {"date":"2026-03-08","player":"佳","score":1400,"win":1},
  {"date":"2026-03-08","player":"谦","score":840,"win":1},
  {"date":"2026-03-08","player":"志","score":-12000,"win":-1},
  {"date":"2026-03-08","player":"锦辉","score":-3720,"win":-1},
  {"date":"2026-03-08","player":"fafa","score":10900,"win":1},
  {"date":"2026-03-08","player":"达","score":-2700,"win":-1},
  {"date":"2026-03-08","player":"杰仔","score":830,"win":1},
  {"date":"2026-03-12","player":"达","score":1440,"win":1},
  {"date":"2026-03-12","player":"茄","score":1400,"win":1},
  {"date":"2026-03-12","player":"润","score":-2860,"win":-1},
  {"date":"2026-03-12","player":"佳","score":750,"win":1},
  {"date":"2026-03-12","player":"谦","score":-80,"win":-1},
  {"date":"2026-03-12","player":"fafa","score":-3250,"win":-1},
  {"date":"2026-03-12","player":"杰仔","score":2600,"win":1},
  {"date":"2026-03-14","player":"志","score":6890,"win":1},
  {"date":"2026-03-14","player":"茄","score":-2750,"win":-1},
  {"date":"2026-03-14","player":"润","score":5300,"win":1},
  {"date":"2026-03-14","player":"谦","score":-580,"win":-1},
  {"date":"2026-03-14","player":"润年老表","score":700,"win":1},
  {"date":"2026-03-14","player":"卢老师","score":-4000,"win":-1},
  {"date":"2026-03-14","player":"佳","score":-5560,"win":-1},
  {"date":"2026-03-15","player":"茄","score":650,"win":1},
  {"date":"2026-03-15","player":"谦","score":1260,"win":1},
  {"date":"2026-03-15","player":"楠","score":-2000,"win":-1},
  {"date":"2026-03-15","player":"锦辉","score":3240,"win":1},
  {"date":"2026-03-15","player":"杰仔","score":-3220,"win":-1},
  {"date":"2026-03-15","player":"佳","score":3710,"win":1},
  {"date":"2026-03-15","player":"fafa","score":-4260,"win":-1},
  {"date":"2026-03-15","player":"卢老师","score":620,"win":1},
  {"date":"2026-03-16","player":"志","score":550,"win":1},
  {"date":"2026-03-16","player":"茄","score":-3200,"win":-1},
  {"date":"2026-03-16","player":"楠","score":-990,"win":-1},
  {"date":"2026-03-16","player":"佳","score":3160,"win":1},
  {"date":"2026-03-16","player":"fafa","score":5480,"win":1},
  {"date":"2026-03-16","player":"润","score":-4500,"win":-1},
  {"date":"2026-03-16","player":"卢老师","score":-500,"win":-1},
  {"date":"2026-03-22","player":"茄","score":5320,"win":1},
  {"date":"2026-03-22","player":"达","score":-400,"win":-1},
  {"date":"2026-03-22","player":"谦","score":6200,"win":1},
  {"date":"2026-03-22","player":"润","score":-2250,"win":-1},
  {"date":"2026-03-22","player":"锦辉","score":-2000,"win":-1},
  {"date":"2026-03-22","player":"fafa","score":-3630,"win":-1},
  {"date":"2026-03-22","player":"卢老师","score":-2000,"win":-1},
  {"date":"2026-03-22","player":"杰仔","score":-1240,"win":-1},
  {"date":"2026-03-24","player":"茄","score":2600,"win":1},
  {"date":"2026-03-24","player":"润","score":1150,"win":1},
  {"date":"2026-03-24","player":"楠","score":-4750,"win":-1},
  {"date":"2026-03-24","player":"佳","score":1000,"win":1},
  {"date":"2026-03-28","player":"达","score":700,"win":1},
  {"date":"2026-03-28","player":"茄","score":400,"win":1},
  {"date":"2026-03-28","player":"润","score":-1250,"win":-1},
  {"date":"2026-03-28","player":"谦","score":970,"win":1},
  {"date":"2026-03-28","player":"佳","score":3800,"win":1},
  {"date":"2026-03-28","player":"卢老师","score":-3000,"win":-1},
  {"date":"2026-03-28","player":"fafa","score":-1620,"win":-1},
  {"date":"2026-04-04","player":"茄","score":2000,"win":1},
  {"date":"2026-04-04","player":"fafa","score":300,"win":1},
  {"date":"2026-04-04","player":"柱","score":1250,"win":1},
  {"date":"2026-04-04","player":"杰仔","score":960,"win":1},
  {"date":"2026-04-04","player":"润","score":-2000,"win":-1},
  {"date":"2026-04-04","player":"润年老表","score":-1700,"win":-1},
  {"date":"2026-04-04","player":"佳","score":-810,"win":-1},
  {"date":"2026-04-06","player":"润","score":-2900,"win":-1},
  {"date":"2026-04-06","player":"谦","score":-600,"win":-1},
  {"date":"2026-04-06","player":"达","score":-600,"win":-1},
  {"date":"2026-04-06","player":"fafa","score":2600,"win":1},
  {"date":"2026-04-06","player":"佳","score":4000,"win":1},
  {"date":"2026-04-06","player":"茄","score":-3450,"win":-1},
  {"date":"2026-04-06","player":"卢老师","score":950,"win":1},
  {"date":"2026-04-07","player":"杰仔","score":-690,"win":-1},
  {"date":"2026-04-07","player":"茄","score":5500,"win":1},
  {"date":"2026-04-07","player":"润","score":150,"win":1},
  {"date":"2026-04-07","player":"谦","score":-3000,"win":-1},
  {"date":"2026-04-07","player":"楠","score":1310,"win":1},
  {"date":"2026-04-07","player":"fafa","score":1610,"win":1},
  {"date":"2026-04-07","player":"佳","score":-4000,"win":-1},
  {"date":"2026-04-07","player":"卢老师","score":-880,"win":-1},
  {"date":"2026-04-11","player":"茄","score":-3380,"win":-1},
  {"date":"2026-04-11","player":"卢老师","score":780,"win":1},
  {"date":"2026-04-11","player":"润","score":-3700,"win":-1},
  {"date":"2026-04-11","player":"fafa","score":3300,"win":1},
  {"date":"2026-04-11","player":"佳","score":3000,"win":1},
  {"date":"2026-04-12","player":"志","score":300,"win":1},
  {"date":"2026-04-12","player":"茄","score":-4000,"win":-1},
  {"date":"2026-04-12","player":"润","score":-3750,"win":-1},
  {"date":"2026-04-12","player":"谦","score":-230,"win":-1},
  {"date":"2026-04-12","player":"佳","score":-480,"win":-1},
  {"date":"2026-04-12","player":"fafa","score":820,"win":1},
  {"date":"2026-04-12","player":"锦辉","score":2540,"win":1},
  {"date":"2026-04-12","player":"杰仔","score":-1000,"win":-1},
  {"date":"2026-04-12","player":"卢老师","score":5250,"win":1},
];
