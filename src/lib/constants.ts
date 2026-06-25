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

// ── Locale ───────────────────────────────────────────────────
export const LOCALE = "zh-CN" as const

export const APP_NAME = "德扑积分榜"
export const APP_SLOGAN = "♠♥♦♣"
export const EXPORT_VERSION = "1.0"
export const EXPORT_FILENAME_PREFIX = "poker-tracker-backup"

// ── Pagination ──────────────────────────────────────────────
export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 100

// ── Chart defaults ─────────────────────────────────────────
export const CHART_DEFAULT_HEIGHT = 300
export const CHART_MIN_HEIGHT = 280
export const CHART_TREND_HEIGHT = 600
export const CHART_MARGIN = { top: 10, right: 20, left: 0, bottom: 10 } as const
export const CHART_BAR_RADIUS = [4, 4, 0, 0] as const
export const CHART_GRID_STROKE_DASHARRAY = "3 3"
export const CHART_ANIMATION_DURATION = 300
export const CHART_DEFAULT_STROKE_WIDTH = 1.5
export const CHART_TREND_STROKE_WIDTH = 2

// ── UI / Layout ────────────────────────────────────────────
export const TOP_N_LEADERBOARD = 5
export const TOP_N_MEDAL = 3
export const SESSION_PREVIEW_LIMIT = 4
export const RECENT_GAMES_LIMIT = 10
export const RECENT_DATES_LIMIT = 8
export const DAILY_BEST_LIMIT = 8
export const MAX_VISIBLE_PLAYERS = 10

// ── Validation / Business rules ────────────────────────────
export const MIN_SESSION_PLAYERS = 2
export const MAX_PLAYER_NAME_LENGTH = 50
export const MAX_GENERAL_STRING_LENGTH = 100
export const MAX_SCORE_ABS = 10_000
export const WIN_RATE_SCALE = 100

/** Sentinel value representing "all seasons" in season filter dropdowns. */
export const SEASON_FILTER_ALL = "all" as const

// ── Default game parameters ───────────────────────────────
export const DEFAULT_BLIND_SMALL = 50
export const DEFAULT_BLIND_BIG = 100
export const DEFAULT_STARTING_STACK = 10_000
export const DEFAULT_BLIND_SMALL_CASH = 5
export const DEFAULT_BLIND_BIG_CASH = 10
export const DEFAULT_STARTING_STACK_CASH = 1_000

// ── Timer / Duration ───────────────────────────────────────
export const MESSAGE_DISMISS_DURATION = 3000
export const TOAST_SHORT_DURATION = 2000
export const TRANSITION_DURATION_FAST = 200
export const TRANSITION_DURATION_NORMAL = 300

// ── Time values (ms) ──────────────────────────────────────
export const MS_PER_MINUTE = 60_000
export const MS_PER_HOUR = 3_600_000
export const MS_PER_DAY = 86_400_000
export const MS_PER_WEEK = 604_800_000

// ── Storage keys ───────────────────────────────────────────
/**
 * Conceptual namespace prefix for all poker-tracker localStorage keys.
 * Individual keys are hardcoded below for backward compatibility
 * (changing them would orphan existing stored data).
 */
export const STORAGE_KEY_PREFIX = "poker-tracker" as const

export const STORAGE_KEY_DEFAULT_PLAYER = "poker-default-player"
export const STORAGE_KEY_UI_STORE = "poker-ui-store"
export const STORAGE_KEY_RECORDS = "poker-tracker-records"
export const STORAGE_KEY_SEASONS = "poker-tracker-seasons"
export const STORAGE_KEY_SETTLEMENTS = "poker-tracker-settlements"
export const STORAGE_KEY_AI_CACHE = "poker-tracker-ai-cache"
export const STORAGE_KEY_HANDS_CACHE = "hand_page_complete_hands"
/** Coach training store (zustand persist). */
export const STORAGE_KEY_COACH_STORE = "poker-coach-store"
/** Season store (zustand persist). */
export const STORAGE_KEY_SEASON_STORE = "poker-season-store"
/** Settlement store (zustand persist). */
export const STORAGE_KEY_SETTLEMENT_STORE = "poker-settlement-store"
/** Record store (zustand persist). */
export const STORAGE_KEY_RECORD_STORE = "poker-record-store"
/** AI config store (zustand persist). */
export const STORAGE_KEY_AI_CONFIG_STORE = "poker-ai-config"
/** Notification store (zustand persist). */
export const STORAGE_KEY_NOTIFICATION_STORE = "poker-notification-store"
export const DEFAULT_PLAYER_NAME = "玩家" as const

// ── API Routes ───────────────────────────────────────────────
export const API_RECORDS = "/api/poker-records"
export const API_SEASONS = "/api/seasons"
export const API_SETTLEMENTS = "/api/settlements"
export const API_SESSIONS = "/api/sessions"
export const API_HANDS = "/api/hands"
export const API_AI_ANALYSIS = "/api/ai-analysis"
export const API_AI_CACHE = "/api/ai-cache"
export const API_IMPORT_STATUS = "/api/import-status"
export const API_SETTLEMENTS_EXCEL = "/api/settlements-excel"

// ── Analysis / Stat windows ─────────────────────────────────
export const RECENT_GAMES_WINDOW = 5
export const RECENT_SESSIONS_WINDOW = 3
export const MOVING_AVG_WINDOW_SHORT = 3
export const MOVING_AVG_WINDOW_LONG = 5

// ── Coach deviation thresholds ──────────────────────────────
export const COACH_DEVIATION_MINOR = 0.3
export const COACH_DEVIATION_MAJOR = 0.7
export const COACH_DEVIATION_SEVERITY = 0.5
export const COACH_FREQ_HIGH = 0.85
export const COACH_FREQ_MEDIUM = 0.7
export const COACH_FREQ_LOW = 0.55

// ── Consistency thresholds ──────────────────────────────────
export const CONSISTENCY_LOW = 1.5
export const CONSISTENCY_HIGH = 3.0
export const TREND_RATIO_THRESHOLD = 0.15

// ── Sentinels ───────────────────────────────────────────────
export const UNKNOWN_FALLBACK = "unknown" as const

// ── Layout / Breakpoints ────────────────────────────────────
export const BREAKPOINT_MOBILE = 768

// ── Quick Entry ──────────────────────────────────────────────
export type QuickTag = "3bet pot" | "Bad Beat" | "Bluff" | "Hero Call" | "All-in" | "Other"

export const QUICK_TAGS: QuickTag[] = ["3bet pot", "Bad Beat", "Bluff", "Hero Call", "All-in", "Other"]
export const QUICK_TAG_ICONS: Record<QuickTag, string> = {
  "3bet pot": "🎯",
  "Bad Beat": "💔",
  "Bluff": "🎭",
  "Hero Call": "🧠",
  "All-in": "🔥",
  "Other": "📝",
}

// ── Chart colors ─────────────────────────────────────────────
export const CHART_COLORS = [
  '#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16',
  '#e11d48', '#a855f7', '#0ea5e9',
] as const;

// ── Semantic Color Tokens ─────────────────────────────────────
// Color name keys — use these when constructing inline styles or
// CSS custom properties.  For Tailwind className strings prefer
// the pre-composed TEXT_* / BG_* constants below so that JIT
// scanning can detect the full class name at build time.

export const COLOR_POSITIVE = "emerald" as const
export const COLOR_NEGATIVE = "red" as const
export const COLOR_WARNING = "amber" as const
export const COLOR_INFO = "blue" as const
export const COLOR_SUCCESS = "emerald" as const

// ── Pre-composed Tailwind text-color classes ─────────────────
// Written as complete literal strings so Tailwind JIT can detect
// them at build time even when referenced through a constant.

/** Score positive (profit) — text-emerald-500 */
export const TEXT_POSITIVE = "text-emerald-500"
/** Score negative (loss) — text-red-500 */
export const TEXT_NEGATIVE = "text-red-500"
/** Score zero / neutral — text-muted-foreground */
export const TEXT_NEUTRAL = "text-muted-foreground"
/** Warning / highlight text — text-amber-400 */
export const TEXT_WARNING = "text-amber-400"
/** Informational text — text-blue-400 */
export const TEXT_INFO = "text-blue-400"

// ── Pre-composed Tailwind background variants ────────────────
// Each includes both bg and text color — suitable for
// badge / alert / tag / score-chip usage.

/** Positive bg+text wash — bg-emerald-500/10 text-emerald-400 */
export const BG_POSITIVE = "bg-emerald-500/10 text-emerald-400"
/** Negative bg+text wash — bg-red-500/10 text-red-400 */
export const BG_NEGATIVE = "bg-red-500/10 text-red-400"
/** Warning bg+text wash — bg-amber-500/15 text-amber-400 */
export const BG_WARNING = "bg-amber-500/15 text-amber-400"
/** Info bg+text wash — bg-blue-500/15 text-blue-400 */
export const BG_INFO = "bg-blue-500/15 text-blue-400"
/** Success bg+text wash — bg-emerald-500/15 text-emerald-400 */
export const BG_SUCCESS = "bg-emerald-500/15 text-emerald-400"
