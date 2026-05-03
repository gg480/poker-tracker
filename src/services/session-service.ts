import {
  getSessionById,
  getSessionsBySeason,
  getSessionByDateAndSeason,
  insertSession,
  updateSession,
  deleteSession as crudDeleteSession,
  getRecordsBySession,
  insertRecord,
  insertRecords,
  deleteRecordsBySession,
} from "@/storage/database/crud"
import type { GameSession, SessionEntry } from "@/lib/types"
import { SESSION_STATUS } from "@/lib/constants"

export function findOrCreateSession(date: string, seasonId: string): GameSession {
  const existing = getSessionByDateAndSeason(date, seasonId)
  if (existing) return existing as GameSession
  return createSession(date, seasonId)
}

export function createSession(date: string, seasonId: string): GameSession {
  const result = insertSession({
    date,
    seasonId,
    status: SESSION_STATUS.PENDING,
    totalRecords: 0,
  })
  return result as GameSession
}

export function addPlayerEntry(
  sessionId: string,
  player: string,
  score: number,
  seasonId: string,
  date: string
): { session: GameSession; success: boolean } {
  const session = getSessionById(sessionId)
  if (!session) {
    throw new Error(`Session ${sessionId} not found`)
  }
  if (session.status === SESSION_STATUS.CONFIRMED) {
    throw new Error("Cannot add entry to a confirmed session")
  }

  const existingRecords = getRecordsBySession(sessionId)
  const alreadyEntered = existingRecords.find((r) => r.player === player)
  if (alreadyEntered) {
    throw new Error(`Player ${player} already has an entry in this session`)
  }

  insertRecord({
    date,
    seasonId,
    sessionId,
    player,
    score,
    win: score >= 0 ? 1 : -1,
    status: SESSION_STATUS.PENDING,
  })

  const newTotal = existingRecords.length + 1
  const allPlayersEntered = newTotal >= 2
  const newStatus = allPlayersEntered ? SESSION_STATUS.COLLECTED : SESSION_STATUS.PENDING

  const updated = updateSession(sessionId, {
    status: newStatus,
    totalRecords: newTotal,
  })

  return { session: updated as GameSession, success: true }
}

export function addBatchEntries(
  sessionId: string,
  entries: SessionEntry[],
  seasonId: string,
  date: string
): { session: GameSession; warnings: string[] } {
  const session = getSessionById(sessionId)
  if (!session) {
    throw new Error(`Session ${sessionId} not found`)
  }
  if (session.status === SESSION_STATUS.CONFIRMED) {
    throw new Error("Cannot add entries to a confirmed session")
  }

  const warnings: string[] = []
  const validEntries = entries.filter((e) => e.entered && e.score !== null)

  const totalScore = validEntries.reduce((sum, e) => sum + (e.score ?? 0), 0)
  if (totalScore !== 0) {
    warnings.push(`合计为 ${totalScore}，不为零。确认后将标记为差额异常。`)
  }

  const records = validEntries.map((e) => ({
    date,
    seasonId,
    sessionId,
    player: e.player,
    score: e.score ?? 0,
    win: (e.score ?? 0) >= 0 ? 1 : -1,
    status: SESSION_STATUS.PENDING,
  }))

  insertRecords(records)

  const newTotal = validEntries.length
  const newStatus = newTotal >= 2 ? SESSION_STATUS.COLLECTED : SESSION_STATUS.PENDING

  const updated = updateSession(sessionId, {
    status: newStatus,
    totalRecords: newTotal,
  })

  return { session: updated as GameSession, warnings }
}

export function validateSession(sessionId: string): {
  valid: boolean
  totalScore: number
  recordCount: number
  players: string[]
} {
  const records = getRecordsBySession(sessionId)
  const totalScore = records.reduce((sum, r) => sum + r.score, 0)
  const players = records.map((r) => r.player)

  return {
    valid: totalScore === 0 && records.length >= 2,
    totalScore,
    recordCount: records.length,
    players,
  }
}

export function confirmSession(sessionId: string): GameSession {
  const session = getSessionById(sessionId)
  if (!session) {
    throw new Error(`Session ${sessionId} not found`)
  }
  if (session.status === SESSION_STATUS.CONFIRMED) {
    throw new Error("Session is already confirmed")
  }

  const validation = validateSession(sessionId)
  if (!validation.valid) {
    throw new Error(
      `Cannot confirm: total score is ${validation.totalScore} (must be 0), or insufficient players (${validation.recordCount})`
    )
  }

  const updated = updateSession(sessionId, {
    status: SESSION_STATUS.CONFIRMED,
  })

  return updated as GameSession
}

export function deleteSessionById(sessionId: string): boolean {
  try {
    crudDeleteSession(sessionId)
    return true
  } catch {
    return false
  }
}

export function getSessions(seasonId?: string): GameSession[] {
  if (seasonId) {
    return getSessionsBySeason(seasonId) as GameSession[]
  }
  const { getAllSessions } = require("@/storage/database/crud")
  return getAllSessions() as GameSession[]
}

export function getSessionDetail(sessionId: string): {
  session: GameSession | null
  records: any[]
  validation: ReturnType<typeof validateSession> | null
} {
  const session = getSessionById(sessionId) as GameSession | null
  if (!session) {
    return { session: null, records: [], validation: null }
  }

  const records = getRecordsBySession(sessionId)
  const validation = validateSession(sessionId)

  return { session, records, validation }
}
