import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"
import * as schema from "./shared/schema"
import path from "path"
import fs from "fs"

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), "data", "poker-tracker.db")

const dbDir = path.dirname(DB_PATH)
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

const sqlite = new Database(DB_PATH)

sqlite.pragma("journal_mode = WAL")
sqlite.pragma("foreign_keys = ON")

export const db = drizzle(sqlite, { schema })

export type DatabaseType = typeof db

export * from "./shared/schema"
