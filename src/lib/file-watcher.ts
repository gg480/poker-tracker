import * as fs from "fs"
import * as path from "path"
import { importExcelFile } from "@/services/excel-import-service"

// 监控器状态
interface WatcherState {
  watching: boolean
  dir: string
  lastEvent: string
}

// 支持的文件扩展名
const SUPPORTED_EXTENSIONS = [".xlsx", ".xls"]
// 防抖延迟（毫秒）— Excel 保存时会触发多次事件
const DEBOUNCE_MS = 2000
// 错误重试最大次数
const MAX_RETRIES = 3
// 重试间隔（毫秒）
const RETRY_DELAY_MS = 1000

let watcher: fs.FSWatcher | null = null
let watcherState: WatcherState = { watching: false, dir: "", lastEvent: "" }
let debounceTimer: NodeJS.Timeout | null = null
const pendingFiles = new Set<string>()

// 判断是否为支持的 Excel 文件
function isExcelFile(fileName: string): boolean {
  const ext = path.extname(fileName).toLowerCase()
  return SUPPORTED_EXTENSIONS.includes(ext)
}

// 延迟工具
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// 带重试的文件导入
// importExcelFile 内部已 try/catch 永不抛异常，因此基于 result.success 判断
async function importWithRetry(filePath: string): Promise<void> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const result = await importExcelFile(filePath)

    if (result.success) {
      console.log(`[file-watcher] 导入结果: ${result.message}`)
      return
    }

    console.error(`[file-watcher] 第 ${attempt} 次导入失败: ${result.message}`)
    if (attempt < MAX_RETRIES) {
      await delay(RETRY_DELAY_MS)
    }
  }
  console.error(`[file-watcher] 文件导入最终失败（已重试 ${MAX_RETRIES} 次）: ${filePath}`)
}

// 处理待导入文件队列（防抖后批量执行）
async function processPendingFiles(): Promise<void> {
  const files = Array.from(pendingFiles)
  pendingFiles.clear()
  for (const file of files) {
    if (fs.existsSync(file)) {
      await importWithRetry(file)
    }
  }
}

// 触发防抖处理
function scheduleDebouncedImport(filePath: string): void {
  pendingFiles.add(filePath)
  watcherState.lastEvent = `${new Date().toISOString()} 检测到变更: ${path.basename(filePath)}`

  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
  debounceTimer = setTimeout(() => {
    debounceTimer = null
    processPendingFiles().catch((err) => {
      const msg = err instanceof Error ? err.message : "未知错误"
      console.error(`[file-watcher] 处理文件队列失败: ${msg}`)
    })
  }, DEBOUNCE_MS)
}

// 启动文件夹监控
export function startFileWatcher(dirPath: string): void {
  try {
    if (watcherState.watching) {
      console.log(`[file-watcher] 已在监控中: ${watcherState.dir}`)
      return
    }

    if (!fs.existsSync(dirPath)) {
      console.error(`[file-watcher] 监控目录不存在: ${dirPath}`)
      return
    }

    watcher = fs.watch(dirPath, { persistent: false }, (eventType, filename) => {
      if (!filename || !isExcelFile(filename)) return
      const fullPath = path.join(dirPath, filename)
      // 仅处理新增或修改事件
      if (eventType === "change" || eventType === "rename") {
        scheduleDebouncedImport(fullPath)
      }
    })

    watcher.on("error", (err) => {
      console.error(`[file-watcher] 监控错误: ${err.message}`)
    })

    watcherState = {
      watching: true,
      dir: dirPath,
      lastEvent: `${new Date().toISOString()} 监控已启动`,
    }
    console.log(`[file-watcher] 已启动监控: ${dirPath}`)
  } catch (error) {
    const msg = error instanceof Error ? error.message : "未知错误"
    console.error(`[file-watcher] 启动监控失败: ${msg}`)
  }
}

// 停止文件夹监控
export function stopFileWatcher(): void {
  try {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      debounceTimer = null
    }
    if (watcher) {
      watcher.close()
      watcher = null
    }
    pendingFiles.clear()
    watcherState = {
      watching: false,
      dir: "",
      lastEvent: `${new Date().toISOString()} 监控已停止`,
    }
    console.log(`[file-watcher] 监控已停止`)
  } catch (error) {
    const msg = error instanceof Error ? error.message : "未知错误"
    console.error(`[file-watcher] 停止监控失败: ${msg}`)
  }
}

// 获取监控状态
export function getWatcherStatus(): WatcherState {
  return { ...watcherState }
}
