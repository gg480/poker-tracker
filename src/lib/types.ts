export interface PokerRecord {
  date: string
  player: string
  score: number
  win: 1 | -1
}

export interface Season {
  id: string
  name: string
  startDate: string
  endDate?: string
  active: boolean
  archived?: boolean
}

export interface PlayerSettlement {
  player: string
  seasonId: string
  settleScore: number
  seasonAdjust: number
}

export interface GameSession {
  id: string
  date: string
  seasonId: string
  status: "pending" | "collected" | "confirmed"
  totalRecords: number
  createdAt: string
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
}

export interface ClearRecord {
  id: string
  date: string
  player: string
  amount: number
  seasonId: string
  clearType: "threshold" | "season_end"
  createdAt: string
}

export interface AICacheItem {
  label: string
  prompt: string
  result: string
  time: string
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
  winRate: string
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

export type TabKey = "home" | "record" | "ranking" | "hand" | "profile"

export interface ShareCardData {
  seasonName?: string
  date: string
  records: { player: string; score: number }[]
  mvp?: string
  topScore?: number
}
