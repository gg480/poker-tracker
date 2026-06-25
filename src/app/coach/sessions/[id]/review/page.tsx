"use client"

import { use, useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import { SessionReview } from "@/components/poker/coach/session-review"
import { EquityCurve } from "@/components/poker/coach/equity-curve"
import { GTORangeGrid } from "@/components/poker/coach/gto-range-grid"
import type { CoachDecision } from "@/lib/coach/types"

// ── Props ────────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ id: string }>
}

// ── Page ─────────────────────────────────────────────────────────────

export default function SessionReviewPage({ params }: PageProps) {
  const router = useRouter()
  const { id } = use(params)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors"
            >
              <ChevronLeft className="size-4" />
            </button>
            <div>
              <h1 className="text-sm font-bold">训练复盘</h1>
              <p className="text-[10px] text-muted-foreground/60">
                回顾分析你的决策表现
              </p>
            </div>
          </div>
          <Link
            href="/coach/sessions"
            className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          >
            历史列表
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-3xl space-y-4 px-4 py-4">
        {/* Session Review Report */}
        <SessionReview sessionId={id} />

        {/* Equity Curve */}
        <EquityCurveWithFetch sessionId={id} />

        {/* GTO Range Reference */}
        <GTORangeGrid compact />
      </main>
    </div>
  )
}

// ── Equity Curve Wrapper (fetches decisions) ────────────────────────

function EquityCurveWithFetch({ sessionId }: { sessionId: string }) {
  const fetchDecisions = useCallback(async () => {
    try {
      const res = await fetch(`/api/coach/sessions/${sessionId}`)
      const json = await res.json()
      if (!json.success) throw new Error("获取失败")
      const data = json.data
      return data.decisions || []
    } catch {
      return []
    }
  }, [sessionId])

  return (
    <EquityCurveFetchWrapper fetchFn={fetchDecisions} sessionId={sessionId} />
  )
}

function EquityCurveFetchWrapper({
  fetchFn,
  sessionId,
}: {
  fetchFn: () => Promise<CoachDecision[]>
  sessionId: string
}) {
  const [decisions, setDecisions] = useState<CoachDecision[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchFn()
      setDecisions(Array.isArray(data) ? data : [])
    } catch {
      setError("Failed to load equity data")
    } finally {
      setLoading(false)
    }
  }, [fetchFn])

  useEffect(() => {
    load()
  }, [load])

  return (
    <EquityCurve
      decisions={decisions}
      loading={loading}
      error={error}
      onRetry={load}
    />
  )
}
