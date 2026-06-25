import { describe, it, expect } from 'vitest';
import { calcBalance, getSettlementForPlayer, getSettlementsForSeason, calcOverallBalance } from '@/lib/data';
import type { PlayerSettlement } from '@/lib/types';

describe('calcBalance', () => {
  it('should return totalScore when no settlement', () => {
    expect(calcBalance(1000, undefined)).toBe(1000);
  });

  it('should calculate balance correctly with positive settleScore', () => {
    const settlement: PlayerSettlement = {
      player: '佳',
      seasonId: 's1',
      settleScore: 500,
      seasonAdjust: 0,
    };
    expect(calcBalance(1000, settlement)).toBe(500);
  });

  it('should calculate balance with seasonAdjust', () => {
    const settlement: PlayerSettlement = {
      player: '佳',
      seasonId: 's1',
      settleScore: 1000,
      seasonAdjust: -500,
    };
    expect(calcBalance(1000, settlement)).toBe(-500);
  });
});

describe('getSettlementForPlayer', () => {
  const settlements: PlayerSettlement[] = [
    { player: '佳', seasonId: 's1', settleScore: 0, seasonAdjust: -31190 },
    { player: '茄', seasonId: 's1', settleScore: 0, seasonAdjust: -16000 },
    { player: '佳', seasonId: 's2', settleScore: 0, seasonAdjust: 0 },
  ];

  it('should find settlement for existing player and season', () => {
    const result = getSettlementForPlayer(settlements, '佳', 's1');
    expect(result).not.toBeUndefined();
    expect(result?.player).toBe('佳');
    expect(result?.seasonId).toBe('s1');
    expect(result?.seasonAdjust).toBe(-31190);
  });

  it('should return undefined for non-existing player', () => {
    const result = getSettlementForPlayer(settlements, '不存在', 's1');
    expect(result).toBeUndefined();
  });

  it('should return undefined for non-existing season', () => {
    const result = getSettlementForPlayer(settlements, '佳', 's3');
    expect(result).toBeUndefined();
  });
});

describe('getSettlementsForSeason', () => {
  const settlements: PlayerSettlement[] = [
    { player: '佳', seasonId: 's1', settleScore: 0, seasonAdjust: -31190 },
    { player: '茄', seasonId: 's1', settleScore: 0, seasonAdjust: -16000 },
    { player: '佳', seasonId: 's2', settleScore: 0, seasonAdjust: 0 },
    { player: '茄', seasonId: 's2', settleScore: 0, seasonAdjust: 0 },
  ];

  it('should return settlements for specified season', () => {
    const result = getSettlementsForSeason(settlements, 's1');
    expect(result.length).toBe(2);
    expect(result.every(s => s.seasonId === 's1')).toBe(true);
  });

  it('should return empty array for non-existing season', () => {
    const result = getSettlementsForSeason(settlements, 's3');
    expect(result).toEqual([]);
  });
});

describe('calcOverallBalance', () => {
  const settlements: PlayerSettlement[] = [
    { player: '佳', seasonId: 's1', settleScore: 1000, seasonAdjust: -500 },
    { player: '佳', seasonId: 's2', settleScore: 500, seasonAdjust: 200 },
    { player: '茄', seasonId: 's1', settleScore: 2000, seasonAdjust: 0 },
  ];

  it('should calculate overall balance across seasons', () => {
    const result = calcOverallBalance(3000, settlements, '佳');
    expect(result).toBe(3000 - (1000 + 500) + (-500 + 200));
    expect(result).toBe(1200);
  });

  it('should return totalScore when no settlements for player', () => {
    const result = calcOverallBalance(1000, settlements, '不存在');
    expect(result).toBe(1000);
  });

  it('should handle empty settlements', () => {
    const result = calcOverallBalance(500, [], '佳');
    expect(result).toBe(500);
  });
});
