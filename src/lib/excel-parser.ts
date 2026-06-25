import * as XLSX from "xlsx"
import * as fs from "fs"

// Excel 解析后的单条记录
export interface ExcelRecord {
  date: string // YYYY-MM-DD 格式
  player: string // 玩家名
  score: number // 积分（正赢负亏）
  win: 1 | -1 // 胜负标记
}

// 解析结果
export interface ParseResult {
  success: boolean
  data: ExcelRecord[]
  errors: string[]
  stats: { totalRows: number; validRows: number; skippedRows: number }
}

// 列索引常量（基于"记录登记表"格式）
const COL_DATE = 0 // A 列：交流日期
const COL_PLAYER = 2 // C 列：参赛选手
const COL_SCORE = 3 // D 列：支出/收入（积分）
const COL_WIN = 6 // G 列：胜出标记
const HEADER_ROW_INDEX = 0 // 第一行为表头
const MIN_VALID_COLUMNS = 7 // 至少需要 7 列才能解析

// 解析中文日期 "2025年10月25日" → "2025-10-25"
export function parseChineseDate(dateStr: string): string | null {
  if (!dateStr || typeof dateStr !== "string") return null

  const trimmed = dateStr.trim()
  const match = trimmed.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日$/)
  if (!match) return null

  const [, year, month, day] = match
  const y = year
  const m = month.padStart(2, "0")
  const d = day.padStart(2, "0")
  return `${y}-${m}-${d}`
}

// 解析胜负标记（"1" → 1, "-1" → -1）
function parseWinMark(raw: unknown): 1 | -1 | null {
  if (raw === null || raw === undefined) return null
  const num = typeof raw === "number" ? raw : Number(raw)
  if (num === 1) return 1
  if (num === -1) return -1
  return null
}

// 解析积分数值
function parseScore(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null
  const num = typeof raw === "number" ? raw : Number(raw)
  return Number.isFinite(num) ? num : null
}

// 从行数据中提取一条 ExcelRecord
function parseRowToRecord(row: unknown[]): ExcelRecord | null {
  if (!Array.isArray(row) || row.length < MIN_VALID_COLUMNS) return null

  const dateRaw = row[COL_DATE]
  const playerRaw = row[COL_PLAYER]
  const scoreRaw = row[COL_SCORE]
  const winRaw = row[COL_WIN]

  if (playerRaw === null || playerRaw === undefined || String(playerRaw).trim() === "") {
    return null
  }

  const dateStr = typeof dateRaw === "string" ? dateRaw : String(dateRaw ?? "")
  const date = parseChineseDate(dateStr)
  if (!date) return null

  const score = parseScore(scoreRaw)
  if (score === null) return null

  const win = parseWinMark(winRaw)
  if (win === null) return null

  return {
    date,
    player: String(playerRaw).trim(),
    score,
    win,
  }
}

// 读取 Excel 文件首个 Sheet 为二维数组
function readSheetRows(filePath: string): unknown[][] {
  const buffer = fs.readFileSync(filePath)
  const workbook = XLSX.read(buffer, { type: "buffer" })
  const firstSheetName = workbook.SheetNames[0]
  if (!firstSheetName) return []
  const sheet = workbook.Sheets[firstSheetName]
  return XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null })
}

// 解析 Excel 文件，跳过表头，逐行解析为 ExcelRecord
export function parseExcelFile(filePath: string): ParseResult {
  const errors: string[] = []
  const data: ExcelRecord[] = []
  let totalRows = 0
  let skippedRows = 0

  try {
    if (!fs.existsSync(filePath)) {
      return {
        success: false,
        data: [],
        errors: [`文件不存在: ${filePath}`],
        stats: { totalRows: 0, validRows: 0, skippedRows: 0 },
      }
    }

    const rows = readSheetRows(filePath)
    // 跳过表头行
    const dataRows = rows.slice(HEADER_ROW_INDEX + 1)
    totalRows = dataRows.length

    for (let i = 0; i < dataRows.length; i++) {
      const record = parseRowToRecord(dataRows[i])
      if (record) {
        data.push(record)
      } else {
        skippedRows++
        errors.push(`第 ${i + 2} 行解析失败（跳过）`)
      }
    }

    return {
      success: true,
      data,
      errors,
      stats: { totalRows, validRows: data.length, skippedRows },
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "未知错误"
    return {
      success: false,
      data: [],
      errors: [`Excel 解析失败: ${msg}`],
      stats: { totalRows, validRows: data.length, skippedRows },
    }
  }
}
