"use client"

import { useMemo, useState } from "react"
import { ChevronDown, ChevronUp, Lightbulb, TrendingUp, TrendingDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { PokerCard, parseCardCode } from "@/components/poker/hand/poker-card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Empty, EmptyTitle, EmptyDescription, EmptyMedia, EmptyContent, EmptyHeader } from "@/components/ui/empty"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import type { CoachDecision, Street, GTOAction, UserAction } from "@/lib/coach/types"

// ── Types ────────────────────────────────────────────────────────────

export interface HandReviewData {
  decisions: CoachDecision[]
  improvementTip?: string | null
}

interface HandReviewProps {
  data?: HandReviewData | null
  loading?: boolean
  error?: string | null
  /** Whether to start expanded (default: false) */
  defaultOpen?: boolean
  onRetry?: () => void
}

// ── Constants ────────────────────────────────────────────────────────

const STREET_LABELS: Record<Street, string> = {
  preflop: "翻牌前",
  flop: "翻牌",
  turn: "转牌",
  river: "河牌",
}

const STREET_ORDER: Street[] = ["preflop", "flop", "turn", "river"]

const ACTION_LABELS: Record<UserAction, string> = {
  fold: "弃牌",
  check: "过牌",
  call: "跟注",
  raise: "加注",
  all_in: "All-in",
}

const ACTION_COLORS: Record<UserAction, string> = {
  fold: "text-red-400 bg-red-500/10",
  check: "text-amber-400 bg-amber-500/10",
  call: "text-blue-400 bg-blue-500/10",
  raise: "text-purple-400 bg-purple-500/10",
  all_in: "text-rose-400 bg-rose-500/10",
}

const GTO_LABELS: Record<GTOAction, string> = {
  fold: "弃牌",
  check: "过牌",
  call: "跟注",
  raise: "加注",
}

function getDeviationLabel(deviation: number | null): {
  label: string
  color: string
  variant: "success" | "warning" | "destructive" | "outline"
} {
  if (deviation === null || deviation === undefined) {
    return { label: "未知", color: "text-muted-foreground", variant: "outline" }
  }
  if (deviation <= 0.3) return { label: "正确决策", color: "text-emerald-400", variant: "success" }
  if (deviation <= 0.7) return { label: "轻微偏差", color: "text-amber-400", variant: "warning" }
  return { label: "重大偏差", color: "text-red-400", variant: "destructive" }
}

function getHandResultLabel(result: string | null): {
  label: string
  color: string
  icon: typeof TrendingUp | typeof TrendingDown | null
} {
  switch (result) {
    case "win":
      return { label: "获胜", color: "text-emerald-400", icon: TrendingUp }
    case "lose":
      return { label: "失利", color: "text-red-400", icon: TrendingDown }
    case "fold":
      return { label: "弃牌", color: "text-muted-foreground", icon: null }
    default:
      return { label: "未完成", color: "text-muted-foreground", icon: null }
  }
}

// ── Card Utilities (re-exports from poker-card) ──────────────────────

function CardView({ code, size = "sm" }: { code: string; size?: "sm" | "md" }) {
  const parsed = parseCardCode(code)
  if (!parsed) {
    return (
      <div className="flex size-8 items-center justify-center rounded-md bg-muted/20 text-[9px] text-muted-foreground/50 font-mono">
        ?
      </div>
    )
  }
  return <PokerCard suit={parsed.suit} rank={parsed.rank} size={size} />
}

function CardsRow({ codes, label }: { codes: string[]; label?: string }) {
  if (codes.length === 0) return null
  return (
    <div className="flex items-center gap-1">
      {label && <span className="text-[9px] text-muted-foreground/50 mr-1">{label}</span>}
      {codes.map((code, i) => (
        <CardView key={`${code}-${i}`} code={code} />
      ))}
    </div>
  )
}

// ── Street Decision Row ──────────────────────────────────────────────

function StreetDecisionRow({
  street,
  decision,
  isLast,
}: {
  street: Street
  decision?: CoachDecision
  isLast: boolean
}) {
  const hasDecision = !!decision
  const deviationInfo = decision ? getDeviationLabel(decision.deviation) : null
  const equityPct = decision?.equity != null ? (decision.equity * 100).toFixed(1) : null
  const potOddsPct = decision?.potOdds != null ? (decision.potOdds * 100).toFixed(1) : null

  return (
    <div className="relative pl-6 pb-4">
      {/* Timeline connector */}
      {!isLast && (
        <div className="absolute left-[11px] top-5 bottom-0 w-px bg-border/40" />
      )}
      {/* Timeline dot */}
      <div
        className={cn(
          "absolute left-[5px] top-1.5 size-3 rounded-full border-2",
          hasDecision
            ? "bg-primary border-primary/30"
            : "bg-muted border-border/40",
        )}
      />

      <div className="space-y-1.5">
        {/* Street header */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold">{STREET_LABELS[street]}</span>
          {deviationInfo && (
            <Badge variant={deviationInfo.variant} className="text-[9px] px-1.5 py-0">
              {deviationInfo.label}
            </Badge>
          )}
        </div>

        {!hasDecision ? (
          <p className="text-[10px] text-muted-foreground/40 italic">无行动记录</p>
        ) : (
          <div className="space-y-1">
            {/* Board cards context */}
            {decision.boardCards && decision.boardCards.length > 0 && (
              <CardsRow codes={decision.boardCards} />
            )}

            {/* Action comparison */}
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-lg bg-muted/20 p-2">
              {/* User action */}
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-[9px] text-muted-foreground/50">你的行动</span>
                <span
                  className={cn(
                    "text-xs font-bold px-2 py-0.5 rounded",
                    ACTION_COLORS[decision.userAction],
                  )}
                >
                  {ACTION_LABELS[decision.userAction]}
                  {decision.userBetAmount > 0 && ` ${decision.userBetAmount.toLocaleString()}`}
                </span>
              </div>

              {/* VS */}
              <div className="text-[9px] text-muted-foreground/30 font-medium">VS</div>

              {/* GTO recommendation */}
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-[9px] text-muted-foreground/50">GTO 建议</span>
                <span className="text-xs font-bold text-muted-foreground/70 px-2 py-0.5 rounded bg-muted/30">
                  {decision.gtoRecommendation
                    ? `${GTO_LABELS[decision.gtoRecommendation]}${decision.gtoFrequency != null ? ` (${(decision.gtoFrequency * 100).toFixed(0)}%)` : ""}`
                    : "暂无建议"}
                </span>
              </div>
            </div>

            {/* Metrics row */}
            <div className="flex items-center gap-2 text-[10px]">
              {equityPct && (
                <span className="inline-flex items-center gap-0.5 rounded bg-blue-500/10 px-1.5 py-0.5 text-blue-400 font-mono">
                  胜率 {equityPct}%
                </span>
              )}
              {potOddsPct && (
                <span className="inline-flex items-center gap-0.5 rounded bg-amber-500/10 px-1.5 py-0.5 text-amber-400 font-mono">
                  赔率 {potOddsPct}%
                </span>
              )}
              {decision.ev != null && (
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 font-mono",
                    decision.ev >= 0
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-red-500/10 text-red-400",
                  )}
                >
                  EV {decision.ev >= 0 ? "+" : ""}
                  {decision.ev.toFixed(1)}
                </span>
              )}
            </div>

            {/* Opponent response */}
            {decision.opponentAction && (
              <div className="flex items-center gap-1 text-[9px] text-muted-foreground/50">
                <span>对手:</span>
                <span className="font-semibold text-muted-foreground/70">
                  {ACTION_LABELS[decision.opponentAction]}
                  {decision.opponentBetAmount > 0 && ` ${decision.opponentBetAmount.toLocaleString()}`}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Hand Review Skeleton ─────────────────────────────────────────────

function HandReviewSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-3 w-48 mt-1" />
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-4 w-48" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

// ── Hand Review Empty ────────────────────────────────────────────────

function HandReviewEmpty() {
  return (
    <Empty>
      <EmptyMedia variant="icon">
        <TrendingUp className="size-6" />
      </EmptyMedia>
      <EmptyHeader>
        <EmptyTitle>无手牌记录</EmptyTitle>
      </EmptyHeader>
      <EmptyContent>
        <EmptyDescription>这局训练还没有记录任何手牌数据。</EmptyDescription>
      </EmptyContent>
    </Empty>
  )
}

// ── Main Component ───────────────────────────────────────────────────

export function HandReview({
  data,
  loading = false,
  error = null,
  defaultOpen = false,
  onRetry,
}: HandReviewProps) {
  const [expanded, setExpanded] = useState(defaultOpen)

  // Group decisions by hand
  const hands = useMemo(() => {
    if (!data?.decisions || data.decisions.length === 0) return []
    const grouped = new Map<number, CoachDecision[]>()
    for (const d of data.decisions) {
      if (!grouped.has(d.handNumber)) grouped.set(d.handNumber, [])
      grouped.get(d.handNumber)!.push(d)
    }
    return Array.from(grouped.entries())
      .sort(([a], [b]) => a - b)
      .map(([handNumber, decisions]) => ({
        handNumber,
        decisions: decisions.sort(
          (a, b) => STREET_ORDER.indexOf(a.street) - STREET_ORDER.indexOf(b.street),
        ),
      }))
  }, [data])

  // ── Loading ──────────────────────────────────────────────────────
  if (loading) return <HandReviewSkeleton />

  // ── Error ────────────────────────────────────────────────────────
  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-8">
          <p className="text-sm text-red-400">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-xs text-muted-foreground/60 hover:text-muted-foreground underline underline-offset-2"
            >
              重试
            </button>
          )}
        </CardContent>
      </Card>
    )
  }

  // ── Empty ────────────────────────────────────────────────────────
  if (!data || hands.length === 0) return <HandReviewEmpty />

  // ── Render all hands ─────────────────────────────────────────────
  return (
    <div className="space-y-3">
      {hands.map(({ handNumber, decisions }) => {
        const firstDec = decisions[0]
        const lastDec = decisions[decisions.length - 1]
        const result = lastDec.result
        const netChips = lastDec.netChips ?? 0
        const resultInfo = getHandResultLabel(result)
        const ResultIcon = resultInfo.icon

        return (
          <Card key={handNumber} className="overflow-hidden">
            {/* Hand header - clickable toggle */}
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full text-left"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {/* Hole cards */}
                    <div className="flex items-center gap-0.5">
                      {firstDec.holeCards.map((code, i) => (
                        <CardView key={`${code}-${i}`} code={code} size="sm" />
                      ))}
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold">
                        第 {handNumber} 手
                      </CardTitle>
                      <CardDescription className="text-[10px]">
                        {firstDec.holeCards.join(" ")}
                      </CardDescription>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Result badge */}
                    <div
                      className={cn(
                        "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        result === "win"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : result === "lose"
                            ? "bg-red-500/15 text-red-400"
                            : "bg-muted text-muted-foreground",
                      )}
                    >
                      {ResultIcon && <ResultIcon className="size-3" />}
                      {resultInfo.label}
                      {result && (
                        <span className="font-mono">
                          {netChips >= 0 ? "+" : ""}
                          {netChips.toLocaleString()}
                        </span>
                      )}
                    </div>

                    {/* Expand toggle */}
                    {expanded ? (
                      <ChevronUp className="size-4 text-muted-foreground/50" />
                    ) : (
                      <ChevronDown className="size-4 text-muted-foreground/50" />
                    )}
                  </div>
                </div>
              </CardHeader>
            </button>

            {/* Expanded detail */}
            {expanded && (
              <CardContent className="pt-0">
                {/* Timeline of streets */}
                <div className="space-y-0">
                  {STREET_ORDER.map((street, idx) => {
                    const decision = decisions.find((d) => d.street === street)
                    return (
                      <StreetDecisionRow
                        key={street}
                        street={street}
                        decision={decision}
                        isLast={idx === STREET_ORDER.length - 1}
                      />
                    )
                  })}
                </div>

                {/* Improvement tip */}
                {data.improvementTip && (
                  <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
                    <Lightbulb className="size-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-amber-400 mb-0.5">改进建议</p>
                      <p className="text-[10px] text-amber-400/70 leading-relaxed">
                        {data.improvementTip}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        )
      })}
    </div>
  )
}
