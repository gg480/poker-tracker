import { db } from "./drizzle"
import { seasons, gameSessions, pokerRecords, playerSettlements } from "./shared/schema"
import { SEED_SEASONS, SEED_SETTLEMENTS, SEED_RECORDS } from "@/lib/data"
import { count, inArray } from "drizzle-orm"

export function isSeeded(): boolean {
  const result = db.select({ count: count() }).from(seasons).get()
  return (result?.count ?? 0) > 0
}

/**
 * Remove all seed data. Safe to call even when no seed data exists.
 * Returns the number of rows deleted across all tables.
 */
export function resetSeed(): {
  seasons: number
  gameSessions: number
  pokerRecords: number
  playerSettlements: number
} {
  const seasonIds = SEED_SEASONS.map((s) => s.id)
  const sessionIds = SEED_RECORDS.reduce<string[]>((acc, r) => {
    const sid = `gs-${r.date}`
    return acc.includes(sid) ? acc : [...acc, sid]
  }, [])

  const pokerResult = db.delete(pokerRecords).where(inArray(pokerRecords.sessionId, sessionIds)).run()
  const sessionResult = db.delete(gameSessions).where(inArray(gameSessions.id, sessionIds)).run()
  const settlementResult = db.delete(playerSettlements).where(inArray(playerSettlements.seasonId, seasonIds)).run()
  const seasonResult = db.delete(seasons).where(inArray(seasons.id, seasonIds)).run()

  return {
    seasons: seasonResult.changes,
    gameSessions: sessionResult.changes,
    pokerRecords: pokerResult.changes,
    playerSettlements: settlementResult.changes,
  }
}

export function seedDatabase() {
  if (isSeeded()) {
    console.log("[seed] Database already seeded, skipping...")
    return
  }

  console.log("[seed] Seeding database...")

  db.transaction((tx) => {
    const now = new Date().toISOString()

    for (const season of SEED_SEASONS) {
      tx.insert(seasons).values({
        id: season.id,
        name: season.name,
        startDate: season.startDate,
        endDate: season.endDate || null,
        active: season.active,
        archived: !season.active,
        createdAt: now,
        updatedAt: now,
      }).onConflictDoNothing().run()
    }

    const recordsByDate = new Map<string, typeof SEED_RECORDS>()
    for (const record of SEED_RECORDS) {
      const existing = recordsByDate.get(record.date) || []
      existing.push(record)
      recordsByDate.set(record.date, existing)
    }

    for (const [date, dateRecords] of recordsByDate) {
      const seasonId = date <= "2026-04-11" ? "s1" : "s2"

      const sessionId = `gs-${date}`
      tx.insert(gameSessions).values({
        id: sessionId,
        date,
        seasonId,
        status: "confirmed",
        totalRecords: dateRecords.length,
        totalScore: dateRecords.reduce((sum, r) => sum + r.score, 0),
        createdAt: now,
        updatedAt: now,
      }).onConflictDoNothing().run()

      for (const record of dateRecords) {
        tx.insert(pokerRecords).values({
          date: record.date,
          seasonId,
          sessionId,
          player: record.player,
          score: record.score,
          win: record.win,
          status: "confirmed",
          createdAt: now,
          updatedAt: now,
        }).run()
      }
    }

    for (const settlement of SEED_SETTLEMENTS) {
      tx.insert(playerSettlements).values({
        player: settlement.player,
        seasonId: settlement.seasonId,
        settleScore: settlement.settleScore,
        seasonAdjust: settlement.seasonAdjust,
        createdAt: now,
        updatedAt: now,
      }).onConflictDoNothing().run()
    }
  })

  console.log("[seed] Database seeded successfully!")
}
