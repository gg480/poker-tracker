import { relations } from "drizzle-orm/relations"
import {
  seasons,
  gameSessions,
  pokerRecords,
  playerSettlements,
  clearRecords,
  handRecords,
  awardRecords,
} from "./schema"
import { coachSessions, coachDecisions, coachFeedback } from "./coach-schema"

export const seasonsRelations = relations(seasons, ({ many }) => ({
  gameSessions: many(gameSessions),
  pokerRecords: many(pokerRecords),
  playerSettlements: many(playerSettlements),
  clearRecords: many(clearRecords),
  handRecords: many(handRecords),
  awardRecords: many(awardRecords),
}))

export const gameSessionsRelations = relations(gameSessions, ({ one, many }) => ({
  season: one(seasons, {
    fields: [gameSessions.seasonId],
    references: [seasons.id],
  }),
  pokerRecords: many(pokerRecords),
  handRecords: many(handRecords),
}))

export const pokerRecordsRelations = relations(pokerRecords, ({ one }) => ({
  season: one(seasons, {
    fields: [pokerRecords.seasonId],
    references: [seasons.id],
  }),
  session: one(gameSessions, {
    fields: [pokerRecords.sessionId],
    references: [gameSessions.id],
  }),
}))

export const playerSettlementsRelations = relations(playerSettlements, ({ one }) => ({
  season: one(seasons, {
    fields: [playerSettlements.seasonId],
    references: [seasons.id],
  }),
}))

export const clearRecordsRelations = relations(clearRecords, ({ one }) => ({
  season: one(seasons, {
    fields: [clearRecords.seasonId],
    references: [seasons.id],
  }),
}))

export const handRecordsRelations = relations(handRecords, ({ one }) => ({
  season: one(seasons, {
    fields: [handRecords.seasonId],
    references: [seasons.id],
  }),
  session: one(gameSessions, {
    fields: [handRecords.sessionId],
    references: [gameSessions.id],
  }),
}))

export const awardRecordsRelations = relations(awardRecords, ({ one }) => ({
  season: one(seasons, {
    fields: [awardRecords.seasonId],
    references: [seasons.id],
  }),
}))

export const coachSessionsRelations = relations(coachSessions, ({ many }) => ({
  decisions: many(coachDecisions),
  feedback: many(coachFeedback),
}))

export const coachDecisionsRelations = relations(coachDecisions, ({ one, many }) => ({
  session: one(coachSessions, {
    fields: [coachDecisions.sessionId],
    references: [coachSessions.id],
  }),
  feedback: many(coachFeedback),
}))

export const coachFeedbackRelations = relations(coachFeedback, ({ one }) => ({
  session: one(coachSessions, {
    fields: [coachFeedback.sessionId],
    references: [coachSessions.id],
  }),
  decision: one(coachDecisions, {
    fields: [coachFeedback.decisionId],
    references: [coachDecisions.id],
  }),
}))
