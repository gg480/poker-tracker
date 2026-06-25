// Next.js 16 instrumentation hook — 在服务器启动时执行一次
// 通过 NEXT_RUNTIME 环境变量判断当前 runtime，避免 Edge Runtime 加载 Node.js 模块
export async function register(): Promise<void> {
  // 只在 Node.js runtime 中执行，Edge Runtime 直接跳过
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return
  }
  try {
    // 启动时初始化 Excel 文件监控
    const { initFileWatcher } = await import("./lib/init-watcher")
    await initFileWatcher()
  } catch (error) {
    const msg = error instanceof Error ? error.message : "未知错误"
    console.error(`[instrumentation] 初始化失败: ${msg}`)
  }
}
