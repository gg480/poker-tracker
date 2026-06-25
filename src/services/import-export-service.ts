// @ts-nocheck — Record<string,unknown> casts vs typed PokerRecord (pre-existing migration artifact)
import type { ExportData, AwardRecord } from "@/lib/types"
import { EXPORT_VERSION, EXPORT_FILENAME_PREFIX } from "@/lib/constants"
import { getExportFilename as getFormatExportFilename } from "@/services/export-format-service"
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

  const allAwards: AwardRecord[] = []
  for (const s of seasons) {
    const awards = getAwardsBySeason(s.id)
    allAwards.push(...awards as AwardRecord[])
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
    // 修复 IX-53: 导出保留完整字段，包括 id/seasonId/sessionId
    pokerRecords: records.map((r) => ({
      id: r.id,
      date: r.date,
      player: r.player,
      score: r.score,
      win: r.win as 1 | -1,
      seasonId: r.seasonId,
      sessionId: r.sessionId ?? undefined,
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
  errors?: string[]
} {
  try {
    const data: ExportData = JSON.parse(jsonString)

    if (!data.version || !data.exportedAt) {
      return { success: false, message: "无效的备份文件格式" }
    }

    let seasonCount = 0
    let recordCount = 0
    let settlementCount = 0
    const errors: string[] = []

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
      } catch (e) { errors.push(`赛季 "${s.name}" 导入失败: ${e instanceof Error ? e.message : ""}`) }
    }

    for (const s of data.gameSessions || []) {
      try {
        insertSession({
          date: s.date,
          seasonId: s.seasonId,
          status: s.status,
          totalRecords: s.totalRecords,
        })
      } catch (e) { errors.push(`场次 ${s.date} 导入失败: ${e instanceof Error ? e.message : ""}`) }
    }

    // 修复 IX-51: 保留原始 seasonId/sessionId，不再强制归属第一个赛季
    if (data.pokerRecords.length > 0) {
      const records = data.pokerRecords.map((r) => ({
        date: r.date,
        seasonId: (r as Record<string, unknown>).seasonId as string || (data.seasons[0]?.id) || "",
        sessionId: ((r as Record<string, unknown>).sessionId as string) || null as string | null,
        player: r.player,
        score: r.score,
        win: r.win,
        status: "confirmed" as const,
      }))
      try {
        insertRecords(records)
        recordCount = records.length
      } catch (e) { errors.push(`记录导入失败: ${e instanceof Error ? e.message : "未知错误"}`) }
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
      } catch (e) { errors.push(`结算 "${s.player}" 导入失败: ${e instanceof Error ? e.message : ""}`) }
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
      } catch (e) { errors.push(`清分记录 "${c.player}" 导入失败: ${e instanceof Error ? e.message : ""}`) }
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
      } catch (e) { errors.push(`奖项记录导入失败: ${e instanceof Error ? e.message : ""}`) }
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
      } catch (e) { errors.push(`手牌记录 ${h.id || h.date} 导入失败: ${e instanceof Error ? e.message : ""}`) }
    }

    return {
      success: true,
      message: `导入完成：${seasonCount} 赛季、${recordCount} 记录、${settlementCount} 结算` +
        (errors.length > 0 ? `（${errors.length} 项失败）` : ""),
      stats: { seasons: seasonCount, records: recordCount, settlements: settlementCount },
      errors: errors.length > 0 ? errors : undefined,
    }
  } catch (error) {
    return {
      success: false,
      message: `导入失败: ${error instanceof Error ? error.message : "未知错误"}`,
    }
  }
}

export function getExportFilename(): string {
  // Use EXPORT_FILENAME_PREFIX ("poker-tracker-backup") to preserve
  // backward compatibility with existing exports.
  return getFormatExportFilename("json", EXPORT_FILENAME_PREFIX)
}
