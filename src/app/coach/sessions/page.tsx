"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { History, Play, ChevronLeft, ChevronRight, Clock, Target, BarChart3 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Empty, EmptyTitle, EmptyDescription, EmptyMedia, EmptyContent, EmptyHeader } from "@/components/ui/empty"
import { Button } from "@/components/ui/button"
import type { CoachSession, PaginatedResult, OpponentStyle } from "@/lib/coach/types"

// ── Helpers ──────────────────────────────────────────────────────────

const OPPONENT_LABELS: Record<OpponentStyle, string> = {
  aggressive: "激进型",
  passive: "被动型",
  gto: "GTO型",
}

const OPPONENT_COLORS: Record<OpponentStyle, string> = {
  aggressive: "text-red-400",
  passive: "text-blue-400",
  gto: "text-purple-400",
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return dateStr
  }
}

// ── Session Row ──────────────────────────────────────────────────────

function SessionCard({
  session,
  onViewReview,
}: {
  session: CoachSession
  onViewReview: (id: string) => void
}) {
  const isActive = session.status === "in_progress"
  const isCompleted = session.status === "completed"

  return (
    <Card
      data-clickable={!isActive}
      className={cn(
        "group transition-all duration-200",
        isActive && "border-emerald-500/30 ring-1 ring-emerald-500/10",
      )}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex size-9 items-center justify-center rounded-lg",
                isActive ? "bg-emerald-500/15 text-emerald-400" : "bg-muted text-muted-foreground",
              )}
            >
              {isActive ? (
                <Play className="size-4" />
              ) : (
                <History className="size-4" />
              )}
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">
                {isActive ? "进行中训练" : `训练会话`}
              </CardTitle>
              <p className="text-xs text-muted-foreground/60 font-mono mt-0.5">
                {formatDate(session.createdAt)}
              </p>
            </div>
          </div>
          <Badge
            variant={isActive ? "success" : isCompleted ? "secondary" : "outline"}
            className="text-[10px] capitalize"
          >
            {isActive ? "进行中" : isCompleted ? "已完成" : "已放弃"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center gap-0.5 rounded-lg bg-muted/30 p-2">
            <span className="text-[10px] text-muted-foreground/60 font-medium">对手风格</span>
            <span className={cn("text-xs font-semibold", OPPONENT_COLORS[session.opponentStyle])}>
              {OPPONENT_LABELS[session.opponentStyle]}
            </span>
          </div>
          <div className="flex flex-col items-center gap-0.5 rounded-lg bg-muted/30 p-2">
            <span className="text-[10px] text-muted-foreground/60 font-medium">手牌数</span>
            <span className="text-xs font-semibold font-mono">{session.totalHands}</span>
          </div>
          <div className="flex flex-col items-center gap-0.5 rounded-lg bg-muted/30 p-2">
            <span className="text-[10px] text-muted-foreground/60 font-medium">总 EV</span>
            <span
              className={cn(
                "text-xs font-semibold font-mono",
                session.totalEv > 0
                  ? "text-emerald-400"
                  : session.totalEv < 0
                    ? "text-red-400"
                    : "text-muted-foreground",
              )}
            >
              {session.totalEv >= 0 ? "+" : ""}
              {session.totalEv.toFixed(1)}
            </span>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          {isActive && (
            <Link
              href={`/coach/training?id=${session.id}`}
              className="flex-1"
            >
              <Button size="sm" className="w-full gap-1.5 text-xs">
                <Play className="size-3" />
                继续训练
              </Button>
            </Link>
          )}
          <Button
            size="sm"
            variant={isActive ? "outline" : "default"}
            className={cn("flex-1 gap-1.5 text-xs", !isActive && "w-full")}
            onClick={() => onViewReview(session.id)}
          >
            <BarChart3 className="size-3" />
            查看复盘
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Skeleton ─────────────────────────────────────────────────────────

function SessionsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="size-9 rounded-lg" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              <Skeleton className="h-12 rounded-lg" />
              <Skeleton className="h-12 rounded-lg" />
              <Skeleton className="h-12 rounded-lg" />
            </div>
            <Skeleton className="mt-3 h-8 rounded-lg" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ── Empty State ──────────────────────────────────────────────────────

function SessionsEmpty() {
  return (
    <Empty>
      <EmptyMedia variant="icon">
        <Target className="size-6" />
      </EmptyMedia>
      <EmptyHeader>
        <EmptyTitle>还没有训练记录</EmptyTitle>
      </EmptyHeader>
      <EmptyContent>
        <EmptyDescription>
          开始你的第一局吧，系统将记录你的每一手牌决策并生成复盘分析。
        </EmptyDescription>
      </EmptyContent>
      <Link href="/coach/training">
        <Button size="sm" className="gap-1.5">
          <Play className="size-3.5" />
          开始训练
        </Button>
      </Link>
    </Empty>
  )
}

// ── Pagination ───────────────────────────────────────────────────────

function PaginationBar({
  page,
  totalPages,
  onPageChange,
}: {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-center gap-2 pt-2">
      <Button
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="size-8 p-0"
      >
        <ChevronLeft className="size-4" />
      </Button>
      <span className="text-xs text-muted-foreground font-mono tabular-nums">
        {page} / {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="size-8 p-0"
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────

export default function CoachSessionsPage() {
  const router = useRouter()
  const [sessions, setSessions] = useState<CoachSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const limit = 10

  const [activeFilter, setActiveFilter] = useState("all")

  const fetchSessions = useCallback(async (pageNum: number, status?: string) => {
    setLoading(true)
    setError(null)
    try {
      const statusParam = status && status !== "all" ? `&status=${status}` : ""
      const res = await fetch(`/api/coach/sessions?page=${pageNum}&limit=${limit}${statusParam}`)
      const json = await res.json()
      if (!json.success) throw new Error(json.error || "获取失败")
      const data = json.data as PaginatedResult<CoachSession>
      setSessions(data.items)
      setTotalPages(data.totalPages)
    } catch (err) {
      setError(err instanceof Error ? err.message : "未知错误")
      setSessions([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSessions(page, activeFilter)
  }, [page, activeFilter, fetchSessions])

  const handleFilterChange = useCallback((status: string) => {
    setActiveFilter(status)
    setPage(1)
    setSessions([])
  }, [])

  const handleViewReview = useCallback(
    (id: string) => {
      router.push(`/coach/sessions/${id}/review`)
    },
    [router],
  )

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [])

  // ── Render ─────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link
              href="/coach"
              className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors"
            >
              <ChevronLeft className="size-4" />
            </Link>
            <div>
              <h1 className="text-sm font-bold">训练历史</h1>
              <p className="text-[10px] text-muted-foreground/60">回顾和分析你的训练记录</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground/50">
            <Clock className="size-3" />
            <span>共 {sessions.length} 条</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-2xl px-4 py-4">
        {/* Status Filter */}
        <div className="mb-4 flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
          {["all", "in_progress", "completed", "abandoned"].map((status) => (
            <button
              key={status}
              onClick={() => handleFilterChange(status)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
                activeFilter === status
                  ? "bg-primary/10 text-primary ring-1 ring-primary/20"
                  : "text-muted-foreground/60 hover:text-muted-foreground",
              )}
            >
              {status === "all"
                ? "全部"
                : status === "in_progress"
                  ? "进行中"
                  : status === "completed"
                    ? "已完成"
                    : "已放弃"}
            </button>
          ))}
        </div>

        {/* Error State */}
        {error && (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-center">
            <p className="text-sm text-red-400">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchSessions(page, activeFilter)}
            >
              重试
            </Button>
          </div>
        )}

        {/* Loading State */}
        {loading && !error && <SessionsSkeleton />}

        {/* Empty State */}
        {!loading && !error && sessions.length === 0 && <SessionsEmpty />}

        {/* Session List */}
        {!loading && !error && sessions.length > 0 && (
          <>
            <div className="space-y-3">
              {sessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  onViewReview={handleViewReview}
                />
              ))}
            </div>

            <PaginationBar
              page={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </main>
    </div>
  )
}
