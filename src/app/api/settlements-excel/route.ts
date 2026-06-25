// 清分数据 API — 从 Excel 积分表 Sheet 读取（只读，不分赛季）
import { NextResponse } from "next/server"
import { parseSettlementSheet } from "@/lib/excel-settlement-parser"

// 默认监控目录
const DEFAULT_WATCH_DIR = "D:\\02工作\\texa\\数据"

// 查找目录下的 Excel 文件
function findExcelFile(dir: string): string | null {
  try {
    const fs = require("fs")
    const path = require("path")
    if (!fs.existsSync(dir)) return null
    const files = fs.readdirSync(dir) as string[]
    const excelFile = files.find((f: string) => f.endsWith(".xlsx") || f.endsWith(".xls"))
    return excelFile ? path.join(dir, excelFile) : null
  } catch {
    return null
  }
}

// GET /api/settlements-excel — 返回 Excel 积分表中的清分数据
export async function GET() {
  try {
    const watchDir = process.env.EXCEL_WATCH_DIR ?? DEFAULT_WATCH_DIR
    const filePath = findExcelFile(watchDir)
    if (!filePath) {
      return NextResponse.json({
        success: false,
        error: "未找到 Excel 文件",
      }, { status: 404 })
    }

    const data = parseSettlementSheet(filePath)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "未知错误"
    return NextResponse.json({
      success: false,
      error: `读取清分数据失败: ${msg}`,
    }, { status: 500 })
  }
}
