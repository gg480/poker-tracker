import { getWatcherStatus } from "@/lib/file-watcher"
import { getAllImportLogs } from "@/storage/database/crud"
import {
  importExcelDirectory,
  ensureImportLogTable,
  type ImportResult,
} from "@/services/excel-import-service"
import { respond } from "@/services/crud-service"

// 默认监控目录（与 init-watcher 保持一致）
const DEFAULT_WATCH_DIR = "D:\\02工作\\texa\\数据"

// GET /api/import-status
// 返回：监控状态 + 最近导入记录列表
export async function GET() {
  return respond(() => {
    ensureImportLogTable()
    const watcher = getWatcherStatus()
    const imports = getAllImportLogs()
    return { watcher, imports }
  })
}

// POST /api/import-status
// 手动触发导入监控目录下所有 Excel 文件
export async function POST() {
  return respond(async () => {
    ensureImportLogTable()
    const dir = process.env.EXCEL_WATCH_DIR || DEFAULT_WATCH_DIR
    const results: ImportResult[] = await importExcelDirectory(dir)

    const totalRecords = results.reduce(
      (sum, r) => sum + (r.stats?.records ?? 0),
      0
    )
    const skipped = results.reduce(
      (sum, r) => sum + (r.stats?.skipped ?? 0),
      0
    )
    const allSuccess = results.every((r) => r.success)

    return {
      results,
      summary: {
        totalFiles: results.length,
        totalRecords,
        skipped,
        allSuccess,
        message: results.map((r) => r.message).join("; "),
      },
    }
  })
}
