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
// Supabase Client Functions (async)
import { 
  getAllRecordsFromSupabase, 
  insertRecordsToSupabase, 
  deleteRecordsByDateFromSupabase,
  getAllSeasonsFromSupabase,
  insertSeasonToSupabase,
  updateSeasonFromSupabase,
  endSeasonFromSupabase,
  getAllClearsFromSupabase,
  insertClearRecordToSupabase,
  getAllAICacheFromSupabase,
  insertAICacheToSupabase,
  updateAICacheFromSupabase,
  deleteAICacheFromSupabase
} from "@/storage/database/supabase/crud";

// Legacy localStorage Keys
const STORAGE_KEY = 'poker-tracker-records';
const SEASONS_KEY = 'poker-tracker-seasons';
const CLEARS_KEY = 'poker-tracker-clears';
const AI_CACHE_KEY = 'poker-tracker-ai-cache';

// ==================== SUPABASE DATA LOADER ====================
// These functions load data from Supabase and can fallback to localStorage

export async function loadRecords(): Promise<PokerRecord[]> {
  if (typeof window === 'undefined') return [];
  try {
    const data = await getAllRecordsFromSupabase();
    // Convert database format to app format
    return data.map(r => ({
      date: r.date,
      player: r.player,
      score: r.score,
      win: r.win as 1 | -1,
    }));
  } catch (e) {
    console.warn("Failed to load from Supabase, falling back to localStorage", e);
    // Fallback to localStorage
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
  try {
    // Save to Supabase
    await deleteRecordsByDateFromSupabase(records[0]?.date || "");
    if (records.length > 0) {
      await insertRecordsToSupabase(
        records.map(r => ({
          date: r.date,
          player: r.player,
          score: r.score,
          win: r.win,
        }))
      );
    }
    // Also save to localStorage as backup
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    console.error("Failed to save to Supabase", e);
    // Fallback to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }
}

export async function loadSeasons(): Promise<Season[]> {
  if (typeof window === 'undefined') return [];
  try {
    const data = await getAllSeasonsFromSupabase();
    return data.map(s => ({
      id: s.id,
      name: s.name,
      startDate: s.start_date,
      endDate: s.end_date || undefined,
      active: s.active,
    }));
  } catch (e) {
    console.warn("Failed to load seasons from Supabase, falling back to localStorage", e);
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
  try {
    for (const s of seasons) {
      await insertSeasonToSupabase({
        name: s.name,
        start_date: s.startDate,
        end_date: s.endDate,
        active: s.active,
      });
    }
    localStorage.setItem(SEASONS_KEY, JSON.stringify(seasons));
  } catch (e) {
    console.error("Failed to save seasons to Supabase", e);
    localStorage.setItem(SEASONS_KEY, JSON.stringify(seasons));
  }
}

export async function loadClears(): Promise<ClearRecord[]> {
  if (typeof window === 'undefined') return [];
  try {
    const data = await getAllClearsFromSupabase();
    return data.map(c => ({
      id: c.id,
      date: c.date,
      player: c.player,
      amount: c.amount,
      seasonId: c.season_id,
      type: c.clear_type as 'threshold' | 'season_end',
    }));
  } catch (e) {
    console.warn("Failed to load clears from Supabase, falling back to localStorage", e);
    try {
      const raw = localStorage.getItem(CLEARS_KEY);
      if (raw) return JSON.parse(raw) as ClearRecord[];
    } catch {
      // ignore
    }
  }
  return [];
}

export async function saveClear(record: ClearRecord): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    await insertClearRecordToSupabase({
      date: record.date,
      player: record.player,
      amount: record.amount,
      season_id: record.seasonId,
      clear_type: record.type,
    });
    // Update localStorage
    const clears = await loadClears();
    clears.push(record);
    localStorage.setItem(CLEARS_KEY, JSON.stringify(clears));
  } catch (e) {
    console.error("Failed to save clear to Supabase", e);
  }
}

// Legacy sync function for backward compatibility
export function saveClears(clears: ClearRecord[]): void {
  localStorage.setItem(CLEARS_KEY, JSON.stringify(clears));
}

export async function loadAICache(): Promise<AICacheItem[]> {
  if (typeof window === 'undefined') return [];
  try {
    const data = await getAllAICacheFromSupabase();
    return data.map(c => ({
      label: c.label,
      prompt: c.prompt,
      result: c.result,
      time: c.time,
    }));
  } catch (e) {
    console.warn("Failed to load AI cache from Supabase, falling back to localStorage", e);
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
    await insertAICacheToSupabase({
      label: item.label,
      prompt: item.prompt,
      result: item.result,
      time: item.time,
    });
    // Update localStorage
    const cache = await loadAICache();
    const existingIndex = cache.findIndex(c => c.label === item.label);
    if (existingIndex >= 0) {
      cache[existingIndex] = item;
    } else {
      cache.push(item);
    }
    localStorage.setItem(AI_CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    console.error("Failed to save AI cache to Supabase", e);
  }
}

export async function endSeason(seasonId: string): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    await endSeasonFromSupabase(seasonId);
  } catch (e) {
    console.error("Failed to end season in Supabase", e);
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
  {"date":"2025-11-07","player":"达","score":-3520,"win":-1},
  {"date":"2025-11-07","player":"志","score":2490,"win":1},
  {"date":"2025-11-07","player":"谦","score":-2490,"win":-1},
  {"date":"2025-11-09","player":"茄","score":2430,"win":1},
  {"date":"2025-11-09","player":"润","score":-2890,"win":-1},
  {"date":"2025-11-09","player":"佳","score":2700,"win":1},
  {"date":"2025-11-09","player":"杰仔","score":1190,"win":1},
  {"date":"2025-11-09","player":"楠","score":-2430,"win":-1},
  {"date":"2025-11-09","player":"柱","score":-1000,"win":-1},
  {"date":"2025-11-09","player":"润年老表","score":-2000,"win":-1},
  {"date":"2025-11-09","player":"志","score":2000,"win":1},
  {"date":"2025-11-14","player":"茄","score":-2700,"win":-1},
  {"date":"2025-11-14","player":"润","score":1380,"win":1},
  {"date":"2025-11-14","player":"佳","score":1050,"win":1},
  {"date":"2025-11-14","player":"杰仔","score":2050,"win":1},
  {"date":"2025-11-14","player":"谦","score":1420,"win":1},
  {"date":"2025-11-14","player":"卢老师","score":-3200,"win":-1},
  {"date":"2025-11-18","player":"茄","score":-1060,"win":-1},
  {"date":"2025-11-18","player":"润","score":-3100,"win":-1},
  {"date":"2025-11-18","player":"佳","score":4610,"win":1},
  {"date":"2025-11-18","player":"志","score":1170,"win":1},
  {"date":"2025-11-18","player":"卢老师","score":-1620,"win":-1},
  {"date":"2025-11-23","player":"茄","score":1360,"win":1},
  {"date":"2025-11-23","player":"润","score":-1580,"win":-1},
  {"date":"2025-11-23","player":"佳","score":-1260,"win":-1},
  {"date":"2025-11-23","player":"杰仔","score":-3580,"win":-1},
  {"date":"2025-11-23","player":"谦","score":3020,"win":1},
  {"date":"2025-11-23","player":"锦辉","score":-1500,"win":-1},
  {"date":"2025-11-23","player":"志","score":2540,"win":1},
  {"date":"2025-11-23","player":"fafa","score":-1520,"win":-1},
  {"date":"2025-11-23","player":"卢老师","score":2520,"win":1},
  {"date":"2025-11-30","player":"润","score":-3590,"win":-1},
  {"date":"2025-11-30","player":"楠","score":-830,"win":-1},
  {"date":"2025-11-30","player":"谦","score":930,"win":1},
  {"date":"2025-11-30","player":"柱","score":-2000,"win":-1},
  {"date":"2025-11-30","player":"志","score":3320,"win":1},
  {"date":"2025-11-30","player":"杰仔","score":-1050,"win":-1},
  {"date":"2025-11-30","player":"卢老师","score":3220,"win":1},
  {"date":"2025-12-03","player":"茄","score":1290,"win":1},
  {"date":"2025-12-03","player":"润","score":-1950,"win":-1},
  {"date":"2025-12-03","player":"佳","score":-1340,"win":-1},
  {"date":"2025-12-03","player":"楠","score":-2770,"win":-1},
  {"date":"2025-12-03","player":"卢老师","score":4770,"win":1},
  {"date":"2025-12-06","player":"茄","score":-3080,"win":-1},
  {"date":"2025-12-06","player":"润","score":-2440,"win":-1},
  {"date":"2025-12-06","player":"佳","score":2580,"win":1},
  {"date":"2025-12-06","player":"谦","score":3030,"win":1},
  {"date":"2025-12-06","player":"达","score":330,"win":1},
  {"date":"2025-12-06","player":"卢老师","score":-770,"win":-1},
  {"date":"2025-12-06","player":"杰仔","score":350,"win":1},
  {"date":"2025-12-13","player":"茄","score":2830,"win":1},
  {"date":"2025-12-13","player":"润","score":-1960,"win":-1},
  {"date":"2025-12-13","player":"佳","score":1420,"win":1},
  {"date":"2025-12-13","player":"谦","score":710,"win":1},
  {"date":"2025-12-13","player":"志","score":-1500,"win":-1},
  {"date":"2025-12-13","player":"卢老师","score":-1500,"win":-1},
  {"date":"2025-12-15","player":"茄","score":-1400,"win":-1},
  {"date":"2025-12-15","player":"润","score":1590,"win":1},
  {"date":"2025-12-15","player":"谦","score":3310,"win":1},
  {"date":"2025-12-15","player":"楠","score":870,"win":1},
  {"date":"2025-12-15","player":"志","score":-2070,"win":-1},
  {"date":"2025-12-15","player":"卢老师","score":-2300,"win":-1},
  {"date":"2025-12-15","player":"杰仔","score":-2200,"win":-1},
  {"date":"2025-12-21","player":"润","score":1590,"win":1},
  {"date":"2025-12-21","player":"谦","score":1240,"win":1},
  {"date":"2025-12-21","player":"楠","score":-1090,"win":-1},
  {"date":"2025-12-21","player":"志","score":600,"win":1},
  {"date":"2025-12-21","player":"杰仔","score":-2340,"win":-1},
  {"date":"2025-12-23","player":"茄","score":-1390,"win":-1},
  {"date":"2025-12-23","player":"润","score":-780,"win":-1},
  {"date":"2025-12-23","player":"佳","score":-2070,"win":-1},
  {"date":"2025-12-23","player":"志","score":2510,"win":1},
  {"date":"2025-12-23","player":"卢老师","score":1730,"win":1},
  {"date":"2025-12-24","player":"茄","score":10050,"win":1},
  {"date":"2025-12-24","player":"润","score":1010,"win":1},
  {"date":"2025-12-24","player":"佳","score":-2530,"win":-1},
  {"date":"2025-12-24","player":"谦","score":-5600,"win":-1},
  {"date":"2025-12-24","player":"志","score":-2930,"win":-1},
  {"date":"2025-12-24","player":"卢老师","score":-3620,"win":-1},
  {"date":"2025-12-24","player":"杰仔","score":3620,"win":1},
  {"date":"2025-12-27","player":"润","score":-2400,"win":-1},
  {"date":"2025-12-27","player":"佳","score":1540,"win":1},
  {"date":"2025-12-27","player":"柱","score":1250,"win":1},
  {"date":"2025-12-27","player":"志","score":-1850,"win":-1},
  {"date":"2025-12-27","player":"卢老师","score":1460,"win":1},
  {"date":"2025-12-27","player":"润年老表","score":2950,"win":1},
  {"date":"2025-12-28","player":"茄","score":3310,"win":1},
  {"date":"2025-12-28","player":"润","score":1870,"win":1},
  {"date":"2025-12-28","player":"佳","score":840,"win":1},
  {"date":"2025-12-28","player":"谦","score":890,"win":1},
  {"date":"2025-12-28","player":"达","score":1200,"win":1},
  {"date":"2025-12-28","player":"锦辉","score":2100,"win":1},
  {"date":"2025-12-28","player":"楠","score":-4750,"win":-1},
  {"date":"2025-12-28","player":"志","score":-2830,"win":-1},
  {"date":"2025-12-28","player":"杰仔","score":-2630,"win":-1},
  {"date":"2026-01-02","player":"润","score":-3110,"win":-1},
  {"date":"2026-01-02","player":"柱","score":-770,"win":-1},
  {"date":"2026-01-02","player":"杰仔","score":1290,"win":1},
  {"date":"2026-01-02","player":"润年老表","score":2590,"win":1},
  {"date":"2026-01-03","player":"茄","score":-2490,"win":-1},
  {"date":"2026-01-03","player":"润","score":1310,"win":1},
  {"date":"2026-01-03","player":"佳","score":980,"win":1},
  {"date":"2026-01-03","player":"卢老师","score":200,"win":1},
  {"date":"2026-01-10","player":"茄","score":-2290,"win":-1},
  {"date":"2026-01-10","player":"润","score":1270,"win":1},
  {"date":"2026-01-10","player":"佳","score":-1900,"win":-1},
  {"date":"2026-01-10","player":"谦","score":-3680,"win":-1},
  {"date":"2026-01-10","player":"锦辉","score":3500,"win":1},
  {"date":"2026-01-10","player":"柱","score":620,"win":1},
  {"date":"2026-01-10","player":"卢老师","score":2480,"win":1},
  {"date":"2026-01-17","player":"佳","score":-840,"win":-1},
  {"date":"2026-01-17","player":"谦","score":870,"win":1},
  {"date":"2026-01-17","player":"达","score":-2700,"win":-1},
  {"date":"2026-01-17","player":"杰仔","score":3790,"win":1},
  {"date":"2026-01-17","player":"楠","score":-3200,"win":-1},
  {"date":"2026-01-17","player":"志","score":-2280,"win":-1},
  {"date":"2026-01-17","player":"fafa","score":4360,"win":1},
  {"date":"2026-01-19","player":"茄","score":-1030,"win":-1},
  {"date":"2026-01-19","player":"润","score":-2930,"win":-1},
  {"date":"2026-01-19","player":"佳","score":5150,"win":1},
  {"date":"2026-01-19","player":"谦","score":2000,"win":1},
  {"date":"2026-01-19","player":"达","score":590,"win":1},
  {"date":"2026-01-19","player":"楠","score":1060,"win":1},
  {"date":"2026-01-19","player":"志","score":-2750,"win":-1},
  {"date":"2026-01-19","player":"卢老师","score":-2090,"win":-1},
  {"date":"2026-01-24","player":"茄","score":770,"win":1},
  {"date":"2026-01-24","player":"润","score":-3300,"win":-1},
  {"date":"2026-01-24","player":"佳","score":1370,"win":1},
  {"date":"2026-01-24","player":"达","score":-1260,"win":-1},
  {"date":"2026-01-24","player":"杰仔","score":3270,"win":1},
  {"date":"2026-01-24","player":"锦辉","score":1100,"win":1},
  {"date":"2026-01-24","player":"fafa","score":-1950,"win":-1},
  {"date":"2026-01-24","player":"卢老师","score":2770,"win":1},
  {"date":"2026-01-24","player":"谦","score":-2770,"win":-1},
  {"date":"2026-01-25","player":"茄","score":-1250,"win":-1},
  {"date":"2026-01-25","player":"润","score":1950,"win":1},
  {"date":"2026-01-25","player":"佳","score":660,"win":1},
  {"date":"2026-01-25","player":"谦","score":-1380,"win":-1},
  {"date":"2026-01-25","player":"志","score":1000,"win":1},
  {"date":"2026-01-25","player":"锦辉","score":1760,"win":1},
  {"date":"2026-01-25","player":"杰仔","score":-2470,"win":-1},
  {"date":"2026-01-25","player":"卢老师","score":-270,"win":-1},
  {"date":"2026-01-25","player":"润年老表","score":-2000,"win":-1},
  {"date":"2026-01-31","player":"茄","score":1600,"win":1},
  {"date":"2026-01-31","player":"润","score":-5550,"win":-1},
  {"date":"2026-01-31","player":"佳","score":660,"win":1},
  {"date":"2026-01-31","player":"谦","score":-1990,"win":-1},
  {"date":"2026-01-31","player":"达","score":-610,"win":-1},
  {"date":"2026-01-31","player":"楠","score":2520,"win":1},
  {"date":"2026-01-31","player":"卢老师","score":3370,"win":1},
  {"date":"2026-02-04","player":"茄","score":-1600,"win":-1},
  {"date":"2026-02-04","player":"润","score":-4170,"win":-1},
  {"date":"2026-02-04","player":"佳","score":-2330,"win":-1},
  {"date":"2026-02-04","player":"谦","score":5580,"win":1},
  {"date":"2026-02-04","player":"志","score":2500,"win":1},
  {"date":"2026-02-04","player":"卢老师","score":-1580,"win":-1},
  {"date":"2026-02-04","player":"杰仔","score":1600,"win":1},
  {"date":"2026-02-07","player":"茄","score":3350,"win":1},
  {"date":"2026-02-07","player":"润","score":960,"win":1},
  {"date":"2026-02-07","player":"佳","score":-5560,"win":-1},
  {"date":"2026-02-07","player":"锦辉","score":-3720,"win":-1},
  {"date":"2026-02-07","player":"志","score":6890,"win":1},
  {"date":"2026-02-07","player":"fafa","score":-1920,"win":-1},
  {"date":"2026-02-07","player":"卢老师","score":-1780,"win":-1},
  {"date":"2026-02-07","player":"谦","score":1780,"win":1},
  {"date":"2026-02-09","player":"茄","score":470,"win":1},
  {"date":"2026-02-09","player":"润","score":2810,"win":1},
  {"date":"2026-02-09","player":"佳","score":2460,"win":1},
  {"date":"2026-02-09","player":"杰仔","score":-2220,"win":-1},
  {"date":"2026-02-09","player":"fafa","score":-3530,"win":-1},
  {"date":"2026-02-10","player":"茄","score":-1290,"win":-1},
  {"date":"2026-02-10","player":"润","score":1460,"win":1},
  {"date":"2026-02-10","player":"佳","score":-810,"win":-1},
  {"date":"2026-02-10","player":"谦","score":1830,"win":1},
  {"date":"2026-02-10","player":"达","score":3130,"win":1},
  {"date":"2026-02-10","player":"杰仔","score":850,"win":1},
  {"date":"2026-02-10","player":"志","score":830,"win":1},
  {"date":"2026-02-10","player":"fafa","score":-6000,"win":-1},
  {"date":"2026-02-20","player":"茄","score":940,"win":1},
  {"date":"2026-02-20","player":"润","score":-2470,"win":-1},
  {"date":"2026-02-20","player":"佳","score":-3040,"win":-1},
  {"date":"2026-02-20","player":"谦","score":4820,"win":1},
  {"date":"2026-02-20","player":"楠","score":1100,"win":1},
  {"date":"2026-02-20","player":"志","score":950,"win":1},
  {"date":"2026-02-20","player":"卢老师","score":-2300,"win":-1},
  {"date":"2026-02-23","player":"茄","score":-1900,"win":-1},
  {"date":"2026-02-23","player":"润","score":-2880,"win":-1},
  {"date":"2026-02-23","player":"佳","score":-810,"win":-1},
  {"date":"2026-02-23","player":"谦","score":1990,"win":1},
  {"date":"2026-02-23","player":"杰仔","score":-620,"win":-1},
  {"date":"2026-02-23","player":"楠","score":1340,"win":1},
  {"date":"2026-02-23","player":"fafa","score":2880,"win":1},
  {"date":"2026-02-23","player":"卢老师","score":-4000,"win":-1},
  {"date":"2026-02-24","player":"茄","score":-920,"win":-1},
  {"date":"2026-02-24","player":"润","score":2440,"win":1},
  {"date":"2026-02-24","player":"佳","score":-2120,"win":-1},
  {"date":"2026-02-24","player":"楠","score":600,"win":1},
  {"date":"2026-02-24","player":"卢老师","score":630,"win":1},
  {"date":"2026-02-24","player":"谦","score":-630,"win":-1},
  {"date":"2026-02-28","player":"茄","score":2460,"win":1},
  {"date":"2026-02-28","player":"润","score":840,"win":1},
  {"date":"2026-02-28","player":"佳","score":-1740,"win":-1},
  {"date":"2026-02-28","player":"谦","score":-2780,"win":-1},
  {"date":"2026-02-28","player":"杰仔","score":-1640,"win":-1},
  {"date":"2026-02-28","player":"楠","score":1440,"win":1},
  {"date":"2026-02-28","player":"fafa","score":1420,"win":1},
  {"date":"2026-03-01","player":"茄","score":-2150,"win":-1},
  {"date":"2026-03-01","player":"润","score":-1960,"win":-1},
  {"date":"2026-03-01","player":"佳","score":4190,"win":1},
  {"date":"2026-03-01","player":"楠","score":1850,"win":1},
  {"date":"2026-03-01","player":"志","score":1050,"win":1},
  {"date":"2026-03-01","player":"fafa","score":-2980,"win":-1},
  {"date":"2026-03-01","player":"卢老师","score":-2000,"win":-1},
  {"date":"2026-03-08","player":"茄","score":-1340,"win":-1},
  {"date":"2026-03-08","player":"润","score":990,"win":1},
  {"date":"2026-03-08","player":"佳","score":3310,"win":1},
  {"date":"2026-03-08","player":"谦","score":-1620,"win":-1},
  {"date":"2026-03-08","player":"达","score":-990,"win":-1},
  {"date":"2026-03-08","player":"锦辉","score":-350,"win":-1},
  {"date":"2026-03-08","player":"fafa","score":-2000,"win":-1},
  {"date":"2026-03-08","player":"卢老师","score":2000,"win":1},
  {"date":"2026-03-12","player":"茄","score":-600,"win":-1},
  {"date":"2026-03-12","player":"润","score":-810,"win":-1},
  {"date":"2026-03-12","player":"佳","score":2500,"win":1},
  {"date":"2026-03-12","player":"谦","score":-1680,"win":-1},
  {"date":"2026-03-12","player":"达","score":2870,"win":1},
  {"date":"2026-03-12","player":"杰仔","score":880,"win":1},
  {"date":"2026-03-12","player":"fafa","score":-2160,"win":-1},
  {"date":"2026-03-14","player":"茄","score":-1450,"win":-1},
  {"date":"2026-03-14","player":"润","score":1510,"win":1},
  {"date":"2026-03-14","player":"佳","score":-370,"win":-1},
  {"date":"2026-03-14","player":"谦","score":-2870,"win":-1},
  {"date":"2026-03-14","player":"志","score":1310,"win":1},
  {"date":"2026-03-14","player":"卢老师","score":-830,"win":-1},
  {"date":"2026-03-14","player":"润年老表","score":2700,"win":1},
  {"date":"2026-03-15","player":"茄","score":1360,"win":1},
  {"date":"2026-03-15","player":"润","score":-3610,"win":-1},
  {"date":"2026-03-15","player":"佳","score":3680,"win":1},
  {"date":"2026-03-15","player":"谦","score":2700,"win":1},
  {"date":"2026-03-15","player":"杰仔","score":-4510,"win":-1},
  {"date":"2026-03-15","player":"锦辉","score":880,"win":1},
  {"date":"2026-03-15","player":"楠","score":-500,"win":-1},
  {"date":"2026-03-16","player":"茄","score":-1130,"win":-1},
  {"date":"2026-03-16","player":"润","score":-1440,"win":-1},
  {"date":"2026-03-16","player":"佳","score":1020,"win":1},
  {"date":"2026-03-16","player":"楠","score":-1120,"win":-1},
  {"date":"2026-03-16","player":"志","score":1720,"win":1},
  {"date":"2026-03-16","player":"fafa","score":950,"win":1},
  {"date":"2026-03-22","player":"茄","score":4790,"win":1},
  {"date":"2026-03-22","player":"润","score":-4210,"win":-1},
  {"date":"2026-03-22","player":"佳","score":360,"win":1},
  {"date":"2026-03-22","player":"谦","score":6200,"win":1},
  {"date":"2026-03-22","player":"达","score":-1430,"win":-1},
  {"date":"2026-03-22","player":"锦辉","score":-2740,"win":-1},
  {"date":"2026-03-22","player":"fafa","score":-3170,"win":-1},
  {"date":"2026-03-24","player":"茄","score":1830,"win":1},
  {"date":"2026-03-24","player":"润","score":1810,"win":1},
  {"date":"2026-03-24","player":"佳","score":4550,"win":1},
  {"date":"2026-03-24","player":"楠","score":-2960,"win":-1},
  {"date":"2026-03-24","player":"fafa","score":-5230,"win":-1},
  {"date":"2026-03-28","player":"茄","score":5200,"win":1},
  {"date":"2026-03-28","player":"润","score":-1260,"win":-1},
  {"date":"2026-03-28","player":"佳","score":980,"win":1},
  {"date":"2026-03-28","player":"谦","score":1930,"win":1},
  {"date":"2026-03-28","player":"达","score":2320,"win":1},
  {"date":"2026-03-28","player":"fafa","score":-2310,"win":-1},
  {"date":"2026-03-28","player":"卢老师","score":-3230,"win":-1},
  {"date":"2026-03-28","player":"杰仔","score":-3630,"win":-1},
  {"date":"2026-04-04","player":"润","score":-1860,"win":-1},
  {"date":"2026-04-04","player":"佳","score":-3340,"win":-1},
  {"date":"2026-04-04","player":"谦","score":-3000,"win":-1},
  {"date":"2026-04-04","player":"茄","score":2110,"win":1},
  {"date":"2026-04-04","player":"柱","score":1090,"win":1},
  {"date":"2026-04-04","player":"杰仔","score":1450,"win":1},
  {"date":"2026-04-04","player":"fafa","score":10900,"win":1},
  {"date":"2026-04-04","player":"润年老表","score":-1020,"win":-1},
  {"date":"2026-04-04","player":"楠","score":-6330,"win":-1},
  {"date":"2026-04-06","player":"茄","score":-870,"win":-1},
  {"date":"2026-04-06","player":"润","score":-1100,"win":-1},
  {"date":"2026-04-06","player":"佳","score":4170,"win":1},
  {"date":"2026-04-06","player":"谦","score":-4200,"win":-1},
  {"date":"2026-04-06","player":"达","score":-1200,"win":-1},
  {"date":"2026-04-06","player":"fafa","score":3200,"win":1},
  {"date":"2026-04-06","player":"卢老师","score":-4000,"win":-1},
  {"date":"2026-04-06","player":"润年老表","score":-2000,"win":-1},
  {"date":"2026-04-06","player":"楠","score":6000,"win":1},
  {"date":"2026-04-07","player":"润","score":930,"win":1},
  {"date":"2026-04-07","player":"佳","score":-3350,"win":-1},
  {"date":"2026-04-07","player":"谦","score":-2000,"win":-1},
  {"date":"2026-04-07","player":"楠","score":4920,"win":1},
  {"date":"2026-04-07","player":"fafa","score":4620,"win":1},
  {"date":"2026-04-07","player":"卢老师","score":-1080,"win":-1},
  {"date":"2026-04-07","player":"杰仔","score":-4040,"win":-1},
  {"date":"2026-04-11","player":"茄","score":-1240,"win":-1},
  {"date":"2026-04-11","player":"润","score":4690,"win":1},
  {"date":"2026-04-11","player":"佳","score":2510,"win":1},
  {"date":"2026-04-11","player":"fafa","score":820,"win":1},
  {"date":"2026-04-11","player":"卢老师","score":-6780,"win":-1},
  {"date":"2026-04-12","player":"茄","score":-1530,"win":-1},
  {"date":"2026-04-12","player":"润","score":-2530,"win":-1},
  {"date":"2026-04-12","player":"佳","score":4780,"win":1},
  {"date":"2026-04-12","player":"谦","score":-3580,"win":-1},
  {"date":"2026-04-12","player":"达","score":2430,"win":1},
  {"date":"2026-04-12","player":"锦辉","score":2810,"win":1},
  {"date":"2026-04-12","player":"志","score":3550,"win":1},
  {"date":"2026-04-12","player":"fafa","score":2070,"win":1},
  {"date":"2026-04-12","player":"杰仔","score":-2000,"win":-1},
  {"date":"2026-04-12","player":"卢老师","score":-4000,"win":-1},
];
