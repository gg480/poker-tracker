// Excel 积分表 Sheet 解析器 — 解析清分数据
import * as XLSX from "xlsx"
import * as fs from "fs"

// 清分数据（从 Excel 积分表 Sheet 解析）
export interface SettlementData {
  player: string           // 玩家名称
  totalScore: number       // 累计积分
  settleCount: number      // 清分次数
  extraSettle: number      // 额外清分
  season1Settle: number    // 赛季1清分
  settleBalance: number    // 清分余额
  cashedCount: number      // 兑现清分次数
  maxWin: number           // 单日最高赢
  maxLoss: number          // 单日最多亏
  totalGames: number       // 总场次
  winCount: number         // 胜场数
  lossCount: number        // 败场数
  winRate: number          // 胜率（百分比）
}

// 解析数值（处理 string/number 混合类型）
function parseNumber(val: unknown): number {
  if (val === null || val === undefined || val === "") return 0
  if (typeof val === "number") return val
  const str = String(val).trim().replace(/%/g, "")
  const num = Number(str)
  return Number.isFinite(num) ? num : 0
}

// 解析积分表 Sheet
export function parseSettlementSheet(filePath: string): SettlementData[] {
  if (!fs.existsSync(filePath)) return []

  const wb = XLSX.readFile(filePath)
  const sheetName = wb.SheetNames.find((n) => n.includes("积分表"))
  if (!sheetName) return []

  const ws = wb.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: null })

  const results: SettlementData[] = []
  // 跳过表头行
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    const player = row[0]
    if (!player || typeof player !== "string" || player.trim() === "") continue

    results.push({
      player: player.trim(),
      totalScore: parseNumber(row[1]),
      settleCount: parseNumber(row[2]),
      extraSettle: parseNumber(row[3]),
      season1Settle: parseNumber(row[4]),
      settleBalance: parseNumber(row[5]),
      cashedCount: parseNumber(row[6]),
      maxWin: parseNumber(row[9]),
      maxLoss: parseNumber(row[10]),
      totalGames: parseNumber(row[13]),
      winCount: parseNumber(row[14]),
      lossCount: parseNumber(row[15]),
      winRate: parseNumber(row[16]),
    })
  }

  return results
}
