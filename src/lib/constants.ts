export const CLEAR_THRESHOLD = 8000
export const CLEAR_WARNING_RATIO = 0.8
export const REMINDER_INTERVAL_HOURS = 48
export const MIN_GAMES_FOR_AWARD = 5

export const SESSION_STATUS = {
  PENDING: "pending",
  COLLECTED: "collected",
  CONFIRMED: "confirmed",
} as const

export const RECORD_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
} as const

export const CLEAR_TYPE = {
  THRESHOLD: "threshold",
  SEASON_END: "season_end",
} as const

export const AWARD_CATEGORIES = {
  WINNER: "winner",
  LOSER: "loser",
  SPECIAL: "special",
} as const

export const APP_NAME = "德扑积分榜"
export const APP_SLOGAN = "♠♥♦♣"
export const EXPORT_VERSION = "1.0"
export const EXPORT_FILENAME_PREFIX = "poker-tracker-backup"
