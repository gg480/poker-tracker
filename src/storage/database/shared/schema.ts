import { sqliteTable, text, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core"
import { generateId } from "./id"

export const seasons = sqliteTable(
  "seasons",
  {
    id: text("id").primaryKey().$defaultFn(() => generateId()),
    name: text("name", { length: 50 }).notNull().unique(),
    startDate: text("start_date", { length: 10 }).notNull(),
    endDate: text("end_date", { length: 10 }),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    archived: integer("archived", { mode: "boolean" }).notNull().default(false),
    createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
    updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    index("seasons_active_idx").on(table.active),
    index("seasons_date_range_idx").on(table.startDate, table.endDate),
    // Composite: WHERE active=? ORDER BY startDate DESC (getActiveSeasons)
    index("seasons_active_start_date_idx").on(table.active, table.startDate),
  ]
)

/**
 * gameSessions tracks individual poker session dates.
 *
 * NOTE: `totalRecords` and `totalScore` are **denormalized aggregates** —
 * they store the count of pokerRecords and the sum of their scores for this
 * session. Callers that insert/delete/update pokerRecords linked to a session
 * MUST also update gameSessions.totalRecords and gameSessions.totalScore to
 * keep the cache consistent.
 *
 * All pokerRecord CRUD helpers in crud.ts (insertRecord, insertRecords,
 * updatePokerRecord, deletePokerRecord, deleteRecordsBySession,
 * deleteRecordsByDate) now auto-sync these counters via syncSessionCounters().
 * The seed function (seed.ts) also sets both aggregates correctly on initial
 * insert.
 *
 * If you bypass crud.ts and modify pokerRecords directly (e.g. via raw SQL or
 * drizzle queries outside crud.ts), you must call syncSessionCounters() or
 * update the session row manually.
 */
export const gameSessions = sqliteTable(
  "game_sessions",
  {
    id: text("id").primaryKey().$defaultFn(() => generateId()),
    date: text("date", { length: 10 }).notNull(),
    seasonId: text("season_id").notNull().references(() => seasons.id, { onDelete: "cascade" }),
    status: text("status", { length: 20 }).notNull().default("pending"),
    totalRecords: integer("total_records").notNull().default(0),
    totalScore: integer("total_score").notNull().default(0),
    notes: text("notes"),
    createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
    updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    index("game_sessions_date_idx").on(table.date),
    uniqueIndex("game_sessions_date_season_unique").on(table.date, table.seasonId),
    index("game_sessions_status_idx").on(table.status),
    // Composite: WHERE seasonId=? ORDER BY date DESC (getSessionsBySeason, getSessionsPaginated)
    index("game_sessions_season_date_idx").on(table.seasonId, table.date),
  ]
)

export const pokerRecords = sqliteTable(
  "poker_records",
  {
    id: text("id").primaryKey().$defaultFn(() => generateId()),
    date: text("date", { length: 10 }).notNull(),
    seasonId: text("season_id").notNull().references(() => seasons.id, { onDelete: "cascade" }),
    sessionId: text("session_id").references(() => gameSessions.id, { onDelete: "cascade" }),
    player: text("player", { length: 50 }).notNull(),
    score: integer("score").notNull(),
    win: integer("win").notNull(),
    status: text("status", { length: 20 }).notNull().default("pending"),
    notes: text("notes"),
    createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
    updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    index("poker_records_date_idx").on(table.date),
    index("poker_records_player_idx").on(table.player),
    // sessionId-alone is covered by poker_records_session_player_idx (sessionId is prefix)
    index("poker_records_session_player_idx").on(table.sessionId, table.player),
    index("poker_records_status_idx").on(table.status),
    // Composite: filter by date + player (leaderboard/summary by date)
    index("poker_records_date_player_idx").on(table.date, table.player),
    // Composite: filter by season + player (season-long player summary)
    // Also covers seasonId-alone WHERE queries (seasonId is prefix), replacing the now-removed standalone seasonId index
    index("poker_records_season_player_idx").on(table.seasonId, table.player),
    // Composite: filter by season + ORDER BY date (getRecordsBySeason, getRecordsPaginated with seasonId)
    index("poker_records_season_date_idx").on(table.seasonId, table.date),
  ]
)

export const playerSettlements = sqliteTable(
  "player_settlements",
  {
    id: text("id").primaryKey().$defaultFn(() => generateId()),
    player: text("player", { length: 50 }).notNull(),
    seasonId: text("season_id").notNull().references(() => seasons.id, { onDelete: "cascade" }),
    settleScore: integer("settle_score").notNull().default(0),
    seasonAdjust: integer("season_adjust").notNull().default(0),
    createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
    updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    // player alone is covered by player_settlements_unique_idx (player is prefix)
    index("player_settlements_season_player_idx").on(table.seasonId, table.player),
    uniqueIndex("player_settlements_unique_idx").on(table.player, table.seasonId),
  ]
)

export const clearRecords = sqliteTable(
  "clear_records",
  {
    id: text("id").primaryKey().$defaultFn(() => generateId()),
    date: text("date", { length: 10 }).notNull(),
    player: text("player", { length: 50 }).notNull(),
    amount: integer("amount").notNull(),
    seasonId: text("season_id").notNull().references(() => seasons.id, { onDelete: "cascade" }),
    clearType: text("clear_type", { length: 20 }).notNull().default("threshold"),
    note: text("note"),
    createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
    updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    // seasonId alone is covered by clear_records_season_player_idx (seasonId is prefix)
    // and clear_records_season_date_idx (seasonId is prefix)
    index("clear_records_player_idx").on(table.player),
    index("clear_records_type_idx").on(table.clearType),
    index("clear_records_date_idx").on(table.date),
    index("clear_records_season_player_idx").on(table.seasonId, table.player),
    // Composite: WHERE seasonId=? ORDER BY date DESC (getClearsBySeason, getClearsPaginated)
    index("clear_records_season_date_idx").on(table.seasonId, table.date),
  ]
)

export const handRecords = sqliteTable(
  "hand_records",
  {
    id: text("id").primaryKey().$defaultFn(() => generateId()),
    date: text("date", { length: 10 }).notNull(),
    seasonId: text("season_id").notNull().references(() => seasons.id, { onDelete: "cascade" }),
    sessionId: text("session_id").references(() => gameSessions.id, { onDelete: "cascade" }),
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
    updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    index("hand_records_date_idx").on(table.date),
    index("hand_records_season_idx").on(table.seasonId),
    index("hand_records_session_idx").on(table.sessionId),
    index("hand_records_complete_idx").on(table.isComplete),
    index("hand_records_quick_idx").on(table.quickMode),
    // Composite: filter by season + completion status (getHandsByCompleteStatus, getIncompleteHands)
    index("hand_records_season_complete_idx").on(table.seasonId, table.isComplete),
    // Composite: WHERE sessionId=? ORDER BY createdAt DESC (getHandsBySession)
    index("hand_records_session_created_idx").on(table.sessionId, table.createdAt),
    // Composite: WHERE isComplete=? ORDER BY createdAt DESC (getIncompleteHands without seasonId)
    index("hand_records_complete_created_idx").on(table.isComplete, table.createdAt),
    // Composite: WHERE seasonId=? AND isComplete=? ORDER BY createdAt DESC (getIncompleteHands with seasonId)
    // Uses seasonId+isComplete from season_complete_idx, but createdAt ORDER BY not covered there.
    // Adding broader composite covering WHERE + ORDER BY:
    index("hand_records_season_complete_created_idx").on(table.seasonId, table.isComplete, table.createdAt),
  ]
)

export const awardRecords = sqliteTable(
  "award_records",
  {
    id: text("id").primaryKey().$defaultFn(() => generateId()),
    seasonId: text("season_id").notNull().references(() => seasons.id, { onDelete: "cascade" }),
    player: text("player", { length: 50 }).notNull(),
    awardType: text("award_type", { length: 50 }).notNull(),
    awardName: text("award_name", { length: 50 }).notNull(),
    awardIcon: text("award_icon", { length: 30 }).notNull(),
    description: text("description"),
    createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
    updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    index("award_records_season_idx").on(table.seasonId),
    index("award_records_player_idx").on(table.player),
    index("award_records_type_idx").on(table.awardType),
    // Composite: filter by season + sort by awardType (getAwardsBySeason)
    index("award_records_season_type_idx").on(table.seasonId, table.awardType),
    // ORDER BY createdAt DESC (getAllAwards)
    index("award_records_created_idx").on(table.createdAt),
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
    updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    index("ai_cache_label_idx").on(table.label),
    // ORDER BY createdAt DESC (getAllAICache, getAICachePaginated, trimAICache)
    index("ai_cache_created_idx").on(table.createdAt),
  ]
)

// Excel 文件导入日志表（用于增量去重）
export const importLog = sqliteTable(
  "import_log",
  {
    id: text("id").primaryKey().$defaultFn(() => generateId()),
    fileName: text("file_name").notNull(),
    fileHash: text("file_hash").notNull().unique(),
    filePath: text("file_path").notNull(),
    recordCount: integer("record_count").notNull().default(0),
    importedAt: text("imported_at").notNull().$defaultFn(() => new Date().toISOString()),
    status: text("status", { length: 20 }).notNull().default("success"),
    updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    index("import_log_hash_idx").on(table.fileHash),
    index("import_log_status_idx").on(table.status),
    // ORDER BY importedAt DESC (getAllImportLogs, getImportLogsPaginated)
    index("import_log_imported_idx").on(table.importedAt),
  ]
)
