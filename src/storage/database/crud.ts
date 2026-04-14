// 德扑数据 CRUD 操作 (服务端使用 Drizzle ORM)
// 注：此文件用于服务端数据库操作，客户端直接使用 Supabase 客户端
// 导出的类型供其他地方使用

import { pokerRecords, seasons, clearRecords, aiCache } from "./shared/schema";

// ==================== 类型定义 ====================

// 数据库类型 (从 schema 推断) - 供服务端使用
export type PokerRecordDB = typeof pokerRecords.$inferSelect;
export type InsertPokerRecord = typeof pokerRecords.$inferInsert;
export type SeasonDB = typeof seasons.$inferSelect;
export type InsertSeason = typeof seasons.$inferInsert;
export type ClearRecordDB = typeof clearRecords.$inferSelect;
export type InsertClearRecord = typeof clearRecords.$inferInsert;
export type AICacheDB = typeof aiCache.$inferSelect;
export type InsertAICache = typeof aiCache.$inferInsert;

// ==================== Schema 导出 ====================

// 导出 schema 表定义供 drizzle-kit 使用
export { pokerRecords, seasons, clearRecords, aiCache };
