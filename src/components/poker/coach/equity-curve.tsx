"use client"

import { useMemo, useState } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts"

import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Empty,
  EmptyTitle,
  EmptyDescription,
  EmptyMedia,
  EmptyContent,
  EmptyHeader,
} from "@/components/ui/empty"
import { TrendingUp } from "lucide-react"
import type { CoachDecision, Street } from "@/lib/coach/types"

// ── Types ────────────────────────────────────────────────────────────

export interface EquityCurveDataPoint {
  /** Street label for x-axis */
  street: string
  /** Numeric street index (0-3) */
  streetIndex: number
  /** Equity value (0-1) */
  equity: number
  /** Hand number this point belongs to */
  handNumber: number
}

export interface EquityCurveProps {
  decisions: CoachDecision[]
  /** Height of the chart in px */
  height?: number
  loading?: boolean
  error?: string | null
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

const STREET_INDEX: Record<Street, number> = {
  preflop: 0,
  flop: 1,
  turn: 2,
  river: 3,
}

/** Generate a deterministic color from a hand number */
function getHandColor(index: number): string {
  const colors = [
    "#22c55e", "#ef4444", "#3b82f6", "#f59e0b", "#8b5cf6",
    "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#84cc16",
  ]
  return colors[index % colors.length]
}

/** Generate a lighter fill color */
function getHandFillColor(hex: string): string {
  return `${hex}15`
}

// ── Custom Dot ───────────────────────────────────────────────────────

function EquityDot({
  cx,
  cy,
  stroke,
  payload,
  isAhead,
}: {
  cx?: number
  cy?: number
  stroke?: string
  payload?: EquityCurveDataPoint
  isAhead?: boolean
}) {
  if (cx == null || cy == null) return null

  const color = isAhead != null
    ? isAhead
      ? "#22c55e"
      : "#ef4444"
    : stroke || "#888"

  return (
    <circle
      cx={cx}
      cy={cy}
      r={3}
      fill={color}
      stroke="white"
      strokeWidth={1.5}
      className="drop-shadow-sm"
    />
  )
}

// ── Custom Tooltip ───────────────────────────────────────────────────

function EquityTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ value: number; name: string; color: string; payload: EquityCurveDataPoint }>
  label?: string
}) {
  if (!active || !payload || payload.length === 0) return null

  return (
    <div className="rounded-lg border border-border/50 bg-background/95 px-3 py-2 text-xs shadow-lg backdrop-blur-md">
      <p className="mb-1 font-semibold text-muted-foreground">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground/70">
              第 {entry.payload.handNumber} 手
            </span>
          </div>
          <span className="font-mono font-bold tabular-nums">
            {(entry.value * 100).toFixed(1)}%
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────────────

export function EquityCurve({
  decisions,
  height = 300,
  loading = false,
  error = null,
  onRetry,
}: EquityCurveProps) {
  const [selectedHands, setSelectedHands] = useState<Set<number> | null>(null)

  // Build chart data: for each hand, track equity across streets
  const { chartData, allHands, handColors } = useMemo(() => {
    // Group decisions by hand number
    const grouped = new Map<number, Map<Street, number>>()
    const handSet = new Set<number>()

    for (const d of decisions) {
      if (d.equity == null) continue
      handSet.add(d.handNumber)
      if (!grouped.has(d.handNumber)) grouped.set(d.handNumber, new Map())
      grouped.get(d.handNumber)!.set(d.street, d.equity)
    }

    const sortedHands = Array.from(handSet).sort((a, b) => a - b)
    const colors: Record<string, string> = {}
    sortedHands.forEach((h, i) => {
      colors[String(h)] = getHandColor(i)
    })

    // Build x-axis data points (one per street)
    const data: EquityCurveDataPoint[] = []
    for (const street of STREET_ORDER) {
      for (const handNum of sortedHands) {
        const streetEquity = grouped.get(handNum)?.get(street)
        if (streetEquity != null) {
          data.push({
            street: STREET_LABELS[street],
            streetIndex: STREET_INDEX[street],
            equity: streetEquity,
            handNumber: handNum,
          })
        }
      }
    }

    return {
      chartData: data,
      allHands: sortedHands,
      handColors: colors,
    }
  }, [decisions])

  // Transform data for Recharts: one row per street, one column per hand
  const rechartsData = useMemo(() => {
    if (chartData.length === 0) return []

    // Group by street
    const byStreet = new Map<string, Record<string, number>>()
    for (const pt of chartData) {
      if (!byStreet.has(pt.street)) byStreet.set(pt.street, {})
      const row = byStreet.get(pt.street)!
      row[String(pt.handNumber)] = pt.equity
    }

    const selected = selectedHands
    return STREET_ORDER.map((street) => {
      const label = STREET_LABELS[street]
      const row = byStreet.get(label) || {}
      const entry: Record<string, string | number> = { street: label }
      for (const handNum of allHands) {
        if (selected && !selected.has(handNum)) continue
        if (row[String(handNum)] != null) {
          entry[String(handNum)] = row[String(handNum)]
        }
      }
      return entry
    })
  }, [chartData, allHands, selectedHands])

  // Toggle hand visibility in chart
  const toggleHand = (handNum: number) => {
    setSelectedHands((prev) => {
      if (!prev) {
        const set = new Set(allHands)
        set.delete(handNum)
        return set.size < allHands.length ? set : null
      }
      const next = new Set(prev)
      if (next.has(handNum)) {
        next.delete(handNum)
        return next.size === 0 ? null : next
      }
      next.add(handNum)
      return next.size === allHands.length ? null : next
    })
  }

  // ── Loading ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-40 mt-1" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full rounded-lg" />
        </CardContent>
      </Card>
    )
  }

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
  if (allHands.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">胜率曲线</CardTitle>
          <CardDescription className="text-[10px]">
            追踪每手牌在各条街的胜率变化
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Empty>
            <EmptyMedia variant="icon">
              <TrendingUp className="size-6" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>暂无数据</EmptyTitle>
            </EmptyHeader>
            <EmptyContent>
              <EmptyDescription>
                完成一些手牌后，这里将展示各手牌的胜率变化曲线。
              </EmptyDescription>
            </EmptyContent>
          </Empty>
        </CardContent>
      </Card>
    )
  }

  // ── Render ──────────────────────────────────────────────────────
  const visibleHands = selectedHands
    ? allHands.filter((h) => selectedHands.has(h))
    : allHands

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm">胜率曲线</CardTitle>
            <CardDescription className="text-[10px]">
              各手牌在翻牌前 → 翻牌 → 转牌 → 河牌的胜率变化
            </CardDescription>
          </div>
        </div>
        {/* Legend / toggles */}
        <div className="mt-2 flex flex-wrap gap-1">
          {allHands.map((handNum) => {
            const isVisible = !selectedHands || selectedHands.has(handNum)
            const color = handColors[String(handNum)]
            return (
              <button
                key={handNum}
                onClick={() => toggleHand(handNum)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-medium transition-all",
                  isVisible
                    ? "bg-muted text-foreground/80"
                    : "bg-muted/30 text-muted-foreground/40 line-through",
                )}
              >
                <span
                  className="size-1.5 rounded-full"
                  style={{ backgroundColor: color }}
                />
                第{handNum}手
              </button>
            )
          })}
        </div>
      </CardHeader>
      <CardContent>
        <div style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={rechartsData}
              margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border) / 0.3)"
                vertical={false}
              />
              <XAxis
                dataKey="street"
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground) / 0.6)" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[0, 1]}
                tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground) / 0.6)" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<EquityTooltip />} />
              <ReferenceLine
                y={0.5}
                stroke="hsl(var(--muted-foreground) / 0.3)"
                strokeDasharray="4 4"
                strokeWidth={1}
              />

              {visibleHands.map((handNum) => {
                const color = handColors[String(handNum)]
                return (
                  <Line
                    key={handNum}
                    type="monotone"
                    dataKey={String(handNum)}
                    name={`第${handNum}手`}
                    stroke={color}
                    strokeWidth={2}
                    dot={(props: { cx?: number; cy?: number; payload?: Record<string, unknown> }) => {
                      const payload = props.payload as Record<string, number | string> | undefined
                      const equity = payload?.[String(handNum)] as number | undefined
                      return (
                        <EquityDot
                          cx={props.cx}
                          cy={props.cy}
                          stroke={color}
                          payload={undefined}
                          isAhead={equity != null ? equity >= 0.5 : undefined}
                        />
                      )
                    }}
                    activeDot={{ r: 4, strokeWidth: 2 }}
                    connectNulls={false}
                  />
                )
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
