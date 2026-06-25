import type { ClearRadarAlert, ClearRadarLevel, PlayerSettlement } from "@/lib/types"
import { CLEAR_THRESHOLD, CLEAR_WARNING_RATIO, REMINDER_INTERVAL_HOURS } from "@/lib/constants"

interface PlayerBalance {
  player: string
  seasonId: string
  totalScore: number
  settleScore: number
  seasonAdjust: number
  balance: number
}

export function calcPlayerBalance(
  player: string,
  seasonId: string,
  totalScore: number,
  settlement: PlayerSettlement | undefined
): PlayerBalance {
  const settleScore = settlement?.settleScore ?? 0
  const seasonAdjust = settlement?.seasonAdjust ?? 0
  const balance = totalScore - settleScore + seasonAdjust

  return { player, seasonId, totalScore, settleScore, seasonAdjust, balance }
}

export function checkThreshold(balance: number): ClearRadarLevel {
  if (balance >= CLEAR_THRESHOLD) return "trigger"
  if (balance >= CLEAR_THRESHOLD * CLEAR_WARNING_RATIO) return "alert"
  return "none"
}

export function getAlertMessage(level: ClearRadarLevel, balance: number): string {
  switch (level) {
    case "trigger":
      return `已达清分线 ${CLEAR_THRESHOLD}，请尽快清分！`
    case "alert":
      return `距离清分还差 ${CLEAR_THRESHOLD - balance} 分`
    default:
      return ""
  }
}

export function checkReminder(
  lastSettleDate: string | undefined,
  level: ClearRadarLevel
): boolean {
  if (level !== "trigger" || !lastSettleDate) return false
  const lastDate = new Date(lastSettleDate)
  const hoursSince = (Date.now() - lastDate.getTime()) / (1000 * 60 * 60)
  return hoursSince >= REMINDER_INTERVAL_HOURS
}

export function getAlerts(
  playerBalances: PlayerBalance[],
  clearRecordDates?: Record<string, string>
): ClearRadarAlert[] {
  const alerts: ClearRadarAlert[] = []

  for (const pb of playerBalances) {
    if (pb.balance <= 0) continue

    const level = checkThreshold(pb.balance)
    if (level === "none") continue

    const message = getAlertMessage(level, pb.balance)
    const key = `${pb.player}-${pb.seasonId}`
    const lastSettleDate = clearRecordDates?.[key]

    const isReminder = checkReminder(lastSettleDate, level)
    const finalLevel: ClearRadarLevel = isReminder ? "reminder" : level

    alerts.push({
      player: pb.player,
      seasonId: pb.seasonId,
      balance: pb.balance,
      threshold: CLEAR_THRESHOLD,
      level: finalLevel,
      message: isReminder ? `已超 ${REMINDER_INTERVAL_HOURS} 小时未清分，记得请吃饭哦~` : message,
      lastSettleDate,
    })
  }

  return alerts.sort((a, b) => {
    const levelOrder = { trigger: 0, reminder: 1, alert: 2, none: 3 }
    return levelOrder[a.level] - levelOrder[b.level]
  })
}

export function getClearRadarAlerts(
  playerStats: { name: string; total: number }[],
  seasonId: string,
  settlements: PlayerSettlement[],
  clearRecordDates?: Record<string, string>
): ClearRadarAlert[] {
  const balances = playerStats.map((p) => {
    const settlement = settlements.find(
      (s) => s.player === p.name && s.seasonId === seasonId
    )
    return calcPlayerBalance(p.name, seasonId, p.total, settlement)
  })

  return getAlerts(balances, clearRecordDates)
}
