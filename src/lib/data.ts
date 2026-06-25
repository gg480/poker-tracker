/**
 * @deprecated 此文件是 Phase 0 localStorage 遗留层。
 * 类型定义已于 Round 8 清理 -- 请使用 @/lib/types。
 * 工具函数（calcBalance、getRecordsForSeason 等）将在 Sprint 4 迁移到 @/services/。
 * 种子数据（SEED_RECORDS、SEED_SEASONS、SEED_SETTLEMENTS）暂保留于此。
 *
 * 迁移计划：https://github.com/.../issues/XX (FE-23)
 */
import { STORAGE_KEY_RECORDS, STORAGE_KEY_SEASONS, STORAGE_KEY_SETTLEMENTS, STORAGE_KEY_AI_CACHE } from '@/lib/constants'
import { safeGetItem, safeSetItem } from '@/lib/utils'
// Types now imported from @/lib/types (migrated Phase 0 → SQLite)
import type { PokerRecord, Season, PlayerSettlement, AICacheItem } from '@/lib/types'
import { SEED_SEASONS, SEED_SETTLEMENTS } from './seed-seasons';
import { SEED_RECORDS } from './seed-records';
export { SEED_SEASONS, SEED_SETTLEMENTS, SEED_RECORDS };

// Types re-exported from canonical types.ts for backward compatibility.
// New code should import from @/lib/types instead.
export type {
  PlayerStats,
  DailyBest,
  CumulativePoint,
  TrendPoint,
  ComputedStats,
} from './types';

/** 计算清分余额: balance = total_score - settle_score + season_adjust */
export function calcBalance(totalScore: number, settlement: PlayerSettlement | undefined): number {
  if (!settlement) return totalScore;
  return totalScore - settlement.settleScore + settlement.seasonAdjust;
}

/** 获取指定玩家在指定赛季的结算记录 */
export function getSettlementForPlayer(settlements: PlayerSettlement[], player: string, seasonId: string): PlayerSettlement | undefined {
  return settlements.find(s => s.player === player && s.seasonId === seasonId);
}

/** 获取指定赛季的所有结算记录 */
export function getSettlementsForSeason(settlements: PlayerSettlement[], seasonId: string): PlayerSettlement[] {
  return settlements.filter(s => s.seasonId === seasonId);
}

/** 获取指定玩家的所有结算记录 */
export function getSettlementsForPlayer(settlements: PlayerSettlement[], player: string): PlayerSettlement[] {
  return settlements.filter(s => s.player === player);
}

/** 计算玩家跨赛季的清分余额（所有赛季汇总） */
export function calcOverallBalance(totalScore: number, settlements: PlayerSettlement[], player: string): number {
  const playerSettlements = getSettlementsForPlayer(settlements, player);
  const totalSettle = playerSettlements.reduce((sum, s) => sum + s.settleScore, 0);
  const totalAdjust = playerSettlements.reduce((sum, s) => sum + s.seasonAdjust, 0);
  return totalScore - totalSettle + totalAdjust;
}

// ==================== STORAGE ====================
// 使用 Next.js API Routes 作为数据代理层
// SQLite 数据库通过 API Routes 访问

// Legacy localStorage Keys (降级备份) — defined in constants.ts
const STORAGE_KEY = STORAGE_KEY_RECORDS;
const SEASONS_KEY = STORAGE_KEY_SEASONS;
const SETTLEMENTS_KEY = STORAGE_KEY_SETTLEMENTS;
const AI_CACHE_KEY = STORAGE_KEY_AI_CACHE;

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
    const cached = safeGetItem<PokerRecord[]>(STORAGE_KEY);
    if (cached) return cached;
  }
  return [];
}

export async function saveRecords(records: PokerRecord[]): Promise<void> {
  if (typeof window === 'undefined') return;
  // 保存到 localStorage 作为本地缓存
  safeSetItem(STORAGE_KEY, records);
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
    const cached = safeGetItem<Season[]>(SEASONS_KEY);
    if (cached) return cached;
  }
  return [];
}

export async function saveSeasons(seasons: Season[]): Promise<void> {
  if (typeof window === 'undefined') return;
  safeSetItem(SEASONS_KEY, seasons);
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

export async function loadSettlements(): Promise<PlayerSettlement[]> {
  if (typeof window === 'undefined') return [];
  try {
    const data = await apiGet('/api/settlements') as Array<{ player: string; season_id: string; settle_score: number; season_adjust: number }>;
    return data.map(s => ({
      player: s.player,
      seasonId: s.season_id,
      settleScore: Number(s.settle_score),
      seasonAdjust: Number(s.season_adjust),
    }));
  } catch (e) {
    console.warn("Failed to load settlements from API, falling back to localStorage", e);
    const cached = safeGetItem<PlayerSettlement[]>(SETTLEMENTS_KEY);
    if (cached) return cached;
  }
  return SEED_SETTLEMENTS;
}

export async function saveSettlement(settlement: PlayerSettlement): Promise<void> {
  if (typeof window === 'undefined') return;
  // 更新 localStorage 缓存
  const list = safeGetItem<PlayerSettlement[]>(SETTLEMENTS_KEY) ?? [];
  const idx = list.findIndex(s => s.player === settlement.player && s.seasonId === settlement.seasonId);
  if (idx >= 0) {
    list[idx] = settlement;
  } else {
    list.push(settlement);
  }
  safeSetItem(SETTLEMENTS_KEY, list);
  // 同步到 SQLite
  try {
    await apiPost('/api/settlements', {
      player: settlement.player,
      season_id: settlement.seasonId,
      settle_score: settlement.settleScore,
      season_adjust: settlement.seasonAdjust,
    });
  } catch (e) {
    console.error("Failed to save settlement to API", e);
  }
}

export async function saveSettlements(settlements: PlayerSettlement[]): Promise<void> {
  if (typeof window === 'undefined') return;
  safeSetItem(SETTLEMENTS_KEY, settlements);
  for (const s of settlements) {
    try {
      await apiPost('/api/settlements', {
        player: s.player,
        season_id: s.seasonId,
        settle_score: s.settleScore,
        season_adjust: s.seasonAdjust,
      });
    } catch (e) {
      console.error("Failed to save settlement to API", e);
    }
  }
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
    const cached = safeGetItem<AICacheItem[]>(AI_CACHE_KEY);
    if (cached) return cached;
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
  // 也更新 localStorage，只保留最新3条
  const cache = safeGetItem<AICacheItem[]>(AI_CACHE_KEY) ?? [];
  const existingIndex = cache.findIndex(c => c.label === item.label);
  if (existingIndex >= 0) {
    cache[existingIndex] = item;
  } else {
    cache.unshift(item); // 新的放前面
  }
  // 只保留最新3条
  safeSetItem(AI_CACHE_KEY, cache.slice(0, 3));
}

export async function clearAICache(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    await fetch('/api/ai-cache', { method: 'DELETE' });
  } catch (e) {
    console.error("Failed to clear AI cache from API", e);
  }
  try { localStorage.removeItem(AI_CACHE_KEY); } catch {}
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

export function getClearsForSeason(clears: PlayerSettlement[], seasonId: string): PlayerSettlement[] {
  return clears.filter(c => c.seasonId === seasonId);
}

export function getPlayerClearedAmount(clears: PlayerSettlement[], player: string): { settleScore: number; seasonAdjust: number } {
  if (!clears) return { settleScore: 0, seasonAdjust: 0 };
  const playerSettlements = clears.filter(c => c.player === player);
  return {
    settleScore: playerSettlements.reduce((sum, c) => sum + c.settleScore, 0),
    seasonAdjust: playerSettlements.reduce((sum, c) => sum + c.seasonAdjust, 0),
  };
}

export function getPostClearBalance(totalScore: number, settlements: PlayerSettlement[], player: string): number {
  const { settleScore, seasonAdjust } = getPlayerClearedAmount(settlements, player);
  return totalScore - settleScore + seasonAdjust;
}
