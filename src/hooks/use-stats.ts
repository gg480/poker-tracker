"use client"

import { useMemo } from "react"
import { computeStats } from "@/lib/stats"
import type { PokerRecord, ComputedStats } from "@/lib/types"

/**
 * Reactive statistics computed from a list of PokerRecords.
 *
 * Wraps the pure `computeStats()` function in `useMemo` so it's safe
 * to call inside React components without triggering re-computation
 * on every render.
 *
 * @example
 *   const stats = useStats(records)
 *   stats.players           // PlayerStats[] sorted by total
 *   stats.totalGames        // number of unique game dates
 */
export function useStats(records: PokerRecord[]): ComputedStats {
  return useMemo(() => computeStats(records), [records])
}
