import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core"
import { sql } from "drizzle-orm"

function generateId(): string {
  return crypto.randomUUID()
}

export const seasons = sqliteTable(
  "seasons",
  {
    id: text("id").primaryKey().$defaultFn(() => generateId()),
    name: text("name", { length: 50 }).notNull(),
    startDate: text("start_date", { length: 10 }).notNull(),
    endDate: text("end_date", { length: 10 }),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    archived: integer("archived", { mode: "boolean" }).notNull().default(false),
    createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    index("seasons_active_idx").on(table.active),
    index("seasons_date_range_idx").on(table.startDate, table.endDate),
  ]
)

export const gameSessions = sqliteTable(
  "game_sessions",
  {
    id: text("id").primaryKey().$defaultFn(() => generateId()),
    date: text("date", { length: 10 }).notNull(),
    seasonId: text("season_id").notNull().references(() => seasons.id),
    status: text("status", { length: 20 }).notNull().default("pending"),
    totalRecords: integer("total_records").notNull().default(0),
    createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    index("game_sessions_date_idx").on(table.date),
    index("game_sessions_season_idx").on(table.seasonId),
    index("game_sessions_status_idx").on(table.status),
  ]
)

export const pokerRecords = sqliteTable(
  "poker_records",
  {
    id: text("id").primaryKey().$defaultFn(() => generateId()),
    date: text("date", { length: 10 }).notNull(),
    seasonId: text("season_id").notNull().references(() => seasons.id),
    sessionId: text("session_id").references(() => gameSessions.id),
    player: text("player", { length: 50 }).notNull(),
    score: integer("score").notNull(),
    win: integer("win").notNull(),
    status: text("status", { length: 20 }).notNull().default("pending"),
    createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    index("poker_records_date_idx").on(table.date),
    index("poker_records_player_idx").on(table.player),
    index("poker_records_season_idx").on(table.seasonId),
    index("poker_records_session_idx").on(table.sessionId),
  ]
)

export const playerSettlements = sqliteTable(
  "player_settlements",
  {
    id: text("id").primaryKey().$defaultFn(() => generateId()),
    player: text("player", { length: 50 }).notNull(),
    seasonId: text("season_id").notNull().references(() => seasons.id),
    settleScore: integer("settle_score").notNull().default(0),
    seasonAdjust: integer("season_adjust").notNull().default(0),
    updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    index("player_settlements_season_idx").on(table.seasonId),
    index("player_settlements_player_idx").on(table.player),
    index("player_settlements_unique_idx").on(table.player, table.seasonId),
  ]
)

export const clearRecords = sqliteTable(
  "clear_records",
  {
    id: text("id").primaryKey().$defaultFn(() => generateId()),
    date: text("date", { length: 10 }).notNull(),
    player: text("player", { length: 50 }).notNull(),
    amount: integer("amount").notNull(),
    seasonId: text("season_id").notNull().references(() => seasons.id),
    clearType: text("clear_type", { length: 20 }).notNull(),
    createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    index("clear_records_season_idx").on(table.seasonId),
    index("clear_records_player_idx").on(table.player),
  ]
)

export const handRecords = sqliteTable(
  "hand_records",
  {
    id: text("id").primaryKey().$defaultFn(() => generateId()),
    date: text("date", { length: 10 }).notNull(),
    seasonId: text("season_id").notNull().references(() => seasons.id),
    sessionId: text("session_id"),
    players: text("players").notNull(),
    handType: text("hand_type", { length: 20 }),
    board: text("board"),
    actions: text("actions"),
    result: integer("result"),
    winner: text("winner", { length: 50 }),
    notes: text("notes"),
    tags: text("tags"),
    photo: text("photo"),
    gtoAnalysis: text("gto_analysis"),
    isComplete: integer("is_complete", { mode: "boolean" }).notNull().default(false),
    quickMode: integer("quick_mode", { mode: "boolean" }).notNull().default(false),
    createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    index("hand_records_date_idx").on(table.date),
    index("hand_records_season_idx").on(table.seasonId),
    index("hand_records_session_idx").on(table.sessionId),
    index("hand_records_complete_idx").on(table.isComplete),
    index("hand_records_quick_idx").on(table.quickMode),
  ]
)

export const awardRecords = sqliteTable(
  "award_records",
  {
    id: text("id").primaryKey().$defaultFn(() => generateId()),
    seasonId: text("season_id").notNull().references(() => seasons.id),
    player: text("player", { length: 50 }).notNull(),
    awardType: text("award_type", { length: 50 }).notNull(),
    awardName: text("award_name", { length: 50 }).notNull(),
    awardIcon: text("award_icon", { length: 10 }).notNull(),
    description: text("description"),
    createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    index("award_records_season_idx").on(table.seasonId),
    index("award_records_player_idx").on(table.player),
    index("award_records_type_idx").on(table.awardType),
  ]
)

export const aiCache = sqliteTable(
  "ai_cache",
  {
    id: text("id").primaryKey().$defaultFn(() => generateId()),
    label: text("label", { length: 100 }).notNull(),
    prompt: text("prompt").notNull(),
    result: text("result").notNull(),
    time: text("time", { length: 50 }).notNull(),
    createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    index("ai_cache_label_idx").on(table.label),
  ]
)
