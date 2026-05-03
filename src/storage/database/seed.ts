import { db } from "./drizzle"
import { seasons, gameSessions, pokerRecords, playerSettlements } from "./shared/schema"
import { SEED_SEASONS, SEED_SETTLEMENTS, SEED_RECORDS } from "@/lib/data"
import { eq, and, count } from "drizzle-orm"

export function isSeeded(): boolean {
  const result = db.select({ count: count() }).from(seasons).get()
  return (result?.count ?? 0) > 0
}

export function seedDatabase() {
  if (isSeeded()) {
    console.log("[seed] Database already seeded, skipping...")
    return
  }

  console.log("[seed] Seeding database...")

  const now = new Date().toISOString()

  for (const season of SEED_SEASONS) {
    db.insert(seasons).values({
      id: season.id,
      name: season.name,
      startDate: season.startDate,
      endDate: season.endDate || null,
      active: season.active,
      archived: !season.active,
      createdAt: now,
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
    db.insert(gameSessions).values({
      id: sessionId,
      date,
      seasonId,
      status: "confirmed",
      totalRecords: dateRecords.length,
      createdAt: now,
    }).onConflictDoNothing().run()

    for (const record of dateRecords) {
      db.insert(pokerRecords).values({
        date: record.date,
        seasonId,
        sessionId,
        player: record.player,
        score: record.score,
        win: record.win,
        status: "confirmed",
        createdAt: now,
      }).onConflictDoNothing().run()
    }
  }

  for (const settlement of SEED_SETTLEMENTS) {
    db.insert(playerSettlements).values({
      player: settlement.player,
      seasonId: settlement.seasonId,
      settleScore: settlement.settleScore,
      seasonAdjust: settlement.seasonAdjust,
      updatedAt: now,
    }).onConflictDoNothing().run()
  }

  console.log("[seed] Database seeded successfully!")
}
