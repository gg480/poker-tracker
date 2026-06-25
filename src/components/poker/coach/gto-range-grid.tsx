"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { RefreshCw, Info } from "lucide-react"

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
import type { Position, GTOAction } from "@/lib/coach/types"
import { getRangeByPosition } from "@/lib/coach/gto-engine"

// ── Types ────────────────────────────────────────────────────────────

export interface GTORangeGridProps {
  /** If provided, fetches from API instead of local data */
  sessionId?: string
  /** Fixed position (overrides selector) */
  position?: Position
  /** Allow user to select position (default: true) */
  allowPositionSelect?: boolean
  /** Height constraint for the grid */
  compact?: boolean
}

interface RangesData {
  raise: string[]
  call: string[]
  fold: string[]
  threeBet?: string[]
}

// ── Constants ────────────────────────────────────────────────────────

const RANKS = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"]

const POSITIONS: Position[] = ["UTG", "MP", "CO", "BTN", "SB", "BB"]

const POSITION_LABELS: Record<Position, string> = {
  UTG: "UTG (枪口)",
  MP: "MP (中间)",
  CO: "CO (关煞)",
  BTN: "BTN (按钮)",
  SB: "SB (小盲)",
  BB: "BB (大盲)",
}

type RangeAction = "raise" | "call" | "fold" | "threeBet"

const ACTION_CONFIG: Record<
  RangeAction,
  { label: string; bg: string; text: string; border: string }
> = {
  raise: {
    label: "加注",
    bg: "bg-emerald-500/25",
    text: "text-emerald-400",
    border: "border-emerald-500/30",
  },
  call: {
    label: "跟注",
    bg: "bg-amber-500/25",
    text: "text-amber-400",
    border: "border-amber-500/30",
  },
  fold: {
    label: "弃牌",
    bg: "bg-red-500/20",
    text: "text-red-400",
    border: "border-red-500/20",
  },
  threeBet: {
    label: "3-Bet",
    bg: "bg-blue-500/25",
    text: "text-blue-400",
    border: "border-blue-500/30",
  },
}

const LEGEND_ITEMS: Array<{ action: RangeAction; label: string }> = [
  { action: "raise", label: "加注" },
  { action: "threeBet", label: "3-Bet" },
  { action: "call", label: "跟注" },
  { action: "fold", label: "弃牌" },
]

// ── Helpers ──────────────────────────────────────────────────────────

/** Generate all 169 hand combinations as strings (e.g., "AKs", "AKo", "AA") */
function generateAllHands(): string[] {
  const hands: string[] = []
  for (let i = 0; i < RANKS.length; i++) {
    for (let j = 0; j < RANKS.length; j++) {
      if (i === j) {
        // Pairs
        hands.push(`${RANKS[i]}${RANKS[j]}`)
      } else if (i < j) {
        // Suited (higher rank first)
        hands.push(`${RANKS[i]}${RANKS[j]}s`)
        // Offsuit
        hands.push(`${RANKS[j]}${RANKS[i]}o`)
      }
    }
  }
  return hands
}

/** Determine action for a hand given ranges */
function getHandAction(
  hand: string,
  ranges: RangesData | null,
): { action: RangeAction | null; isPrimary: boolean } {
  if (!ranges) return { action: null, isPrimary: false }

  if (ranges.threeBet?.includes(hand)) {
    return { action: "threeBet", isPrimary: true }
  }
  if (ranges.raise?.includes(hand)) {
    return { action: "raise", isPrimary: true }
  }
  if (ranges.call?.includes(hand)) {
    return { action: "call", isPrimary: true }
  }
  if (ranges.fold?.includes(hand)) {
    return { action: "fold", isPrimary: false }
  }
  return { action: null, isPrimary: false }
}

/** Format hand for display in the cell */
function formatHandForCell(hand: string): { top: string; bottom: string } {
  if (hand.length === 2) {
    // Pair: "AA" → "A" / "A"
    return { top: hand[0], bottom: hand[1] }
  }
  if (hand.endsWith("s")) {
    // Suited: "AKs" → "A" / "K"
    return { top: hand[0], bottom: hand[1] }
  }
  // Offsuit: "AKo" → "A" / "K"
  return { top: hand[0], bottom: hand[1] }
}

// ── Grid Cell ────────────────────────────────────────────────────────

function RangeCell({
  hand,
  action,
  compact,
}: {
  hand: string
  action: RangeAction | null
  compact: boolean
}) {
  const formatted = formatHandForCell(hand)
  const config = action ? ACTION_CONFIG[action] : null

  return (
    <div
      className={cn(
        "flex items-center justify-center font-mono transition-colors",
        compact
          ? "size-6 text-[7px]"
          : "size-8 text-[9px] sm:size-10 sm:text-[10px]",
        config
          ? cn(config.bg, config.text, "border", config.border)
          : "bg-muted/20 text-muted-foreground/30 border border-transparent",
        action === "fold" && "text-red-400/60",
        compact ? "rounded-sm" : "rounded-sm sm:rounded",
      )}
      title={`${hand}: ${config?.label || "无数据"}`}
    >
      {compact ? (
        <span className="leading-none">
          {formatted.top}
          <sub className="text-[5px]" style={{ fontSize: "5px" }}>
            {hand.endsWith("s") ? "s" : hand.endsWith("o") ? "o" : ""}
          </sub>
        </span>
      ) : (
        <div className="flex flex-col items-center leading-none">
          <span>{formatted.top}</span>
          <span className="text-[7px] sm:text-[8px] opacity-60">{formatted.bottom}</span>
        </div>
      )}
    </div>
  )
}

// ── Grid Row ─────────────────────────────────────────────────────────

function RangeRow({
  rankIndex,
  ranges,
  compact,
}: {
  rankIndex: number
  ranges: RangesData | null
  compact: boolean
}) {
  const rowRank = RANKS[rankIndex]
  const cells: React.ReactNode[] = []

  for (let col = 0; col < RANKS.length; col++) {
    const colRank = RANKS[col]
    let hand: string

    if (rankIndex === col) {
      // Pair
      hand = `${rowRank}${rowRank}`
    } else if (rankIndex < col) {
      // Suited (higher rank first)
      hand = `${rowRank}${colRank}s`
    } else {
      // Offsuit (higher rank first)
      hand = `${RANKS[rankIndex]}${RANKS[col]}o`
    }

    const { action } = getHandAction(hand, ranges)
    cells.push(<RangeCell key={hand} hand={hand} action={action} compact={compact} />)
  }

  return (
    <div className="flex items-center gap-px">
      {cells}
    </div>
  )
}

// ── Skeleton ─────────────────────────────────────────────────────────

function RangeGridSkeleton({ compact }: { compact: boolean }) {
  const cellSize = compact ? "size-6" : "size-8 sm:size-10"

  return (
    <div className="space-y-px">
      {RANKS.map((_, i) => (
        <div key={i} className="flex items-center gap-px">
          {RANKS.map((_, j) => (
            <Skeleton
              key={`${i}-${j}`}
              className={cn(cellSize, "rounded-sm", compact ? "" : "sm:rounded")}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────────────

export function GTORangeGrid({
  sessionId,
  position: fixedPosition,
  allowPositionSelect = true,
  compact = false,
}: GTORangeGridProps) {
  const [selectedPosition, setSelectedPosition] = useState<Position>(
    fixedPosition || "UTG",
  )
  const [ranges, setRanges] = useState<RangesData | null>(null)
  const [apiRanges, setApiRanges] = useState<Record<string, RangesData> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch from API if sessionId provided
  const fetchRanges = useCallback(async () => {
    if (!sessionId) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/coach/gtoranges?position=${selectedPosition}`)
      const json = await res.json()
      if (!json.success) throw new Error(json.error || "获取 GTO 范围失败")
      setApiRanges(json.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "未知错误")
    } finally {
      setLoading(false)
    }
  }, [sessionId, selectedPosition])

  useEffect(() => {
    if (sessionId) fetchRanges()
  }, [sessionId, fetchRanges])

  // Derive ranges for selected position
  const currentRanges = useMemo<RangesData | null>(() => {
    if (sessionId && apiRanges) {
      const posData = apiRanges[selectedPosition]
      if (posData) return posData
    }

    // Fallback: use local engine
    try {
      const raiseHands = getRangeByPosition(selectedPosition, "raise")
      const callHands = getRangeByPosition(selectedPosition, "call")
      const foldHands = getRangeByPosition(selectedPosition, "fold")

      return {
        raise: raiseHands,
        call: callHands,
        fold: foldHands,
      }
    } catch {
      return null
    }
  }, [sessionId, apiRanges, selectedPosition])

  const handlePositionChange = useCallback(
    (pos: Position) => {
      setSelectedPosition(pos)
    },
    [],
  )

  // ── Error ────────────────────────────────────────────────────────
  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-8">
          <p className="text-sm text-red-400">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchRanges}>
            <RefreshCw className="size-3 mr-1" />
            重试
          </Button>
        </CardContent>
      </Card>
    )
  }

  // ── Empty ────────────────────────────────────────────────────────
  if (!sessionId && !currentRanges) {
    return (
      <Card>
        <CardContent>
          <Empty>
            <EmptyMedia variant="icon">
              <Info className="size-6" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>GTO 范围数据不可用</EmptyTitle>
            </EmptyHeader>
            <EmptyContent>
              <EmptyDescription>
                Preflop 范围数据未加载。请先开始训练或连接后端。
              </EmptyDescription>
            </EmptyContent>
          </Empty>
        </CardContent>
      </Card>
    )
  }

  // ── Stats for the selected position ────────────────────────────
  const stats = useMemo(() => {
    if (!currentRanges) return null
    const total = 1326 // total combos
    const raiseCount = currentRanges.raise?.length || 0
    const callCount = currentRanges.call?.length || 0
    const foldCount = currentRanges.fold?.length || 0
    const threeBetCount = currentRanges.threeBet?.length || 0
    const playedCount = raiseCount + callCount + threeBetCount

    return {
      played: playedCount,
      playedPct: ((playedCount / (raiseCount + callCount + foldCount + threeBetCount)) * 100).toFixed(1),
      raise: raiseCount,
      call: callCount,
      fold: foldCount,
      threeBet: threeBetCount,
    }
  }, [currentRanges])

  // ── Render ──────────────────────────────────────────────────────
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm">GTO Preflop 范围</CardTitle>
            <CardDescription className="text-[10px]">
              6-max Cash Game · 各位置起手牌 GTO 建议
            </CardDescription>
          </div>
          {stats && (
            <Badge variant="outline" className="text-[9px] font-mono">
              入池率 {stats.playedPct}%
            </Badge>
          )}
        </div>

        {/* Position selector */}
        {allowPositionSelect && !fixedPosition && (
          <div className="mt-2 flex flex-wrap gap-1">
            {POSITIONS.map((pos) => (
              <button
                key={pos}
                onClick={() => handlePositionChange(pos)}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-[10px] font-medium transition-all",
                  selectedPosition === pos
                    ? "bg-primary/15 text-primary ring-1 ring-primary/30"
                    : "text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted/30",
                )}
              >
                {pos}
              </button>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent>
        {/* Loading */}
        {loading && <RangeGridSkeleton compact={compact} />}

        {/* Grid */}
        {!loading && (
          <div className="space-y-1">
            {/* Column headers */}
            <div className="flex items-center gap-px pl-0">
              {RANKS.map((rank, i) => (
                <div
                  key={rank}
                  className={cn(
                    "flex items-center justify-center font-mono font-bold text-muted-foreground/50",
                    compact ? "size-6 text-[8px]" : "size-8 text-[10px] sm:size-10 sm:text-xs",
                  )}
                >
                  {rank}
                </div>
              ))}
            </div>

            {/* Grid rows */}
            <div className="space-y-px">
              {RANKS.map((rank, i) => (
                <div key={rank} className="flex items-center gap-px">
                  {/* Row label */}
                  <div
                    className={cn(
                      "flex items-center justify-center font-mono font-bold text-muted-foreground/50 shrink-0",
                      compact ? "size-6 text-[8px]" : "size-8 text-[10px] sm:size-10 sm:text-xs",
                    )}
                  >
                    {rank}
                  </div>
                  <RangeRow rankIndex={i} ranges={currentRanges} compact={compact} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/30 pt-3">
          {LEGEND_ITEMS.map((item) => (
            <div key={item.action} className="flex items-center gap-1">
              <div
                className={cn(
                  "size-3 rounded border",
                  ACTION_CONFIG[item.action].bg,
                  ACTION_CONFIG[item.action].border,
                )}
              />
              <span className="text-[9px] text-muted-foreground/60">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Stats row */}
        {stats && !compact && (
          <div className="mt-2 flex items-center gap-2 text-[9px] text-muted-foreground/40">
            <span>加注: {stats.raise}</span>
            {stats.threeBet > 0 && <span>3-Bet: {stats.threeBet}</span>}
            <span>跟注: {stats.call}</span>
            <span>弃牌: {stats.fold}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
