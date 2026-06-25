"use client"

import { useCallback } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import { ImportStatusPanel } from "@/components/poker/import-status-panel"

// 导入状态页面客户端组件
export function ImportStatusClient() {
  const handleBack = useCallback(() => {
    window.location.href = "/"
  }, [])

  return (
    <div className="min-h-screen pb-6 bg-background">
      <header className="sticky top-0 z-40 px-4 sm:px-6 py-3 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="flex items-center gap-3 max-w-[1200px] mx-auto">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">导入状态</h1>
            <p className="text-sm text-muted-foreground">
              Excel 文件监控与导入历史
            </p>
          </div>
        </div>
      </header>

      <main className="px-4 sm:px-6 pt-4 pb-6 max-w-[1200px] mx-auto">
        <ImportStatusPanel />
      </main>
    </div>
  )
}
