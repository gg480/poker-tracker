// ========================================================================
// season-end-service.ts — Orchestrates end-of-season processing
//
// Responsibilities:
//  1. Validate all sessions in the season are confirmed
//  2. Compute final player standings
//  3. Generate awards via award-service
//  4. Create "season_end" clear records for settling balances
//  5. Archive the season (set active=false, archived=true, endDate)
//  6. Return a report with all results
//
// This does NOT send notifications — the caller (API route or UI)
// decides what to surface. Notifications are a UI concern.
// ========================================================================

import type { PokerRecord, Season } from "@/lib/types"
import {
  getSeasonById,
  getSessionsBySeason,
  getRecordsBySeason,
  getSettlementsBySeason,
  getAwardsBySeason,
  updateSeason,
  upsertSettlement,
  insertClearRecord,
  insertAwardRecords,
  deleteAwardRecordsBySeason,
} from "@/storage/database/crud"
import { computeExtendedAwards } from "@/services/award-service"
import { computeStats } from "@/lib/stats"
import { SESSION_STATUS, CLEAR_TYPE } from "@/lib/constants"

// ========================================================================
// Types
// ========================================================================

export interface SeasonEndReport {
  success: boolean
  seasonId: string
  seasonName: string
  /** Total sessions in the season */
  totalSessions: number
  /** Sessions that were NOT confirmed when end-season ran */
  unconfirmedSessions: number
  /** Total players who participated */
  totalPlayers: number
  /** Total poker records processed */
  totalRecords: number
  /** Settlements created or updated */
  settlementsProcessed: number
  /** Awards generated */
  awardsGenerated: number
  /** Clear records created for season-end settlement */
  clearsCreated: number
  /** Errors encountered (non-fatal; processing continued) */
  warnings: string[]
  /** Link to the archived season */
  archivedSeason: Season
}

export interface SeasonEndPreview {
  /** Whether the season is ready to be ended */
  canEnd: boolean
  /** Reasons the season cannot be ended (if canEnd is false) */
  blockers: string[]
  /** Number of unconfirmed sessions */
  unconfirmedSessions: number
  /** Total sessions in the season */
  totalSessions: number
  /** Total records */
  totalRecords: number
  /** Current player standings (sorted by total score descending) */
  standings: { player: string; total: number; games: number; avgScore: number }[]
}

// ========================================================================
// Preview — check if season is ready to end
// ========================================================================

export function previewEndSeason(seasonId: string): SeasonEndPreview | null {
  const season = getSeasonById(seasonId)
  if (!season) return null
  if (season.archived) {
    return {
      canEnd: false,
      blockers: ["Season is already archived"],
      unconfirmedSessions: 0,
      totalSessions: 0,
      totalRecords: 0,
      standings: [],
    }
  }

  const sessions = getSessionsBySeason(seasonId) ?? []
  const records = getRecordsBySeason(seasonId) ?? []
  const unconfirmed = sessions.filter((s) => s.status !== SESSION_STATUS.CONFIRMED)

  const blockers: string[] = []
  if (unconfirmed.length > 0) {
    blockers.push(`${unconfirmed.length} session(s) are not confirmed (${unconfirmed.map((s) => s.date).join(", ")})`)
  }
  if (records.length === 0) {
    blockers.push("No records found for this season")
  }

  // Compute current standings
  const scoreMap = new Map<string, { total: number; games: number }>()
  for (const r of records) {
    const entry = scoreMap.get(r.player) ?? { total: 0, games: 0 }
    entry.total += r.score
    entry.games++
    scoreMap.set(r.player, entry)
  }
  const standings = [...scoreMap.entries()]
    .map(([player, data]) => ({
      player,
      total: data.total,
      games: data.games,
      avgScore: data.games > 0 ? Math.round(data.total / data.games) : 0,
    }))
    .sort((a, b) => b.total - a.total)

  return {
    canEnd: blockers.length === 0,
    blockers,
    unconfirmedSessions: unconfirmed.length,
    totalSessions: sessions.length,
    totalRecords: records.length,
    standings,
  }
}

// ========================================================================
// Execute — perform the end-of-season process
// ========================================================================

export function endSeason(seasonId: string): SeasonEndReport {
  const season = getSeasonById(seasonId)
  if (!season) {
    throw new Error(`Season ${seasonId} not found`)
  }
  if (season.archived) {
    throw new Error(`Season ${season.name} (${seasonId}) is already archived — cannot end again`)
  }

  const warnings: string[] = []

  // 1. Validate — warn but don't block on unconfirmed sessions
  const sessions = getSessionsBySeason(seasonId) ?? []
  const records = getRecordsBySeason(seasonId) ?? []
  const unconfirmed = sessions.filter((s) => s.status !== SESSION_STATUS.CONFIRMED)
  if (unconfirmed.length > 0) {
    warnings.push(`Season has ${unconfirmed.length} unconfirmed session(s) — they will NOT be included in final standings`)
  }
  if (records.length === 0) {
    warnings.push("No records found for this season")
  }

  // Filter to only confirmed session records
  const confirmedSessionIds = new Set(
    sessions.filter((s) => s.status === SESSION_STATUS.CONFIRMED).map((s) => s.id)
  )
  const confirmedRecords = records.filter((r) => r.sessionId && confirmedSessionIds.has(r.sessionId))

  // 2. Compute final player standings
  const stats = computeStats((confirmedRecords.length > 0 ? confirmedRecords : records) as PokerRecord[])

  // 3. Compute settlements — upsert for each player
  let settlementsProcessed = 0
  for (const player of stats.players) {
    try {
      upsertSettlement({
        player: player.name,
        seasonId,
        settleScore: player.total,
        seasonAdjust: 0,
      })
      settlementsProcessed++
    } catch (e) {
      warnings.push(`Failed to upsert settlement for ${player.name}: ${e instanceof Error ? e.message : "unknown error"}`)
    }
  }

  // 4. Generate awards
  let awardsGenerated = 0
  try {
    const existingAwards = getAwardsBySeason(seasonId)
    if (existingAwards.length > 0) {
      deleteAwardRecordsBySeason(seasonId)
    }
    const settlements = getSettlementsBySeason(seasonId)
    const awardResults = computeExtendedAwards(stats, settlements)
    if (awardResults.length > 0) {
      const awardsToInsert = awardResults.map((a) => ({
        seasonId,
        player: a.winner,
        awardType: a.category,
        awardName: a.title,
        awardIcon: a.icon,
        description: `${a.description}: ${a.value}`,
      }))
      insertAwardRecords(awardsToInsert)
      awardsGenerated = awardsToInsert.length
    }
  } catch (e) {
    warnings.push(`Award generation failed: ${e instanceof Error ? e.message : "unknown error"}`)
  }

  // 5. Create season-end clear records
  let clearsCreated = 0
  try {
    const today = new Date().toISOString().split("T")[0]
    for (const settlement of stats.players) {
      if (settlement.total !== 0) {
        insertClearRecord({
          date: today,
          player: settlement.name,
          amount: settlement.total,
          seasonId,
          clearType: CLEAR_TYPE.SEASON_END,
        })
        clearsCreated++
      }
    }
  } catch (e) {
    warnings.push(`Clear record creation failed: ${e instanceof Error ? e.message : "unknown error"}`)
  }

  // 6. Archive the season
  const today = new Date().toISOString().split("T")[0]
  const archivedSeason = updateSeason(seasonId, {
    active: false,
    archived: true,
    endDate: today,
  })

  return {
    success: true,
    seasonId,
    seasonName: season.name,
    totalSessions: sessions.length,
    unconfirmedSessions: unconfirmed.length,
    totalPlayers: stats.players.length,
    totalRecords: confirmedRecords.length > 0 ? confirmedRecords.length : records.length,
    settlementsProcessed,
    awardsGenerated,
    clearsCreated,
    warnings,
    // `updateSeason` returns the DB row type; `Season` is a structural subset so a
    // direct cast is safe.  If this ever fails at runtime the types have diverged.
    archivedSeason: archivedSeason as Season,
  }
}
