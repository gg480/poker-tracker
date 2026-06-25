import { eq, and, gte, lte, desc, asc, count, inArray, sql } from "drizzle-orm"
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
  importLog,
} from "./shared/schema"
import {
  coachSessions,
  coachDecisions,
  coachFeedback,
} from "./shared/coach-schema"

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
export type ImportLogDB = typeof importLog.$inferSelect
export type InsertImportLog = typeof importLog.$inferInsert
export type CoachSessionDB = typeof coachSessions.$inferSelect
export type InsertCoachSession = typeof coachSessions.$inferInsert
export type CoachDecisionDB = typeof coachDecisions.$inferSelect
export type InsertCoachDecision = typeof coachDecisions.$inferInsert
export type CoachFeedbackDB = typeof coachFeedback.$inferSelect
export type InsertCoachFeedback = typeof coachFeedback.$inferInsert

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

export function updateSeason(id: string, updates: Partial<Omit<InsertSeason, "id" | "createdAt" | "updatedAt">>) {
  return db.update(seasons).set({ ...updates, updatedAt: new Date().toISOString() }).where(eq(seasons.id, id)).returning().get()
}

export function deleteSeason(id: string) {
  // FK onDelete: cascade handles child records (awardRecords, clearRecords,
  // playerSettlements, pokerRecords, handRecords, gameSessions)
  return db.delete(seasons).where(eq(seasons.id, id)).returning().get()
}

export function endSeasonById(id: string) {
  const today = new Date().toISOString().split("T")[0]
  return db
    .update(seasons)
    .set({ active: false, archived: true, endDate: today, updatedAt: new Date().toISOString() })
    .where(eq(seasons.id, id))
    .returning()
    .get()
}

export function getAllSeasonsPaginated(page: number = 1, limit: number = 50) {
  const offset = (page - 1) * limit
  const total = db.select({ value: count() }).from(seasons).get()?.value ?? 0
  const items = db
    .select()
    .from(seasons)
    .orderBy(desc(seasons.startDate))
    .limit(limit)
    .offset(offset)
    .all()
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) }
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

export function updateSession(id: string, updates: Partial<Omit<InsertGameSession, "id" | "createdAt" | "updatedAt">>) {
  return db.update(gameSessions).set({ ...updates, updatedAt: new Date().toISOString() }).where(eq(gameSessions.id, id)).returning().get()
}

export function deleteSession(id: string) {
  // FK onDelete: cascade handles pokerRecords and handRecords
  return db.delete(gameSessions).where(eq(gameSessions.id, id)).returning().get()
}

export function getSessionsPaginated(seasonId?: string, page: number = 1, limit: number = 50) {
  const offset = (page - 1) * limit
  const conditions = seasonId ? [eq(gameSessions.seasonId, seasonId)] : []
  const where = conditions.length > 0 ? and(...conditions) : undefined

  const total = db
    .select({ value: count() })
    .from(gameSessions)
    .where(where)
    .get()?.value ?? 0
  const items = db
    .select()
    .from(gameSessions)
    .where(where)
    .orderBy(desc(gameSessions.date))
    .limit(limit)
    .offset(offset)
    .all()
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) }
}

/**
 * Recalculate gameSessions.totalRecords and totalScore from the source of truth
 * (pokerRecords table), bringing the denormalized cache back in sync.
 *
 * Called automatically by insertRecord, insertRecords, updatePokerRecord,
 * deletePokerRecord, deleteRecordsBySession, and deleteRecordsByDate.
 */
function syncSessionCounters(sessionId: string) {
  const agg = db
    .select({
      totalRecords: sql<number>`count(*)`,
      totalScore: sql<number>`coalesce(sum(${pokerRecords.score}), 0)`,
    })
    .from(pokerRecords)
    .where(eq(pokerRecords.sessionId, sessionId))
    .get()

  db.update(gameSessions)
    .set({
      totalRecords: agg?.totalRecords ?? 0,
      totalScore: agg?.totalScore ?? 0,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(gameSessions.id, sessionId))
    .run()
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
  const result = db.insert(pokerRecords).values(record).returning().get()
  if (result.sessionId) {
    syncSessionCounters(result.sessionId)
  }
  return result
}

export function insertRecords(records: Omit<InsertPokerRecord, "id" | "createdAt">[]) {
  const result = db.insert(pokerRecords).values(records).returning().all()
  const sessionIds = [...new Set(result.map((r) => r.sessionId).filter(Boolean) as string[])]
  for (const sessionId of sessionIds) {
    syncSessionCounters(sessionId)
  }
  return result
}

export function deleteRecordsByDate(date: string) {
  // Capture affected sessionIds before deleting, so we can sync counters
  const affectedSessions = db
    .select({ sessionId: pokerRecords.sessionId })
    .from(pokerRecords)
    .where(eq(pokerRecords.date, date))
    .all()
    .map((r) => r.sessionId)
    .filter(Boolean) as string[]

  const uniqueSessionIds = [...new Set(affectedSessions)]

  const result = db.delete(pokerRecords).where(eq(pokerRecords.date, date)).run()

  for (const sessionId of uniqueSessionIds) {
    syncSessionCounters(sessionId)
  }

  return result
}

export function deleteRecordsBySession(sessionId: string) {
  const result = db.delete(pokerRecords).where(eq(pokerRecords.sessionId, sessionId)).run()
  db.update(gameSessions)
    .set({ totalRecords: 0, totalScore: 0, updatedAt: new Date().toISOString() })
    .where(eq(gameSessions.id, sessionId))
    .run()
  return result
}

export function updatePokerRecord(id: string, updates: Partial<Omit<InsertPokerRecord, "id" | "createdAt" | "updatedAt">>) {
  const result = db.update(pokerRecords).set({ ...updates, updatedAt: new Date().toISOString() }).where(eq(pokerRecords.id, id)).returning().get()
  if (result?.sessionId) {
    syncSessionCounters(result.sessionId)
  }
  return result
}

export function getPokerRecordById(id: string) {
  return db.select().from(pokerRecords).where(eq(pokerRecords.id, id)).get()
}

export function deletePokerRecord(id: string) {
  const record = getPokerRecordById(id)
  const result = db.delete(pokerRecords).where(eq(pokerRecords.id, id)).returning().get()
  if (record?.sessionId) {
    syncSessionCounters(record.sessionId)
  }
  return result
}

export function getRecordsPaginated(
  options: { seasonId?: string; sessionId?: string; startDate?: string; endDate?: string },
  page: number = 1,
  limit: number = 50
) {
  const offset = (page - 1) * limit
  const conditions: ReturnType<typeof eq>[] = []

  if (options.sessionId) {
    conditions.push(eq(pokerRecords.sessionId, options.sessionId))
  }
  if (options.seasonId) {
    conditions.push(eq(pokerRecords.seasonId, options.seasonId))
  }
  if (options.startDate) {
    conditions.push(gte(pokerRecords.date, options.startDate))
  }
  if (options.endDate) {
    conditions.push(lte(pokerRecords.date, options.endDate))
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined

  const total = db
    .select({ value: count() })
    .from(pokerRecords)
    .where(where)
    .get()?.value ?? 0
  const items = db
    .select()
    .from(pokerRecords)
    .where(where)
    .orderBy(desc(pokerRecords.date))
    .limit(limit)
    .offset(offset)
    .all()
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) }
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
  record: Omit<InsertPlayerSettlement, "id" | "updatedAt">
) {
  return db
    .insert(playerSettlements)
    .values(record)
    .onConflictDoUpdate({
      target: [playerSettlements.player, playerSettlements.seasonId],
      set: {
        settleScore: record.settleScore,
        seasonAdjust: record.seasonAdjust ?? 0,
        updatedAt: new Date().toISOString(),
      },
    })
    .returning()
    .get()
}

export function updateSettlement(
  id: string,
  updates: Partial<Pick<InsertPlayerSettlement, "player" | "seasonId" | "settleScore" | "seasonAdjust">>
) {
  return db
    .update(playerSettlements)
    .set({ ...updates, updatedAt: new Date().toISOString() })
    .where(eq(playerSettlements.id, id))
    .returning()
    .get()
}

export function getSettlementsPaginated(seasonId?: string, page: number = 1, limit: number = 50) {
  const offset = (page - 1) * limit
  const conditions = seasonId ? [eq(playerSettlements.seasonId, seasonId)] : []
  const where = conditions.length > 0 ? and(...conditions) : undefined

  const total = db
    .select({ value: count() })
    .from(playerSettlements)
    .where(where)
    .get()?.value ?? 0
  const items = db
    .select()
    .from(playerSettlements)
    .where(where)
    .orderBy(playerSettlements.player)
    .limit(limit)
    .offset(offset)
    .all()
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) }
}

export function deleteSettlement(id: string) {
  return db.delete(playerSettlements).where(eq(playerSettlements.id, id)).returning().get()
}

export function getSettlementById(id: string) {
  return db.select().from(playerSettlements).where(eq(playerSettlements.id, id)).get()
}

export function deleteSettlementsBySeason(seasonId: string) {
  return db.delete(playerSettlements).where(eq(playerSettlements.seasonId, seasonId)).run()
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

export function insertClearRecords(records: Omit<InsertClearRecord, "id" | "createdAt">[]) {
  return db.insert(clearRecords).values(records).returning().all()
}

export function deleteClearRecord(id: string) {
  return db.delete(clearRecords).where(eq(clearRecords.id, id)).returning().get()
}

export function deleteClearsBySeason(seasonId: string) {
  return db.delete(clearRecords).where(eq(clearRecords.seasonId, seasonId)).run()
}

export function updateClearRecord(id: string, updates: Partial<Omit<InsertClearRecord, "id" | "createdAt" | "updatedAt">>) {
  return db.update(clearRecords).set({ ...updates, updatedAt: new Date().toISOString() }).where(eq(clearRecords.id, id)).returning().get()
}

export function getClearRecordById(id: string) {
  return db.select().from(clearRecords).where(eq(clearRecords.id, id)).get()
}

export function getClearsPaginated(seasonId?: string, page: number = 1, limit: number = 50) {
  const offset = (page - 1) * limit
  const conditions = seasonId ? [eq(clearRecords.seasonId, seasonId)] : []
  const where = conditions.length > 0 ? and(...conditions) : undefined

  const total = db
    .select({ value: count() })
    .from(clearRecords)
    .where(where)
    .get()?.value ?? 0
  const items = db
    .select()
    .from(clearRecords)
    .where(where)
    .orderBy(desc(clearRecords.date))
    .limit(limit)
    .offset(offset)
    .all()
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) }
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

export function insertHandRecords(records: Omit<InsertHandRecord, "id" | "createdAt">[]) {
  return db.insert(handRecords).values(records).returning().all()
}

export function updateHandRecord(id: string, updates: Partial<Omit<InsertHandRecord, "id" | "createdAt" | "updatedAt">>) {
  return db.update(handRecords).set({ ...updates, updatedAt: new Date().toISOString() }).where(eq(handRecords.id, id)).returning().get()
}

export function getHandRecordById(id: string) {
  return db.select().from(handRecords).where(eq(handRecords.id, id)).get()
}

export function deleteHandRecord(id: string) {
  return db.delete(handRecords).where(eq(handRecords.id, id)).returning().get()
}

export function getHandsPaginated(
  options: { seasonId?: string; sessionId?: string; isComplete?: boolean },
  page: number = 1,
  limit: number = 50
) {
  const offset = (page - 1) * limit
  const conditions: ReturnType<typeof eq>[] = []

  if (options.sessionId) {
    conditions.push(eq(handRecords.sessionId, options.sessionId))
  }
  if (options.seasonId) {
    conditions.push(eq(handRecords.seasonId, options.seasonId))
  }
  if (options.isComplete !== undefined) {
    conditions.push(eq(handRecords.isComplete, options.isComplete))
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined

  const total = db
    .select({ value: count() })
    .from(handRecords)
    .where(where)
    .get()?.value ?? 0
  const items = db
    .select()
    .from(handRecords)
    .where(where)
    .orderBy(desc(handRecords.date))
    .limit(limit)
    .offset(offset)
    .all()
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) }
}

// ==================== Award Records ====================

export function getAllAwards() {
  return db.select().from(awardRecords).orderBy(desc(awardRecords.createdAt)).all()
}

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

export function deleteAwardRecord(id: string) {
  return db.delete(awardRecords).where(eq(awardRecords.id, id)).returning().get()
}

export function deleteAwardRecordsBySeason(seasonId: string) {
  return db.delete(awardRecords).where(eq(awardRecords.seasonId, seasonId)).run()
}

export function updateAwardRecord(id: string, updates: Partial<Omit<InsertAwardRecord, "id" | "createdAt" | "updatedAt">>) {
  return db.update(awardRecords).set({ ...updates, updatedAt: new Date().toISOString() }).where(eq(awardRecords.id, id)).returning().get()
}

export function getAwardRecordById(id: string) {
  return db.select().from(awardRecords).where(eq(awardRecords.id, id)).get()
}

export function getAwardsPaginated(seasonId?: string, page: number = 1, limit: number = 50) {
  const offset = (page - 1) * limit
  const conditions = seasonId ? [eq(awardRecords.seasonId, seasonId)] : []
  const where = conditions.length > 0 ? and(...conditions) : undefined

  const total = db
    .select({ value: count() })
    .from(awardRecords)
    .where(where)
    .get()?.value ?? 0
  const items = db
    .select()
    .from(awardRecords)
    .where(where)
    .orderBy(awardRecords.awardType)
    .limit(limit)
    .offset(offset)
    .all()
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) }
}

// ==================== AI Cache ====================

export function getAllAICache() {
  return db.select().from(aiCache).orderBy(desc(aiCache.createdAt)).all()
}

export function getAICachePaginated(page: number = 1, limit: number = 50) {
  const offset = (page - 1) * limit
  const total = db.select({ value: count() }).from(aiCache).get()?.value ?? 0
  const items = db
    .select()
    .from(aiCache)
    .orderBy(desc(aiCache.createdAt))
    .limit(limit)
    .offset(offset)
    .all()
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) }
}

export function insertAICache(record: Omit<InsertAICache, "id" | "createdAt">) {
  return db.insert(aiCache).values(record).returning().get()
}

export function updateAICache(id: string, result: string) {
  return db
    .update(aiCache)
    .set({ result, time: new Date().toISOString(), updatedAt: new Date().toISOString() })
    .where(eq(aiCache.id, id))
    .returning()
    .get()
}

export function findAICacheByLabel(label: string) {
  return db.select().from(aiCache).where(eq(aiCache.label, label)).get()
}

export function getAICacheById(id: string) {
  return db.select().from(aiCache).where(eq(aiCache.id, id)).get()
}

export function deleteAICache(id: string) {
  return db.delete(aiCache).where(eq(aiCache.id, id)).returning().get()
}

export function trimAICache(keepCount: number = 3) {
  const all = db.select({ id: aiCache.id }).from(aiCache).orderBy(desc(aiCache.createdAt)).all()
  if (all.length <= keepCount) return 0
  const idsToDelete = all.slice(keepCount).map((r) => r.id)
  db.delete(aiCache).where(inArray(aiCache.id, idsToDelete)).run()
  return idsToDelete.length
}

// ==================== Coach Sessions ====================

export function getCoachSessions(options?: {
  status?: string
  page?: number
  limit?: number
}) {
  const page = options?.page ?? 1
  const limit = options?.limit ?? 20
  const offset = (page - 1) * limit

  const conditions = []
  if (options?.status) {
    conditions.push(eq(coachSessions.status, options.status))
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined

  const total = db
    .select({ value: count() })
    .from(coachSessions)
    .where(where)
    .get()?.value ?? 0

  const items = db
    .select()
    .from(coachSessions)
    .where(where)
    .orderBy(desc(coachSessions.createdAt))
    .limit(limit)
    .offset(offset)
    .all()

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

export function getCoachSessionById(id: string) {
  return db.select().from(coachSessions).where(eq(coachSessions.id, id)).get()
}

export function insertCoachSession(record: Omit<InsertCoachSession, "id" | "createdAt">) {
  return db.insert(coachSessions).values(record).returning().get()
}

export function updateCoachSession(
  id: string,
  updates: Partial<Omit<InsertCoachSession, "id" | "createdAt" | "updatedAt">>
) {
  return db
    .update(coachSessions)
    .set({ ...updates, updatedAt: new Date().toISOString() })
    .where(eq(coachSessions.id, id))
    .returning()
    .get()
}

export function deleteCoachSession(id: string) {
  // FK onDelete: cascade handles coachDecisions and coachFeedback
  return db.delete(coachSessions).where(eq(coachSessions.id, id)).returning().get()
}

// ==================== Coach Decisions ====================

export function getDecisionsBySession(sessionId: string) {
  return db
    .select()
    .from(coachDecisions)
    .where(eq(coachDecisions.sessionId, sessionId))
    .orderBy(asc(coachDecisions.handNumber), asc(coachDecisions.createdAt))
    .all()
}

export function getDecisionById(id: string) {
  return db.select().from(coachDecisions).where(eq(coachDecisions.id, id)).get()
}

export function insertCoachDecision(record: Omit<InsertCoachDecision, "id" | "createdAt">) {
  return db.insert(coachDecisions).values(record).returning().get()
}

export function insertCoachDecisions(records: Omit<InsertCoachDecision, "id" | "createdAt">[]) {
  return db.insert(coachDecisions).values(records).returning().all()
}

export function deleteDecisionsBySession(sessionId: string) {
  return db.delete(coachDecisions).where(eq(coachDecisions.sessionId, sessionId)).run()
}

export function getDecisionsPaginated(sessionId: string, page: number = 1, limit: number = 50) {
  const offset = (page - 1) * limit

  const total = db
    .select({ value: count() })
    .from(coachDecisions)
    .where(eq(coachDecisions.sessionId, sessionId))
    .get()?.value ?? 0
  const items = db
    .select()
    .from(coachDecisions)
    .where(eq(coachDecisions.sessionId, sessionId))
    .orderBy(asc(coachDecisions.handNumber), asc(coachDecisions.createdAt))
    .limit(limit)
    .offset(offset)
    .all()
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) }
}

export function getDecisionsByHand(sessionId: string, handNumber: number) {
  return db
    .select()
    .from(coachDecisions)
    .where(
      and(
        eq(coachDecisions.sessionId, sessionId),
        eq(coachDecisions.handNumber, handNumber)
      )
    )
    .orderBy(asc(coachDecisions.createdAt))
    .all()
}

export function deleteCoachDecision(id: string) {
  return db.delete(coachDecisions).where(eq(coachDecisions.id, id)).returning().get()
}

export function updateCoachDecision(
  id: string,
  updates: Partial<Omit<InsertCoachDecision, "id" | "createdAt" | "updatedAt">>
) {
  return db
    .update(coachDecisions)
    .set({ ...updates, updatedAt: new Date().toISOString() })
    .where(eq(coachDecisions.id, id))
    .returning()
    .get()
}

// ==================== Coach Feedback ====================

export function insertCoachFeedback(record: Omit<InsertCoachFeedback, "id" | "createdAt">) {
  return db.insert(coachFeedback).values(record).returning().get()
}

export function getFeedbackBySession(sessionId: string) {
  return db
    .select()
    .from(coachFeedback)
    .where(eq(coachFeedback.sessionId, sessionId))
    .orderBy(desc(coachFeedback.createdAt))
    .all()
}

export function getFeedbackByDecision(decisionId: string) {
  return db
    .select()
    .from(coachFeedback)
    .where(eq(coachFeedback.decisionId, decisionId))
    .get()
}

export function getCoachFeedbackById(id: string) {
  return db.select().from(coachFeedback).where(eq(coachFeedback.id, id)).get()
}

export function deleteCoachFeedback(id: string) {
  return db.delete(coachFeedback).where(eq(coachFeedback.id, id)).returning().get()
}

export function deleteFeedbackBySession(sessionId: string) {
  return db.delete(coachFeedback).where(eq(coachFeedback.sessionId, sessionId)).run()
}

export function updateCoachFeedback(
  id: string,
  updates: Partial<Omit<InsertCoachFeedback, "id" | "createdAt" | "updatedAt">>
) {
  return db
    .update(coachFeedback)
    .set({ ...updates, updatedAt: new Date().toISOString() })
    .where(eq(coachFeedback.id, id))
    .returning()
    .get()
}

// ==================== Import Log ====================

export function getImportLogByHash(fileHash: string) {
  return db.select().from(importLog).where(eq(importLog.fileHash, fileHash)).get()
}

export function getAllImportLogs() {
  return db.select().from(importLog).orderBy(desc(importLog.importedAt)).all()
}

export function insertImportLog(record: Omit<InsertImportLog, "id" | "importedAt">) {
  return db.insert(importLog).values(record).returning().get()
}

export function updateImportLog(id: string, updates: Partial<Omit<InsertImportLog, "id" | "importedAt">>) {
  return db.update(importLog).set({ ...updates, updatedAt: new Date().toISOString() }).where(eq(importLog.id, id)).returning().get()
}

export function getImportLogById(id: string) {
  return db.select().from(importLog).where(eq(importLog.id, id)).get()
}

export function deleteImportLog(id: string) {
  return db.delete(importLog).where(eq(importLog.id, id)).run()
}

export function getImportLogsPaginated(page: number = 1, limit: number = 50) {
  const offset = (page - 1) * limit
  const total = db.select({ value: count() }).from(importLog).get()?.value ?? 0
  const items = db
    .select()
    .from(importLog)
    .orderBy(desc(importLog.importedAt))
    .limit(limit)
    .offset(offset)
    .all()
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) }
}
