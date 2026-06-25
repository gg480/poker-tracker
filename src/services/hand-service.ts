/**
 * @deprecated This service has no active consumers as of 2026-06-25. Keep for future use or remove if unused after 2026-09-25.
 */

import type { HandRecord } from "@/lib/types"
import {
  insertHandRecord,
  getAllHands,
  getHandsBySeason,
  getHandsBySession,
  getIncompleteHands as crudGetIncompleteHands,
  getHandsByCompleteStatus,
  updateHandRecord,
  deleteHandRecord as crudDeleteHand,
} from "@/storage/database/crud"

export function createHand(data: Omit<HandRecord, "id" | "createdAt">): HandRecord {
  const result = insertHandRecord({
    date: data.date,
    seasonId: data.seasonId,
    sessionId: data.sessionId ?? null,
    players: data.players,
    handType: data.handType ?? null,
    board: data.board ?? null,
    actions: data.actions ?? null,
    result: data.result ?? null,
    winner: data.winner ?? null,
    notes: data.notes ?? null,
    tags: data.tags ?? null,
    photo: data.photo ?? null,
    gtoAnalysis: data.gtoAnalysis ?? null,
    isComplete: data.isComplete ?? false,
    quickMode: data.quickMode ?? false,
  })
  return result as HandRecord
}

export function getHands(seasonId?: string, sessionId?: string, isComplete?: boolean): HandRecord[] {
  if (sessionId) return getHandsBySession(sessionId) as HandRecord[]
  if (isComplete !== undefined) return getHandsByCompleteStatus(isComplete, seasonId) as HandRecord[]
  if (seasonId) return getHandsBySeason(seasonId) as HandRecord[]
  // 修复 OP-12: 无参数时应返回全部手牌，而非用空字符串过滤（永远匹配不到）
  return getAllHands() as HandRecord[]
}

export function getIncompleteHands(seasonId?: string): HandRecord[] {
  return crudGetIncompleteHands(seasonId) as HandRecord[]
}

export function updateHand(id: string, data: Partial<HandRecord>): HandRecord {
  const result = updateHandRecord(id, data)
  return result as HandRecord
}

export function deleteHand(id: string): void {
  crudDeleteHand(id)
}
