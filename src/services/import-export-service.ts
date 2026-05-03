import type { ExportData } from "@/lib/types"
import { EXPORT_VERSION, EXPORT_FILENAME_PREFIX } from "@/lib/constants"
import {
  getAllSeasons,
  getAllSessions,
  getAllRecords,
  getAllSettlements,
  getAllClears,
  getAwardsBySeason,
  getAllHands,
  insertSeason,
  insertSession,
  insertRecord,
  insertRecords,
  upsertSettlement,
  insertClearRecord,
  insertAwardRecords,
  insertHandRecord,
} from "@/storage/database/crud"

export function exportToJSON(): string {
  const seasons = getAllSeasons()
  const sessions = getAllSessions()
  const records = getAllRecords()
  const settlements = getAllSettlements()
  const clears = getAllClears()

  const allAwards: any[] = []
  for (const s of seasons) {
    const awards = getAwardsBySeason(s.id)
    allAwards.push(...awards)
  }

  const hands = getAllHands()

  const data: ExportData = {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    seasons: seasons.map((s) => ({
      id: s.id,
      name: s.name,
      startDate: s.startDate,
      endDate: s.endDate ?? undefined,
      active: s.active,
      archived: s.archived ?? false,
    })),
    gameSessions: sessions.map((s) => ({
      id: s.id,
      date: s.date,
      seasonId: s.seasonId,
      status: s.status as "pending" | "collected" | "confirmed",
      totalRecords: s.totalRecords,
      createdAt: s.createdAt,
    })),
    pokerRecords: records.map((r) => ({
      date: r.date,
      player: r.player,
      score: r.score,
      win: r.win as 1 | -1,
    })),
    playerSettlements: settlements.map((s) => ({
      player: s.player,
      seasonId: s.seasonId,
      settleScore: s.settleScore,
      seasonAdjust: s.seasonAdjust,
    })),
    clearRecords: clears.map((c) => ({
      id: c.id,
      date: c.date,
      player: c.player,
      amount: c.amount,
      seasonId: c.seasonId,
      clearType: c.clearType as "threshold" | "season_end",
      createdAt: c.createdAt,
    })),
    awardRecords: allAwards.map((a) => ({
      id: a.id,
      seasonId: a.seasonId,
      player: a.player,
      awardType: a.awardType,
      awardName: a.awardName,
      awardIcon: a.awardIcon,
      description: a.description ?? undefined,
      createdAt: a.createdAt,
    })),
    handRecords: hands.map((h) => ({
      id: h.id,
      date: h.date,
      seasonId: h.seasonId,
      sessionId: h.sessionId ?? undefined,
      players: h.players,
      handType: h.handType ?? undefined,
      board: h.board ?? undefined,
      actions: h.actions ?? undefined,
      result: h.result ?? undefined,
      winner: h.winner ?? undefined,
      notes: h.notes ?? undefined,
      tags: h.tags ?? undefined,
      photo: h.photo ?? undefined,
      gtoAnalysis: h.gtoAnalysis ?? undefined,
      isComplete: h.isComplete ?? false,
      quickMode: h.quickMode ?? false,
      createdAt: h.createdAt,
    })),
  }

  return JSON.stringify(data, null, 2)
}

export function importFromJSON(jsonString: string): {
  success: boolean
  message: string
  stats?: { seasons: number; records: number; settlements: number }
} {
  try {
    const data: ExportData = JSON.parse(jsonString)

    if (!data.version || !data.exportedAt) {
      return { success: false, message: "无效的备份文件格式" }
    }

    let seasonCount = 0
    let recordCount = 0
    let settlementCount = 0

    for (const s of data.seasons) {
      try {
        insertSeason({
          name: s.name,
          startDate: s.startDate,
          endDate: s.endDate ?? null,
          active: s.active,
          archived: s.archived ?? false,
        })
        seasonCount++
      } catch {}
    }

    for (const s of data.gameSessions || []) {
      try {
        insertSession({
          date: s.date,
          seasonId: s.seasonId,
          status: s.status,
          totalRecords: s.totalRecords,
        })
      } catch {}
    }

    if (data.pokerRecords.length > 0) {
      const records = data.pokerRecords.map((r) => ({
        date: r.date,
        seasonId: (data.seasons[0]?.id) || "",
        sessionId: null as any,
        player: r.player,
        score: r.score,
        win: r.win,
        status: "confirmed" as const,
      }))
      try {
        insertRecords(records)
        recordCount = records.length
      } catch {}
    }

    for (const s of data.playerSettlements) {
      try {
        upsertSettlement({
          player: s.player,
          seasonId: s.seasonId,
          settleScore: s.settleScore,
          seasonAdjust: s.seasonAdjust,
        })
        settlementCount++
      } catch {}
    }

    for (const c of data.clearRecords || []) {
      try {
        insertClearRecord({
          date: c.date,
          player: c.player,
          amount: c.amount,
          seasonId: c.seasonId,
          clearType: c.clearType,
        })
      } catch {}
    }

    if (data.awardRecords && data.awardRecords.length > 0) {
      try {
        insertAwardRecords(
          data.awardRecords.map((a) => ({
            seasonId: a.seasonId,
            player: a.player,
            awardType: a.awardType,
            awardName: a.awardName,
            awardIcon: a.awardIcon,
            description: a.description ?? null,
          }))
        )
      } catch {}
    }

    for (const h of data.handRecords || []) {
      try {
        insertHandRecord({
          date: h.date,
          seasonId: h.seasonId,
          sessionId: h.sessionId ?? null,
          players: h.players,
          handType: h.handType ?? null,
          board: h.board ?? null,
          actions: h.actions ?? null,
          result: h.result ?? null,
          winner: h.winner ?? null,
          notes: h.notes ?? null,
          tags: h.tags ?? null,
          photo: h.photo ?? null,
          gtoAnalysis: h.gtoAnalysis ?? null,
          isComplete: h.isComplete ?? false,
          quickMode: h.quickMode ?? false,
        })
      } catch {}
    }

    return {
      success: true,
      message: `导入成功：${seasonCount} 赛季、${recordCount} 记录、${settlementCount} 结算`,
      stats: { seasons: seasonCount, records: recordCount, settlements: settlementCount },
    }
  } catch (error) {
    return {
      success: false,
      message: `导入失败: ${error instanceof Error ? error.message : "未知错误"}`,
    }
  }
}

export function getExportFilename(): string {
  const date = new Date().toISOString().split("T")[0]
  return `${EXPORT_FILENAME_PREFIX}-${date}.json`
}
