"use client"

import { useEffect, useCallback } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty"
import { useImportStore } from "@/stores/import-store"
import {
  FolderSync,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertCircle,
} from "lucide-react"
import { toast } from "sonner"

// 格式化日期时间
function formatDateTime(isoString: string): string {
  try {
    const date = new Date(isoString)
    return date.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return isoString
  }
}

// 从 lastEvent 字符串提取时间部分
function extractEventTime(lastEvent: string): string {
  if (!lastEvent) return "—"
  // lastEvent 格式: "2026-06-17T10:30:00.000Z 监控已启动"
  const parts = lastEvent.split(" ")
  if (parts.length >= 2) {
    return `${formatDateTime(parts[0])} ${parts.slice(1).join(" ")}`
  }
  return lastEvent
}

// 监控状态卡片
function WatcherStatusCard() {
  const { watcherStatus } = useImportStore()

  if (!watcherStatus) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderSync className="size-4" />
            文件监控状态
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-16 rounded-lg" />
        </CardContent>
      </Card>
    )
  }

  const isWatching = watcherStatus.watching
  const dir = watcherStatus.dir || "未配置"
  const lastEvent = extractEventTime(watcherStatus.lastEvent)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FolderSync className="size-4" />
          文件监控状态
        </CardTitle>
        <CardDescription>实时监控 Excel 文件变更并自动导入</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">当前状态</span>
          <Badge variant={isWatching ? "default" : "secondary"}>
            {isWatching ? (
              <>
                <span className="mr-1 inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                监控中
              </>
            ) : (
              "已停止"
            )}
          </Badge>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-muted-foreground shrink-0">监控目录</span>
          <span className="text-sm font-mono text-right truncate" title={dir}>
            {dir}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-muted-foreground shrink-0">最近事件</span>
          <span className="text-xs text-right truncate max-w-[200px]" title={lastEvent}>
            {lastEvent}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

// 手动导入卡片
function ManualImportCard() {
  const { importing, triggerImport, lastImportSummary, error } = useImportStore()

  const handleImport = useCallback(async () => {
    try {
      await triggerImport()
      const store = useImportStore.getState()
      if (store.lastImportSummary && !store.error) {
        const s = store.lastImportSummary
        toast.success(
          `导入完成：${s.totalFiles} 个文件，${s.totalRecords} 条记录` +
            (s.skipped > 0 ? `，跳过 ${s.skipped} 条` : "")
        )
      }
      if (store.error) {
        toast.error(store.error)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "未知错误"
      toast.error(`导入失败: ${msg}`)
    }
  }, [triggerImport])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="size-4" />
          手动触发导入
        </CardTitle>
        <CardDescription>扫描监控目录并导入所有未处理的 Excel 文件</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          onClick={handleImport}
          disabled={importing}
          className="w-full"
          variant="default"
        >
          {importing ? (
            <>
              <RefreshCw className="size-4 animate-spin" />
              导入中...
            </>
          ) : (
            <>
              <Upload className="size-4" />
              立即导入
            </>
          )}
        </Button>
        {lastImportSummary && !error && (
          <div className="text-xs text-muted-foreground space-y-1">
            <p>
              上次导入：{lastImportSummary.totalFiles} 个文件 ·{" "}
              {lastImportSummary.totalRecords} 条记录
              {lastImportSummary.skipped > 0 &&
                ` · 跳过 ${lastImportSummary.skipped} 条`}
            </p>
          </div>
        )}
        {error && (
          <div className="flex items-start gap-2 text-xs text-destructive">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// 导入记录列表卡片
function ImportLogsCard() {
  const { importLogs, loading } = useImportStore()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="size-4" />
          最近导入记录
        </CardTitle>
        <CardDescription>已导入的 Excel 文件历史</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 rounded-lg" />
            ))}
          </div>
        ) : importLogs.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FileSpreadsheet className="size-5" />
              </EmptyMedia>
              <EmptyTitle>暂无导入记录</EmptyTitle>
              <EmptyDescription>
                将 Excel 文件放入监控目录或点击上方按钮手动导入
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {importLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center gap-3 p-2 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
              >
                {log.status === "success" ? (
                  <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                ) : (
                  <XCircle className="size-4 text-destructive shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium truncate" title={log.fileName}>
                      {log.fileName}
                    </span>
                    <Badge variant="outline" className="shrink-0 text-xs">
                      {log.recordCount} 条
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {formatDateTime(log.importedAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// 导入状态面板主组件
export function ImportStatusPanel() {
  const { loadStatus } = useImportStore()

  useEffect(() => {
    loadStatus()
  }, [loadStatus])

  return (
    <div className="space-y-4">
      <WatcherStatusCard />
      <ManualImportCard />
      <ImportLogsCard />
    </div>
  )
}
