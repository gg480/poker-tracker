export interface PokerRecord {
  id?: string
  date: string
  player: string
  score: number
  win: 1 | -1
  seasonId?: string
  sessionId?: string
  status?: string
  updatedAt?: string
}

export interface Season {
  id: string
  name: string
  startDate: string
  endDate?: string
  active: boolean
  archived?: boolean
  updatedAt?: string
}

export interface PlayerSettlement {
  id?: string
  player: string
  seasonId: string
  settleScore: number
  seasonAdjust: number
  updatedAt?: string
}

export interface GameSession {
  id: string
  date: string
  seasonId: string
  status: "pending" | "collected" | "confirmed"
  totalRecords: number
  totalScore: number
  createdAt: string
  updatedAt?: string
}

export interface HandRecord {
  id: string
  date: string
  seasonId: string
  sessionId?: string
  players: string
  handType?: string
  board?: string
  actions?: string
  result?: number
  winner?: string
  notes?: string
  tags?: string
  photo?: string
  gtoAnalysis?: string
  isComplete: boolean
  quickMode: boolean
  createdAt: string
  updatedAt?: string
}

export interface AwardRecord {
  id: string
  seasonId: string
  player: string
  awardType: string
  awardName: string
  awardIcon: string
  description?: string
  createdAt: string
  updatedAt?: string
}

export interface ClearRecord {
  id: string
  date: string
  player: string
  amount: number
  seasonId: string
  clearType: "threshold" | "season_end"
  createdAt: string
  updatedAt?: string
}

export interface AICacheItem {
  id?: string
  label: string
  prompt: string
  result: string
  time: string
  updatedAt?: string
}

export interface ImportLog {
  id?: string
  fileName: string
  fileHash: string
  filePath: string
  recordCount: number
  importedAt: string
  status: string
  updatedAt?: string
}

export interface PlayerStats {
  name: string
  total: number
  wins: number
  losses: number
  games: number
  maxWin: number
  maxLoss: number
  scores: number[]
  sessionCount: number
  /** Win rate as a percentage in [0, 100] — append "%" for display. */
  winRate: number
  avgScore: number
  longestWinStreak: number
}

export interface DailyBest {
  score: number
  date: string
}

export interface CumulativePoint {
  date: string
  cum: number
}

export interface TrendPoint {
  date: string
  [playerName: string]: string | number
}

export interface ComputedStats {
  players: PlayerStats[]
  totalGames: number
  totalRecords: number
  dates: string[]
  dateMap: Record<string, PokerRecord[]>
  dailyBests: Record<string, DailyBest>
  trendData: TrendPoint[]
  cumulative: Record<string, CumulativePoint[]>
}

export type ClearRadarLevel = "none" | "alert" | "trigger" | "reminder"

export interface ClearRadarAlert {
  player: string
  seasonId: string
  balance: number
  threshold: number
  level: ClearRadarLevel
  message: string
  lastSettleDate?: string
}

export interface SessionEntry {
  player: string
  score: number | null
  entered: boolean
}

export interface ExportData {
  version: string
  exportedAt: string
  seasons: Season[]
  gameSessions: GameSession[]
  pokerRecords: PokerRecord[]
  playerSettlements: PlayerSettlement[]
  clearRecords: ClearRecord[]
  awardRecords: AwardRecord[]
  handRecords: HandRecord[]
}

// ── Utility / Helper Types ──────────────────────────────────────

/** Make T optionally null — useful for loosening strict null checks at API boundaries. */
export type Nullable<T> = T | null

/** Extract the union of all value types from an object type. */
export type ValueOf<T> = T[keyof T]

/** Recursively make all properties of T optional (deep Partial). */
export type DeepPartial<T> = T extends (infer U)[]
  ? DeepPartial<U>[]
  : T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T

export type TabKey = "home" | "record" | "ranking" | "hand" | "profile" | "coach"

export interface ShareCardData {
  seasonName?: string
  date: string
  records: { player: string; score: number }[]
  mvp?: string
  topScore?: number
}

// ── AI Config ──────────────────────────────────────────────────
export interface AIConfig {
  apiKey: string
  baseUrl: string
  model: string
  temperature: number
}

// ── Import ─────────────────────────────────────────────────────
export interface ImportSummary {
  totalFiles: number
  totalRecords: number
  skipped: number
  message: string
}

export interface WatcherStatus {
  watching: boolean
  dir: string
  lastEvent: string
}

// ── Notification ───────────────────────────────────────────────
export type NotificationLevel = "info" | "warning" | "error" | "success"
export type NotificationCategory =
  | "clear_radar"
  | "settlement"
  | "award"
  | "session"
  | "system"

export interface AppNotification {
  id: string
  level: NotificationLevel
  category: NotificationCategory
  title: string
  message?: string
  player?: string
  seasonId?: string
  read: boolean
  createdAt: string
  updatedAt?: string
}

export interface NotificationStats {
  total: number
  unread: number
  byLevel: Record<NotificationLevel, number>
  byCategory: Record<NotificationCategory, number>
}

// ── Validation ─────────────────────────────────────────────────
export interface ValidationErrorItem {
  field: string
  message: string
  value?: unknown
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationErrorItem[]
}

// ── Statistics / Ranking ──────────────────────────────────────
export interface PlayerRanking {
  player: string
  total: number
  games: number
  wins: number
  winRate: number
  avgScore: number
  best: number
  worst: number
  sessionCount: number
}

export interface SeasonSummary {
  seasonId: string
  seasonName: string
  playerCount: number
  totalGames: number
  totalRecords: number
  topPlayer?: string
  topScore?: number
}

// ── Coach / Training ──────────────────────────────────────────
export type Street = "preflop" | "flop" | "turn" | "river"
export type GTOAction = "fold" | "check" | "call" | "raise"
export type UserAction = GTOAction | "all_in"
export type FeedbackType = "positive" | "minor_deviation" | "major_deviation"
export type OpponentStyle = "aggressive" | "passive" | "gto"
export type CoachMode = "cash" | "tournament"
// TrainingSettings is coach-specific — defined in @/lib/coach/types.ts
