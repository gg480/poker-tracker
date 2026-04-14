import { pgTable, serial, timestamp, varchar, integer, boolean, text, index } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"


// 德扑比赛记录表
export const pokerRecords = pgTable(
  "poker_records",
  {
    id: serial("id").primaryKey(),
    date: varchar("date", { length: 10 }).notNull(),           // YYYY-MM-DD
    player: varchar("player", { length: 50 }).notNull(),
    score: integer("score").notNull(),
    win: integer("win").notNull(),                           // 1 or -1
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("poker_records_date_idx").on(table.date),           // 按日期查询
    index("poker_records_player_idx").on(table.player),     // 按玩家查询
  ]
);

// 赛季表
export const seasons = pgTable(
  "seasons",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    name: varchar("name", { length: 50 }).notNull(),
    start_date: varchar("start_date", { length: 10 }).notNull(),  // YYYY-MM-DD
    end_date: varchar("end_date", { length: 10 }),               // YYYY-MM-DD, null if active
    active: boolean("active").notNull().default(true),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("seasons_active_idx").on(table.active),             // 查询活跃赛季
    index("seasons_date_range_idx").on(table.start_date, table.end_date),
  ]
);

// 清分记录表
export const clearRecords = pgTable(
  "clear_records",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    date: varchar("date", { length: 10 }).notNull(),        // YYYY-MM-DD
    player: varchar("player", { length: 50 }).notNull(),
    amount: integer("amount").notNull(),
    season_id: varchar("season_id", { length: 36 }).notNull().references(() => seasons.id),
    clear_type: varchar("clear_type", { length: 20 }).notNull(),  // 'threshold' or 'season_end'
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("clear_records_season_idx").on(table.season_id),   // 按赛季查询
    index("clear_records_player_idx").on(table.player),     // 按玩家查询
  ]
);

// AI 分析缓存表
export const aiCache = pgTable(
  "ai_cache",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    label: varchar("label", { length: 100 }).notNull(),
    prompt: text("prompt").notNull(),
    result: text("result").notNull(),
    time: varchar("time", { length: 50 }).notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("ai_cache_label_idx").on(table.label),            // 按标签查询
  ]
);

// 保留系统表
export const healthCheck = pgTable("health_check", {
  id: serial().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});
