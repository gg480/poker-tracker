"use client"

import { useCallback } from "react"
import Link from "next/link"
import { useCoachStore } from "@/stores/coach-store"
import { TrainingLayout } from "@/components/poker/coach/training-layout"
import { TrainingSettings } from "@/components/poker/coach/training-settings"
import { History } from "lucide-react"
import { CoachSkeleton } from "@/components/ui/skeleton-page"

function CoachErrorDisplay({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-sm w-full text-center space-y-4">
        <div className="size-16 mx-auto rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <span className="text-2xl">!</span>
        </div>
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-red-400">加载失败</h2>
          <p className="text-xs text-muted-foreground/70">{message}</p>
        </div>
        <button
          onClick={onRetry}
          className="px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          重试
        </button>
      </div>
    </div>
  )
}

export default function CoachPage() {
  const { currentSession, endSession, error, reset, setLoading } = useCoachStore()

  const isSessionActive = currentSession?.status === "in_progress"

  const handleBack = useCallback(() => {
    if (currentSession) {
      endSession("complete")
    }
  }, [currentSession, endSession])

  const handleRetry = useCallback(() => {
    reset()
    setLoading(false)
  }, [reset, setLoading])

  // Error state
  if (error) {
    return <CoachErrorDisplay message={error} onRetry={handleRetry} />
  }

  // Active training session -> show game
  if (isSessionActive && currentSession) {
    return (
      <div className="min-h-screen bg-background">
        {/* Game header */}
        <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-2">
            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="text-[10px] text-muted-foreground/50 hover:text-muted-foreground/70 transition-colors"
              >
                ← 返回首页
              </Link>
              <span className="text-[10px] text-muted-foreground/20">|</span>
              <span className="text-xs font-semibold text-muted-foreground/70">AI 教练</span>
            </div>
            <Link
              href="/coach/sessions"
              className="flex items-center gap-1 text-[10px] text-muted-foreground/50 hover:text-muted-foreground/70 transition-colors"
            >
              <History className="size-3" />
              历史记录
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-4 py-4 h-[calc(100vh-40px)]">
          <TrainingLayout onBack={handleBack} />
        </main>
      </div>
    )
  }

  // No active session -> show settings
  return (
    <div className="min-h-screen bg-background">
      {/* Settings header */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-2">
          <Link
            href="/"
            className="flex items-center gap-1 text-[10px] text-muted-foreground/50 hover:text-muted-foreground/70 transition-colors"
          >
            ← 返回首页
          </Link>
          <Link
            href="/coach/sessions"
            className="flex items-center gap-1 text-[10px] text-muted-foreground/50 hover:text-muted-foreground/70 transition-colors"
          >
            <History className="size-3" />
            历史记录
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4">
        <TrainingSettings />
      </main>
    </div>
  )
}
