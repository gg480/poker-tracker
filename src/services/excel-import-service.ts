import * as fs from "fs"
import * as path from "path"
import * as crypto from "crypto"
import { sql } from "drizzle-orm"
import { db } from "@/storage/database/drizzle"
import {
  getImportLogByHash,
  insertImportLog,
  insertSession,
  insertRecords,
  getAllSeasons,
  insertSeason,
} from "@/storage/database/crud"
import { parseExcelFile, type ExcelRecord } from "@/lib/excel-parser"

// 赛季信息（用于按日期匹配）
interface SeasonInfo {
  id: string
  name: string
  startDate: string
  endDate: string | null
}

// 导入结果
export interface ImportResult {
  success: boolean
  message: string
  stats?: {
    seasons: number
    sessions: number
    records: number
    skipped: number
  }
}

// 支持的文件扩展名
const SUPPORTED_EXTENSIONS = [".xlsx", ".xls"]

// 确保 import_log 表存在（项目无自动迁移机制，首次使用时创建）
// 使用 Drizzle 的 sql 模板，与 schema.ts 定义保持一致
export function ensureImportLogTable(): void {
  try {
    db.run(sql`CREATE TABLE IF NOT EXISTS import_log (
      id TEXT PRIMARY KEY,
      file_name TEXT NOT NULL,
      file_hash TEXT NOT NULL UNIQUE,
      file_path TEXT NOT NULL,
      record_count INTEGER NOT NULL DEFAULT 0,
      imported_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'success'
    )`)
    db.run(sql`CREATE INDEX IF NOT EXISTS import_log_hash_idx ON import_log(file_hash)`)
    db.run(sql`CREATE INDEX IF NOT EXISTS import_log_status_idx ON import_log(status)`)
  } catch (error) {
    const msg = error instanceof Error ? error.message : "未知错误"
    throw new Error(`创建 import_log 表失败: ${msg}`)
  }
}

// 计算文件 MD5 哈希（用于去重）
export async function calculateFileHash(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const hash = crypto.createHash("md5")
      const stream = fs.createReadStream(filePath)
      stream.on("data", (chunk) => hash.update(chunk))
      stream.on("end", () => resolve(hash.digest("hex")))
      stream.on("error", (err) => reject(err))
    } catch (error) {
      reject(error)
    }
  })
}

// 检查文件是否已导入过（基于哈希去重）
export function isFileImported(fileHash: string): boolean {
  try {
    const existing = getImportLogByHash(fileHash)
    return existing !== undefined
  } catch {
    return false
  }
}

// 从文件名提取赛季名（如"赛季2-积分在线榜.xlsx" → "赛季2"）
function extractSeasonName(filePath: string): string {
  const baseName = path.basename(filePath, path.extname(filePath))
  const match = baseName.match(/^(赛季\d+)/)
  return match ? match[1] : `导入赛季-${new Date().toISOString().split("T")[0]}`
}

// 按日期匹配已有赛季（包括已归档的）
// 日期在 season.start_date ~ season.end_date 范围内则匹配
function matchSeasonByDate(date: string, allSeasons: SeasonInfo[]): string | null {
  for (const season of allSeasons) {
    const startOk = date >= season.startDate
    const endOk = !season.endDate || date <= season.endDate
    if (startOk && endOk) return season.id
  }
  return null
}

// 获取或创建赛季（按日期匹配已有赛季，无匹配则从文件名创建）
function getOrCreateSeasonForDate(
  date: string,
  fallbackSeasonName: string,
  allSeasons: SeasonInfo[],
): string {
  const matched = matchSeasonByDate(date, allSeasons)
  if (matched) return matched

  // 无匹配赛季，创建新赛季（仅当文件名赛季不存在时）
  const existing = allSeasons.find((s) => s.name === fallbackSeasonName)
  if (existing) return existing.id

  const newSeason = insertSeason({
    name: fallbackSeasonName,
    startDate: date,
    endDate: null,
    active: true,
    archived: false,
  })
  return newSeason.id
}

// 按日期+赛季分组记录，支持跨赛季数据
function groupRecordsBySeason(
  records: ExcelRecord[],
  fallbackSeasonName: string,
  allSeasons: SeasonInfo[],
): Map<string, ExcelRecord[]> {
  const grouped = new Map<string, ExcelRecord[]>()
  for (const record of records) {
    const seasonId = getOrCreateSeasonForDate(record.date, fallbackSeasonName, allSeasons)
    const key = `${seasonId}|${record.date}`
    const existing = grouped.get(key) ?? []
    existing.push(record)
    grouped.set(key, existing)
  }
  return grouped
}

// 导入记录到数据库（创建场次 + 插入记录）
// 支持跨赛季数据：按日期+赛季分组，使用事务保证原子性
// 注意：同日期同玩家可能有多条记录（一天多场比赛），不做去重
function importRecordsToDb(
  records: ExcelRecord[],
  fallbackSeasonName: string,
): {
  sessions: number
  records: number
  seasons: Set<string>
} {
  const allSeasons = getAllSeasons().map((s) => ({
    id: s.id,
    name: s.name,
    startDate: s.startDate,
    endDate: s.endDate,
  }))
  const grouped = groupRecordsBySeason(records, fallbackSeasonName, allSeasons)
  const usedSeasons = new Set<string>()

  return db.transaction(() => {
    let sessionCount = 0
    let recordCount = 0

    for (const [key, dateRecords] of grouped) {
      const [seasonId, date] = key.split("|")
      usedSeasons.add(seasonId)

      // 每次导入都创建新场次，不复用已有场次
      // 同日期同玩家多记录（一天多场）全部归入同一场次
      const session = insertSession({
        date,
        seasonId,
        status: "confirmed",
        totalRecords: dateRecords.length,
      })
      sessionCount++

      const recordsToInsert = dateRecords.map((r) => ({
        date: r.date,
        seasonId,
        sessionId: session.id,
        player: r.player,
        score: r.score,
        win: r.win,
        status: "confirmed" as const,
      }))
      insertRecords(recordsToInsert)
      recordCount += recordsToInsert.length
    }

    return { sessions: sessionCount, records: recordCount, seasons: usedSeasons }
  })
}

// 增量导入 Excel 文件
export async function importExcelFile(filePath: string): Promise<ImportResult> {
  try {
    ensureImportLogTable()

    if (!fs.existsSync(filePath)) {
      return { success: false, message: `文件不存在: ${filePath}` }
    }

    const fileHash = await calculateFileHash(filePath)
    if (isFileImported(fileHash)) {
      return {
        success: true,
        message: `文件已导入过，跳过: ${path.basename(filePath)}`,
        stats: { seasons: 0, sessions: 0, records: 0, skipped: 1 },
      }
    }

    const parseResult = parseExcelFile(filePath)
    if (!parseResult.success || parseResult.data.length === 0) {
      return {
        success: false,
        message: `Excel 解析失败: ${parseResult.errors.join("; ")}`,
      }
    }

    const seasonName = extractSeasonName(filePath)
    const { sessions, records, seasons } = importRecordsToDb(parseResult.data, seasonName)

    insertImportLog({
      fileName: path.basename(filePath),
      fileHash,
      filePath,
      recordCount: records,
      status: "success",
    })

    return {
      success: true,
      message: `导入成功: ${path.basename(filePath)} (${records} 条记录, ${sessions} 场次, ${seasons.size} 赛季)`,
      stats: { seasons: seasons.size, sessions, records, skipped: parseResult.stats.skippedRows },
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "未知错误"
    return { success: false, message: `导入失败: ${msg}` }
  }
}

// 批量导入目录下所有 Excel 文件
export async function importExcelDirectory(dirPath: string): Promise<ImportResult[]> {
  try {
    if (!fs.existsSync(dirPath)) {
      return [{ success: false, message: `目录不存在: ${dirPath}` }]
    }

    const entries = fs.readdirSync(dirPath)
    const excelFiles = entries.filter((name) => {
      const ext = path.extname(name).toLowerCase()
      return SUPPORTED_EXTENSIONS.includes(ext)
    })

    if (excelFiles.length === 0) {
      return [{ success: true, message: `目录中无 Excel 文件: ${dirPath}` }]
    }

    const results: ImportResult[] = []
    for (const fileName of excelFiles) {
      const fullPath = path.join(dirPath, fileName)
      const result = await importExcelFile(fullPath)
      results.push(result)
    }

    return results
  } catch (error) {
    const msg = error instanceof Error ? error.message : "未知错误"
    return [{ success: false, message: `批量导入失败: ${msg}` }]
  }
}
