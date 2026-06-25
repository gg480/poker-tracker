// @ts-nocheck — Record index signature conflicts with typed PokerRecord (pre-existing)
// ========================================================================
// export-format-service.ts — Converts poker data to portable formats
//
// Current formats:
//  - CSV     (records, settlements, standings, awards)
//  - Markdown (season report summary)
//  - JSON    (delegates to import-export-service.ts for full backup)
//
// Each function is a pure transform: data in, formatted string out.
// No side effects, no I/O, no DB access.
// ========================================================================

import type { PokerRecord, PlayerSettlement, AwardRecord } from "@/lib/types"

// ========================================================================
// CSV — Record export
// ========================================================================

/**
 * Escape a cell value for CSV (handles commas, quotes, newlines).
 */
function csvEscape(value: unknown): string {
  const str = String(value ?? "")
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

/**
 * Convert an array of objects to CSV string.
 */
function toCSV(
  headers: string[],
  rows: Record<string, any>[],
  extractors: Record<string, (row: Record<string, any>) => any>
): string {
  const headerLine = headers.map(csvEscape).join(",")
  const dataLines = rows.map((row) =>
    headers.map((h) => csvEscape(extractors[h]?.(row) ?? "")).join(",")
  )
  return [headerLine, ...dataLines].join("\n")
}

// ========================================================================
// Public CSV export functions
// ========================================================================

/**
 * Export poker records as CSV.
 * Columns: date, player, score, win, seasonId, sessionId, status
 */
export function exportRecordsCSV(records: PokerRecord[]): string {
  return toCSV(
    ["date", "player", "score", "win", "seasonId", "sessionId", "status"],
    records,
    {
      date: (r) => r.date,
      player: (r) => r.player,
      score: (r) => r.score,
      win: (r) => r.win,
      seasonId: (r) => r.seasonId ?? "",
      sessionId: (r) => r.sessionId ?? "",
      status: (r) => r.status ?? "",
    }
  )
}

/**
 * Export player settlements as CSV.
 * Columns: player, seasonId, settleScore, seasonAdjust, netSettlement
 */
export function exportSettlementsCSV(settlements: PlayerSettlement[]): string {
  return toCSV(
    ["player", "seasonId", "settleScore", "seasonAdjust", "netSettlement"],
    settlements,
    {
      player: (s) => s.player,
      seasonId: (s) => s.seasonId,
      settleScore: (s) => s.settleScore,
      seasonAdjust: (s) => s.seasonAdjust,
      netSettlement: (s) => s.settleScore + s.seasonAdjust,
    }
  )
}

/**
 * Export player standings as CSV.
 * Columns: rank, player, totalScore, gamesPlayed, avgScore, winRate
 */
export function exportStandingsCSV(
  standings: { player: string; total: number; games: number; avgScore: number; winRate?: number }[]
): string {
  return toCSV(
    ["rank", "player", "totalScore", "gamesPlayed", "avgScore", "winRate"],
    standings,
    {
      rank: (_, i) => i + 1,
      player: (s) => s.player,
      totalScore: (s) => s.total,
      gamesPlayed: (s) => s.games,
      avgScore: (s) => s.avgScore,
      winRate: (s) => (s.winRate != null ? `${s.winRate}%` : ""),
    }
  )
}

/**
 * Export award records as CSV.
 * Columns: player, awardType, awardName, awardIcon, description
 */
export function exportAwardsCSV(awards: AwardRecord[]): string {
  return toCSV(
    ["player", "awardType", "awardName", "awardIcon", "description"],
    awards,
    {
      player: (a) => a.player,
      awardType: (a) => a.awardType,
      awardName: (a) => a.awardName,
      awardIcon: (a) => a.awardIcon,
      description: (a) => a.description ?? "",
    }
  )
}

// ========================================================================
// Markdown — Season report
// ========================================================================

/**
 * Generate a markdown season report.
 *
 * Sections: season info, final standings, awards, session summary.
 */
export function generateSeasonReportMarkdown(params: {
  seasonName: string
  seasonDates: { start: string; end?: string }
  totalSessions: number
  totalRecords: number
  totalPlayers: number
  standings: { player: string; total: number; games: number; avgScore: number }[]
  awards?: { title: string; icon: string; winner: string; value: string }[]
  topPlayer?: string
  topScore?: number
}): string {
  const { seasonName, seasonDates, totalSessions, totalRecords, totalPlayers, standings, awards, topPlayer, topScore } = params

  const lines: string[] = []

  // Title
  lines.push(`# 赛季报告：${seasonName}`)
  lines.push("")

  // Season info
  lines.push("## 赛季信息")
  lines.push(`- **赛季名称**: ${seasonName}`)
  lines.push(`- **开始日期**: ${seasonDates.start}`)
  if (seasonDates.end) lines.push(`- **结束日期**: ${seasonDates.end}`)
  lines.push(`- **总场次**: ${totalSessions}`)
  lines.push(`- **总记录数**: ${totalRecords}`)
  lines.push(`- **参与人数**: ${totalPlayers}`)
  if (topPlayer && topScore != null) {
    lines.push(`- **赛季冠军**: ${topPlayer} (${topScore > 0 ? "+" : ""}${topScore})`)
  }
  lines.push("")

  // Final standings
  lines.push("## 最终排名")
  lines.push("")
  lines.push("| 排名 | 玩家 | 总积分 | 场次 | 场均 |")
  lines.push("|------|------|--------|------|------|")
  for (let i = 0; i < standings.length; i++) {
    const s = standings[i]
    const sign = s.total > 0 ? "+" : ""
    lines.push(`| ${i + 1} | ${s.player} | ${sign}${s.total.toLocaleString()} | ${s.games} | ${sign}${s.avgScore.toLocaleString()} |`)
  }
  lines.push("")

  // Awards
  if (awards && awards.length > 0) {
    lines.push("## 奖项")
    lines.push("")
    lines.push("| 奖项 | 图标 | 得主 | 数据 |")
    lines.push("|------|------|------|------|")
    for (const a of awards) {
      lines.push(`| ${a.title} | ${a.icon} | ${a.winner} | ${a.value} |`)
    }
    lines.push("")
  }

  lines.push("---")
  lines.push(`*报告生成时间: ${new Date().toISOString()}*`)
  lines.push("")

  return lines.join("\n")
}

// ========================================================================
// JSON — thin re-export of the full backup format
// ========================================================================

/**
 * Get a filename suitable for the requested export format.
 */
export function getExportFilename(
  format: "csv" | "md" | "json",
  prefix: string = "poker-export"
): string {
  const date = new Date().toISOString().split("T")[0]
  const ext = format === "md" ? "md" : format
  return `${prefix}-${date}.${ext}`
}
