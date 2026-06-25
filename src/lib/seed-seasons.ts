import type { Season, PlayerSettlement } from './types';

export const SEED_SEASONS: Season[] = [
  { id: 's1', name: '赛季1', startDate: '2025-10-25', endDate: '2026-04-11', active: false },
  { id: 's2', name: '赛季2', startDate: '2026-04-12', active: true },
];

export const SEED_SETTLEMENTS: PlayerSettlement[] = [
  { player: '佳', seasonId: 's1', settleScore: 0, seasonAdjust: -31190 },
  { player: '茄', seasonId: 's1', settleScore: 0, seasonAdjust: -16000 },
  { player: '锦辉', seasonId: 's1', settleScore: 0, seasonAdjust: -6120 },
  { player: 'fafa', seasonId: 's1', settleScore: 0, seasonAdjust: -4960 },
  { player: '卢老师', seasonId: 's1', settleScore: 0, seasonAdjust: -2870 },
  { player: '润年老表', seasonId: 's1', settleScore: 0, seasonAdjust: -2220 },
  { player: '谦', seasonId: 's1', settleScore: 0, seasonAdjust: -1110 },
  { player: '志', seasonId: 's1', settleScore: 0, seasonAdjust: 1070 },
  { player: '达', seasonId: 's1', settleScore: 0, seasonAdjust: 1560 },
  { player: '柱', seasonId: 's1', settleScore: 0, seasonAdjust: 3260 },
  { player: '楠', seasonId: 's1', settleScore: 0, seasonAdjust: 10550 },
  { player: '杰仔', seasonId: 's1', settleScore: 0, seasonAdjust: 14220 },
  { player: '润', seasonId: 's1', settleScore: 0, seasonAdjust: 33810 },
];
