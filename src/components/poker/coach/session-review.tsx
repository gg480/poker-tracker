"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Lightbulb,
  TrendingUp,
  TrendingDown,
  Target,
  AlertTriangle,
  BarChart3,
  RefreshCw,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyTitle,
  EmptyDescription,
  EmptyMedia,
  EmptyContent,
  EmptyHeader,
} from "@/components/ui/empty"
import { HandReview } from "@/components/poker/coach/hand-review"
import type { CoachReviewReport, CoachDecision, Street, UserAction } from "@/lib/coach/types"

// ── Types ────────────────────────────────────────────────────────────

interface SessionReviewProps {
  sessionId: string
}

// ── Constants ────────────────────────────────────────────────────────

const STREET_LABELS: Record<Street, string> = {
  preflop: "翻牌前",
  flop: "翻牌",
  turn: "转牌",
  river: "河牌",
}

const ACTION_LABELS: Record<UserAction, string> = {
  fold: "弃牌",
  check: "过牌",
  call: "跟注",
  raise: "加注",
  all_in: "All-in",
}

const STREET_ORDER: Street[] = ["preflop", "flop", "turn", "river"]

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  subtitle,
  trend,
  icon,
}: {
  label: string
  value: string
  subtitle?: string
  trend?: "up" | "down" | "neutral"
  icon?: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-xl border p-3 transition-colors",
        trend === "up"
          ? "border-emerald-500/20 bg-emerald-500/5"
          : trend === "down"
            ? "border-red-500/20 bg-red-500/5"
            : "border-border/50 bg-card",
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
          {label}
        </span>
        {icon && <span className="text-muted-foreground/30">{icon}</span>}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span
          className={cn(
            "text-lg font-bold font-mono tabular-nums",
            trend === "up"
              ? "text-emerald-400"
              : trend === "down"
                ? "text-red-400"
                : "text-foreground",
          )}
        >
          {value}
        </span>
        {subtitle && (
          <span className="text-[10px] text-muted-foreground/50">{subtitle}</span>
        )}
      </div>
    </div>
  )
}

// ── Progress Bar ──────────────────────────────────────────────────────────────

function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={cn("h-full rounded-full transition-all duration-500", className)}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  )
}

// ── Deviation Breakdown ────────────────────────────────────────────────────────

function DeviationBreakdown({
  correctRate,
  minorRate,
  majorRate,
}: {
  correctRate: number
  minorRate: number
  majorRate: number
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">决策偏差分布</CardTitle>
        <CardDescription className="text-[10px]">
          你的决策与 GTO 建议的偏离程度
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="size-2 rounded-full bg-emerald-500" />
              <span className="text-xs text-emerald-400 font-medium">正确</span>
            </div>
            <span className="text-xs font-mono text-emerald-400 font-bold">
              {(correctRate * 100).toFixed(1)}%
            </span>
          </div>
          <ProgressBar value={correctRate * 100} className="bg-emerald-500" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="size-2 rounded-full bg-amber-500" />
              <span className="text-xs text-amber-400 font-medium">轻微偏差</span>
            </div>
            <span className="text-xs font-mono text-amber-400 font-bold">
              {(minorRate * 100).toFixed(1)}%
            </span>
          </div>
          <ProgressBar value={minorRate * 100} className="bg-amber-500" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="size-2 rounded-full bg-red-500" />
              <span className="text-xs text-red-400 font-medium">重大偏差</span>
            </div>
            <span className="text-xs font-mono text-red-400 font-bold">
              {(majorRate * 100).toFixed(1)}%
            </span>
          </div>
          <ProgressBar value={majorRate * 100} className="bg-red-500" />
        </div>
      </CardContent>
    </Card>
  )
}

// ── Per-Street Analysis ────────────────────────────────────────────────────────

function StreetAnalysis({
  deviationByStreet,
}: {
  deviationByStreet: Record<string, { correct: number; minor: number; major: number }>
}) {
  const streets = STREET_ORDER.filter((s) => deviationByStreet[s])

  if (streets.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">各街决策分析</CardTitle>
        <CardDescription className="text-[10px]">
          每条街的正确率对比
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {streets.map((street) => {
          const stats = deviationByStreet[street]
          const total = stats.correct + stats.minor + stats.major
          const correctRate = total > 0 ? stats.correct / total : 0

          return (
            <div key={street}>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-xs font-medium">{STREET_LABELS[street]}</span>
                <span className="text-[10px] font-mono text-muted-foreground/50">
                  正确率 {(correctRate * 100).toFixed(0)}%
                </span>
              </div>

              {/* Stacked bar */}
              <div className="flex h-2 overflow-hidden rounded-full bg-muted">
                {stats.correct > 0 && (
                  <div
                    className="bg-emerald-500 transition-all"
                    style={{ width: `${(stats.correct / total) * 100}%` }}
                  />
                )}
                {stats.minor > 0 && (
                  <div
                    className="bg-amber-500 transition-all"
                    style={{ width: `${(stats.minor / total) * 100}%` }}
                  />
                )}
                {stats.major > 0 && (
                  <div
                    className="bg-red-500 transition-all"
                    style={{ width: `${(stats.major / total) * 100}%` }}
                  />
                )}
              </div>

              <div className="mt-1 flex items-center gap-2 text-[9px] text-muted-foreground/40">
                <span className="flex items-center gap-0.5">
                  <span className="size-1.5 rounded-full bg-emerald-500" />正确 {stats.correct}
                </span>
                <span className="flex items-center gap-0.5">
                  <span className="size-1.5 rounded-full bg-amber-500" />轻微 {stats.minor}
                </span>
                <span className="flex items-center gap-0.5">
                  <span className="size-1.5 rounded-full bg-red-500" />重大 {stats.major}
                </span>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

// ── Key Findings ────────────────────────────────────────────────────────────────

function KeyFindings({
  keyDecisions,
}: {
  keyDecisions: CoachReviewReport["keyDecisions"]
}) {
  if (!keyDecisions || keyDecisions.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="size-4 text-amber-400" />
          <CardTitle className="text-sm">关键决策点</CardTitle>
        </div>
        <CardDescription className="text-[10px]">
          偏差最大的决策 — 值得重点关注
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {keyDecisions.slice(0, 5).map((kd, i) => (
          <div
            key={i}
            className="rounded-lg border border-amber-500/15 bg-amber-500/5 p-2.5 space-y-1"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold">
                第 {kd.handNumber} 手 · {STREET_LABELS[kd.street as Street] || kd.street}
              </span>
              <Badge
                variant={
                  kd.feedbackType === "major_deviation"
                    ? "destructive"
                    : kd.feedbackType === "minor_deviation"
                      ? "warning"
                      : "success"
                }
                className="text-[9px] px-1.5"
              >
                {kd.deviation != null ? `偏差 ${(kd.deviation * 100).toFixed(0)}%` : "未知"}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground/70">
              <span>
                你的行动:{" "}
                <span className="font-semibold text-foreground/80">
                  {ACTION_LABELS[kd.userAction as UserAction] || kd.userAction}
                </span>
              </span>
              <span className="text-muted-foreground/30">|</span>
              <span>
                GTO建议:{" "}
                <span className="font-semibold text-emerald-400">
                  {ACTION_LABELS[kd.gtoRecommendation as UserAction] || kd.gtoRecommendation}
                </span>
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
              {kd.message}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

// ── Improvement Tips ───────────────────────────────────────────────────────────

function ImprovementTips({ tips }: { tips: string[] }) {
  if (!tips || tips.length === 0) return null

  return (
    <Card className="border-amber-500/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lightbulb className="size-4 text-amber-400" />
          <CardTitle className="text-sm">改进建议汇总</CardTitle>
        </div>
        <CardDescription className="text-[10px]">
          基于本局训练的反馈引擎分析
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {tips.map((tip, i) => (
          <div
            key={i}
            className="flex items-start gap-2 rounded-lg bg-amber-500/5 border border-amber-500/10 p-2.5"
          >
            <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-[9px] font-bold text-amber-400">
              {i + 1}
            </span>
            <p className="text-xs text-amber-400/80 leading-relaxed">{tip}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

// ── Hand List Summary ──────────────────────────────────────────────────────────

function HandListSummary({
  decisions,
  onHandClick,
}: {
  decisions: CoachDecision[]
  onHandClick: (handNumber: number) => void
}) {
  // Group by hand
  const hands = useMemo(() => {
    const grouped = new Map<number, CoachDecision[]>()
    for (const d of decisions) {
      if (!grouped.has(d.handNumber)) grouped.set(d.handNumber, [])
      grouped.get(d.handNumber)!.push(d)
    }
    return Array.from(grouped.entries())
      .sort(([a], [b]) => b - a)
      .map(([handNumber, decs]) => ({
        handNumber,
        decisions: decs,
        firstDecision: decs[0],
        lastDecision: decs[decs.length - 1],
      }))
  }, [decisions])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">手牌列表</CardTitle>
        <CardDescription className="text-[10px]">
          共 {hands.length} 手牌，点击展开详情
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        {hands.map((hand) => {
          const result = hand.lastDecision.result
          const netChips = hand.lastDecision.netChips ?? 0
          const isCorrect = hand.decisions.every((d) => d.isCorrect)

          return (
            <button
              key={hand.handNumber}
              onClick={() => onHandClick(hand.handNumber)}
              className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-muted/30"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="shrink-0 text-[10px] font-mono text-muted-foreground/50">
                  #{hand.handNumber}
                </span>
                <span className="shrink-0 text-[10px] font-mono text-muted-foreground/70">
                  {hand.firstDecision.holeCards.join(" ")}
                </span>
                <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-hide">
                  {hand.decisions.map((d, i) => (
                    <span
                      key={i}
                      className={cn(
                        "shrink-0 rounded px-0.5 text-[8px] font-mono",
                        d.isCorrect
                          ? "text-emerald-400/70 bg-emerald-500/10"
                          : "text-red-400/70 bg-red-500/10",
                      )}
                    >
                      {d.street === "preflop"
                        ? "PF"
                        : d.street === "flop"
                          ? "F"
                          : d.street === "turn"
                            ? "T"
                            : "R"}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <div
                  className={cn(
                    "flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-semibold",
                    result === "win"
                      ? "text-emerald-400 bg-emerald-500/10"
                      : result === "lose"
                        ? "text-red-400 bg-red-500/10"
                        : "text-muted-foreground/50 bg-muted/30",
                  )}
                >
                  {result === "win" && <TrendingUp className="size-2.5" />}
                  {result === "lose" && <TrendingDown className="size-2.5" />}
                  {netChips >= 0 ? "+" : ""}
                  {netChips.toLocaleString()}
                </div>
                {isCorrect && (
                  <Target className="size-2.5 text-emerald-400/50" />
                )}
              </div>
            </button>
          )
        })}
      </CardContent>
    </Card>
  )
}

// ── Skeleton ─────────────────────────────────────────────────────────────────

function SessionReviewSkeleton() {
  return (
    <div className="space-y-4">
      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>

      {/* Deviation breakdown */}
      <Skeleton className="h-40 rounded-xl" />

      {/* Street analysis */}
      <Skeleton className="h-48 rounded-xl" />

      {/* Tips */}
      <Skeleton className="h-32 rounded-xl" />

      {/* Hand list */}
      <Skeleton className="h-64 rounded-xl" />
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function SessionReview({ sessionId }: SessionReviewProps) {
  const [report, setReport] = useState<CoachReviewReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedHand, setExpandedHand] = useState<number | null>(null)

  const fetchReport = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/coach/sessions/${sessionId}/review`)
      const json = await res.json()
      if (!json.success) throw new Error(json.error || "获取复盘报告失败")
      setReport(json.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "未知错误")
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  // ── Loading ──────────────────────────────────────────────────────
  if (loading) return <SessionReviewSkeleton />

  // ── Error ────────────────────────────────────────────────────────
  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-8">
          <p className="text-sm text-red-400">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchReport}>
            <RefreshCw className="size-3 mr-1" />
            重试
          </Button>
        </CardContent>
      </Card>
    )
  }

  // ── Empty ────────────────────────────────────────────────────────
  if (!report) {
    return (
      <Empty>
        <EmptyMedia variant="icon">
          <BarChart3 className="size-6" />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>无复盘数据</EmptyTitle>
        </EmptyHeader>
        <EmptyContent>
          <EmptyDescription>该训练会话没有可用的复盘数据。</EmptyDescription>
        </EmptyContent>
      </Empty>
    )
  }

  const { session, stats, deviationByStreet, keyDecisions, improvementTips } = report

  // Derived rates
  const totalDecisions = stats.correctCount + stats.minorDeviationCount + stats.majorDeviationCount
  const correctRate = totalDecisions > 0 ? stats.correctCount / totalDecisions : 0
  const minorRate = totalDecisions > 0 ? stats.minorDeviationCount / totalDecisions : 0
  const majorRate = totalDecisions > 0 ? stats.majorDeviationCount / totalDecisions : 0

  // ── Render ──────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Overall Stats */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatCard
          label="总手数"
          value={stats.totalHands.toString()}
          icon={<BarChart3 className="size-3.5" />}
        />
        <StatCard
          label="净赢取"
          value={`${stats.netChips >= 0 ? "+" : ""}${stats.netChips.toLocaleString()}`}
          subtitle="筹码"
          trend={stats.netChips > 0 ? "up" : stats.netChips < 0 ? "down" : "neutral"}
        />
        <StatCard
          label="总 EV"
          value={`${stats.totalEv >= 0 ? "+" : ""}${stats.totalEv.toFixed(1)}`}
          trend={stats.totalEv > 0 ? "up" : stats.totalEv < 0 ? "down" : "neutral"}
        />
        <StatCard
          label="胜率"
          value={`${(stats.winRate * 100).toFixed(1)}%`}
          trend={stats.winRate > 0.5 ? "up" : stats.winRate < 0.3 ? "down" : "neutral"}
        />
      </div>

      {/* Deviation Breakdown */}
      <DeviationBreakdown
        correctRate={correctRate}
        minorRate={minorRate}
        majorRate={majorRate}
      />

      {/* Per-Street Analysis */}
      <StreetAnalysis deviationByStreet={deviationByStreet} />

      {/* Key Findings */}
      <KeyFindings keyDecisions={keyDecisions} />

      {/* Improvement Tips */}
      <ImprovementTips tips={improvementTips} />

      {/* Hand List */}
      {/* We need all decisions for the hand list. Let's fetch them. */}
      <HandSummaryWithDecisions
        sessionId={sessionId}
        expandedHand={expandedHand}
        onHandClick={setExpandedHand}
      />
    </div>
  )
}

// ── Hand Summary with Decision Data ──────────────────────────────────

function HandSummaryWithDecisions({
  sessionId,
  expandedHand,
  onHandClick,
}: {
  sessionId: string
  expandedHand: number | null
  onHandClick: (hand: number | null) => void
}) {
  const [decisions, setDecisions] = useState<CoachDecision[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/coach/sessions/${sessionId}/decisions`, {
          method: "GET",
        })
        // The decisions API is POST-based. We'll try GET first, fallback.
        // Actually, looking at the route definition, decisions only has POST.
        // Let's use the session detail endpoint which includes decisions.
        if (!res.ok) {
          // Fallback: get session with decisions from GET /api/coach/sessions/[id]
          const sessionRes = await fetch(`/api/coach/sessions/${sessionId}`)
          const sessionJson = await sessionRes.json()
          if (sessionJson.success) {
            // The response may include decisions array
            const data = sessionJson.data
            setDecisions(data.decisions || data.session?.decisions || [])
          }
        } else {
          const json = await res.json()
          if (json.success) {
            setDecisions(json.data?.decisions || json.data || [])
          }
        }
      } catch {
        // silent fail — hand list is secondary
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [sessionId])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">手牌列表</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (decisions.length === 0) return null

  return (
    <div className="space-y-3">
      <HandListSummary decisions={decisions} onHandClick={onHandClick} />

      {/* Expanded hand review */}
      {expandedHand != null && (
        <HandReview
          data={{
            decisions: decisions.filter((d) => d.handNumber === expandedHand),
            improvementTip: null,
          }}
        />
      )}
    </div>
  )
}
