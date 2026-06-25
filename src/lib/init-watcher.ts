import * as fs from "fs"
import * as path from "path"
import { startFileWatcher } from "@/lib/file-watcher"
import { ensureImportLogTable } from "@/services/excel-import-service"

// 默认监控目录
const DEFAULT_WATCH_DIR = "D:\\02工作\\texa\\数据"

// 初始化文件监控器
export async function initFileWatcher(): Promise<void> {
  try {
    // 确保 import_log 表存在
    ensureImportLogTable()
    console.log("[init-watcher] import_log 表已就绪")

    // 检查监控目录是否存在
    const watchDir = process.env.EXCEL_WATCH_DIR || DEFAULT_WATCH_DIR
    if (!fs.existsSync(watchDir)) {
      console.warn(`[init-watcher] 监控目录不存在，跳过启动: ${watchDir}`)
      return
    }

    // 启动文件监控
    startFileWatcher(watchDir)
    console.log(`[init-watcher] 文件监控器已启动，监控目录: ${watchDir}`)
  } catch (error) {
    const msg = error instanceof Error ? error.message : "未知错误"
    console.error(`[init-watcher] 初始化失败: ${msg}`)
  }
}
