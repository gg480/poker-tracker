import { eq, and, gte, lte, desc, sql } from "drizzle-orm"
import { db } from "./drizzle"
import {
  seasons,
  gameSessions,
  pokerRecords,
  playerSettlements,
  clearRecords,
  handRecords,
  awardRecords,
  aiCache,
} from "./shared/schema"

export type PokerRecordDB = typeof pokerRecords.$inferSelect
export type InsertPokerRecord = typeof pokerRecords.$inferInsert
export type SeasonDB = typeof seasons.$inferSelect
export type InsertSeason = typeof seasons.$inferInsert
export type GameSessionDB = typeof gameSessions.$inferSelect
export type InsertGameSession = typeof gameSessions.$inferInsert
export type PlayerSettlementDB = typeof playerSettlements.$inferSelect
export type InsertPlayerSettlement = typeof playerSettlements.$inferInsert
export type ClearRecordDB = typeof clearRecords.$inferSelect
export type InsertClearRecord = typeof clearRecords.$inferInsert
export type HandRecordDB = typeof handRecords.$inferSelect
export type InsertHandRecord = typeof handRecords.$inferInsert
export type AwardRecordDB = typeof awardRecords.$inferSelect
export type InsertAwardRecord = typeof awardRecords.$inferInsert
export type AICacheDB = typeof aiCache.$inferSelect
export type InsertAICache = typeof aiCache.$inferInsert

// ==================== Seasons ====================

export function getAllSeasons() {
  return db.select().from(seasons).orderBy(desc(seasons.startDate)).all()
}

export function getActiveSeasons() {
  return db.select().from(seasons).where(eq(seasons.active, true)).orderBy(desc(seasons.startDate)).all()
}

export function getSeasonById(id: string) {
  return db.select().from(seasons).where(eq(seasons.id, id)).get()
}

export function insertSeason(record: Omit<InsertSeason, "id" | "createdAt">) {
  return db.insert(seasons).values(record).returning().get()
}

export function updateSeason(id: string, updates: Partial<Omit<InsertSeason, "id" | "createdAt">>) {
  return db.update(seasons).set(updates).where(eq(seasons.id, id)).returning().get()
}

export function endSeasonById(id: string) {
  const today = new Date().toISOString().split("T")[0]
  return db
    .update(seasons)
    .set({ active: false, archived: true, endDate: today })
    .where(eq(seasons.id, id))
    .returning()
    .get()
}

// ==================== Game Sessions ====================

export function getAllSessions() {
  return db.select().from(gameSessions).orderBy(desc(gameSessions.date)).all()
}

export function getSessionsBySeason(seasonId: string) {
  return db
    .select()
    .from(gameSessions)
    .where(eq(gameSessions.seasonId, seasonId))
    .orderBy(desc(gameSessions.date))
    .all()
}

export function getSessionByDateAndSeason(date: string, seasonId: string) {
  return db
    .select()
    .from(gameSessions)
    .where(and(eq(gameSessions.date, date), eq(gameSessions.seasonId, seasonId)))
    .get()
}

export function getSessionById(id: string) {
  return db.select().from(gameSessions).where(eq(gameSessions.id, id)).get()
}

export function insertSession(record: Omit<InsertGameSession, "id" | "createdAt">) {
  return db.insert(gameSessions).values(record).returning().get()
}

export function updateSession(id: string, updates: Partial<Omit<InsertGameSession, "id" | "createdAt">>) {
  return db.update(gameSessions).set(updates).where(eq(gameSessions.id, id)).returning().get()
}

export function deleteSession(id: string) {
  db.delete(pokerRecords).where(eq(pokerRecords.sessionId, id)).run()
  return db.delete(gameSessions).where(eq(gameSessions.id, id)).returning().get()
}

// ==================== Poker Records ====================

export function getAllRecords() {
  return db.select().from(pokerRecords).orderBy(desc(pokerRecords.date)).all()
}

export function getRecordsByDateRange(startDate: string, endDate: string) {
  return db
    .select()
    .from(pokerRecords)
    .where(and(gte(pokerRecords.date, startDate), lte(pokerRecords.date, endDate)))
    .orderBy(desc(pokerRecords.date))
    .all()
}

export function getRecordsBySession(sessionId: string) {
  return db
    .select()
    .from(pokerRecords)
    .where(eq(pokerRecords.sessionId, sessionId))
    .orderBy(pokerRecords.player)
    .all()
}

export function getRecordsBySeason(seasonId: string) {
  return db
    .select()
    .from(pokerRecords)
    .where(eq(pokerRecords.seasonId, seasonId))
    .orderBy(desc(pokerRecords.date))
    .all()
}

export function insertRecord(record: Omit<InsertPokerRecord, "id" | "createdAt">) {
  return db.insert(pokerRecords).values(record).returning().get()
}

export function insertRecords(records: Omit<InsertPokerRecord, "id" | "createdAt">[]) {
  return db.insert(pokerRecords).values(records).returning().all()
}

export function deleteRecordsByDate(date: string) {
  return db.delete(pokerRecords).where(eq(pokerRecords.date, date)).run()
}

export function deleteRecordsBySession(sessionId: string) {
  return db.delete(pokerRecords).where(eq(pokerRecords.sessionId, sessionId)).run()
}

// ==================== Player Settlements ====================

export function getAllSettlements() {
  return db.select().from(playerSettlements).orderBy(playerSettlements.player).all()
}

export function getSettlementsBySeason(seasonId: string) {
  return db
    .select()
    .from(playerSettlements)
    .where(eq(playerSettlements.seasonId, seasonId))
    .orderBy(playerSettlements.player)
    .all()
}

export function getSettlementByPlayer(player: string, seasonId: string) {
  return db
    .select()
    .from(playerSettlements)
    .where(and(eq(playerSettlements.player, player), eq(playerSettlements.seasonId, seasonId)))
    .get()
}

export function upsertSettlement(
  record: Omit<InsertPlayerSettlement, "id" | "updatedAt"> & { id?: string }
) {
  const existing = record.player && record.seasonId
    ? getSettlementByPlayer(record.player, record.seasonId)
    : null

  if (existing) {
    return db
      .update(playerSettlements)
      .set({
        settleScore: record.settleScore,
        seasonAdjust: record.seasonAdjust,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(playerSettlements.id, existing.id))
      .returning()
      .get()
  }

  return db.insert(playerSettlements).values(record).returning().get()
}

// ==================== Clear Records ====================

export function getAllClears() {
  return db.select().from(clearRecords).orderBy(desc(clearRecords.date)).all()
}

export function getClearsBySeason(seasonId: string) {
  return db
    .select()
    .from(clearRecords)
    .where(eq(clearRecords.seasonId, seasonId))
    .orderBy(desc(clearRecords.date))
    .all()
}

export function insertClearRecord(record: Omit<InsertClearRecord, "id" | "createdAt">) {
  return db.insert(clearRecords).values(record).returning().get()
}

// ==================== Hand Records ====================

export function getAllHands() {
  return db.select().from(handRecords).orderBy(desc(handRecords.date)).all()
}

export function getHandsBySession(sessionId: string) {
  return db
    .select()
    .from(handRecords)
    .where(eq(handRecords.sessionId, sessionId))
    .orderBy(desc(handRecords.createdAt))
    .all()
}

export function getHandsBySeason(seasonId: string) {
  return db
    .select()
    .from(handRecords)
    .where(eq(handRecords.seasonId, seasonId))
    .orderBy(desc(handRecords.date))
    .all()
}

export function getIncompleteHands(seasonId?: string) {
  if (seasonId) {
    return db
      .select()
      .from(handRecords)
      .where(and(eq(handRecords.seasonId, seasonId), eq(handRecords.isComplete, false)))
      .orderBy(desc(handRecords.createdAt))
      .all()
  }
  return db
    .select()
    .from(handRecords)
    .where(eq(handRecords.isComplete, false))
    .orderBy(desc(handRecords.createdAt))
    .all()
}

export function getHandsByCompleteStatus(isComplete: boolean, seasonId?: string) {
  if (seasonId) {
    return db
      .select()
      .from(handRecords)
      .where(and(eq(handRecords.seasonId, seasonId), eq(handRecords.isComplete, isComplete)))
      .orderBy(desc(handRecords.date))
      .all()
  }
  return db
    .select()
    .from(handRecords)
    .where(eq(handRecords.isComplete, isComplete))
    .orderBy(desc(handRecords.date))
    .all()
}

export function insertHandRecord(record: Omit<InsertHandRecord, "id" | "createdAt">) {
  return db.insert(handRecords).values(record).returning().get()
}

export function updateHandRecord(id: string, updates: Partial<Omit<InsertHandRecord, "id" | "createdAt">>) {
  return db.update(handRecords).set(updates).where(eq(handRecords.id, id)).returning().get()
}

export function deleteHandRecord(id: string) {
  return db.delete(handRecords).where(eq(handRecords.id, id)).returning().get()
}

// ==================== Award Records ====================

export function getAwardsBySeason(seasonId: string) {
  return db
    .select()
    .from(awardRecords)
    .where(eq(awardRecords.seasonId, seasonId))
    .orderBy(awardRecords.awardType)
    .all()
}

export function insertAwardRecord(record: Omit<InsertAwardRecord, "id" | "createdAt">) {
  return db.insert(awardRecords).values(record).returning().get()
}

export function insertAwardRecords(records: Omit<InsertAwardRecord, "id" | "createdAt">[]) {
  return db.insert(awardRecords).values(records).returning().all()
}

// ==================== AI Cache ====================

export function getAllAICache() {
  return db.select().from(aiCache).orderBy(desc(aiCache.createdAt)).all()
}

export function insertAICache(record: Omit<InsertAICache, "id" | "createdAt">) {
  return db.insert(aiCache).values(record).returning().get()
}

export function updateAICache(id: string, result: string) {
  return db
    .update(aiCache)
    .set({ result, time: new Date().toISOString() })
    .where(eq(aiCache.id, id))
    .returning()
    .get()
}

export function findAICacheByLabel(label: string) {
  return db.select().from(aiCache).where(eq(aiCache.label, label)).get()
}

export function trimAICache(keepCount: number = 3) {
  const all = db.select({ id: aiCache.id }).from(aiCache).orderBy(desc(aiCache.createdAt)).all()
  if (all.length <= keepCount) return 0
  const idsToDelete = all.slice(keepCount).map((r) => r.id)
  for (const id of idsToDelete) {
    db.delete(aiCache).where(eq(aiCache.id, id)).run()
  }
  return idsToDelete.length
}
