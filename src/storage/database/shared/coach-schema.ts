import { sqliteTable, text, integer, real, index } from "drizzle-orm/sqlite-core"
import { generateId } from "./id"

export const coachSessions = sqliteTable(
  "coach_sessions",
  {
    id: text("id").primaryKey().$defaultFn(() => generateId()),
    mode: text("mode", { length: 20 }).notNull().default("cash"),
    status: text("status", { length: 20 }).notNull().default("in_progress"),
    startingStack: integer("starting_stack").notNull().default(10000),
    blindSmall: integer("blind_small").notNull().default(50),
    blindBig: integer("blind_big").notNull().default(100),
    opponentStyle: text("opponent_style", { length: 20 }).notNull().default("gto"),
    totalHands: integer("total_hands").notNull().default(0),
    totalEv: real("total_ev").notNull().default(0),
    createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
    completedAt: text("completed_at"),
    updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    // Composite: WHERE status=? ORDER BY createdAt DESC (getCoachSessions with status filter)
    // Also covers createdAt-alone ORDER BY (getCoachSessions without status filter)
    index("coach_sessions_status_created_idx").on(table.status, table.createdAt),
  ]
)

export const coachDecisions = sqliteTable(
  "coach_decisions",
  {
    id: text("id").primaryKey().$defaultFn(() => generateId()),
    sessionId: text("session_id").notNull().references(() => coachSessions.id, { onDelete: "cascade" }),
    handNumber: integer("hand_number").notNull(),
    street: text("street", { length: 10 }).notNull(),
    holeCards: text("hole_cards").notNull(),
    boardCards: text("board_cards").notNull().default("[]"),
    potSize: integer("pot_size").notNull(),
    userStack: integer("user_stack").notNull(),
    opponentStack: integer("opponent_stack").notNull(),
    userAction: text("user_action", { length: 10 }).notNull(),
    userBetAmount: integer("user_bet_amount").notNull().default(0),
    opponentAction: text("opponent_action", { length: 10 }),
    opponentBetAmount: integer("opponent_bet_amount").notNull().default(0),
    gtoRecommendation: text("gto_recommendation", { length: 10 }),
    gtoFrequency: real("gto_frequency"),
    equity: real("equity"),
    potOdds: real("pot_odds"),
    ev: real("ev"),
    isCorrect: integer("is_correct", { mode: "boolean" }),
    deviation: real("deviation"),
    result: text("result", { length: 10 }),
    netChips: integer("net_chips"),
    createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
    updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    // sessionId alone is covered by hand_idx (sessionId is prefix)
    // Extends the hand index to cover ORDER BY handNumber, createdAt (getDecisionsBySession, getDecisionsPaginated)
    index("coach_decisions_hand_created_idx").on(table.sessionId, table.handNumber, table.createdAt),
  ]
)

export const coachFeedback = sqliteTable(
  "coach_feedback",
  {
    id: text("id").primaryKey().$defaultFn(() => generateId()),
    sessionId: text("session_id").notNull().references(() => coachSessions.id, { onDelete: "cascade" }),
    decisionId: text("decision_id").notNull().references(() => coachDecisions.id, { onDelete: "cascade" }),
    feedbackType: text("feedback_type", { length: 20 }).notNull(),
    message: text("message").notNull(),
    suggestion: text("suggestion"),
    createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
    updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    // sessionId alone queries (getFeedbackBySession ORDER BY createdAt DESC — add composite for sorted access)
    index("coach_feedback_session_created_idx").on(table.sessionId, table.createdAt),
    index("coach_feedback_decision_idx").on(table.decisionId),
  ]
)
