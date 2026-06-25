"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type {
  CoachSession, CoachDecision, CoachFeedback,
  TrainingSettings, Position,
  DecisionContext, GTOAdvice,
} from "@/lib/coach/types"
import type {
  Street, UserAction, GTOAction,
} from "@/lib/types"
import { getPreflopAdvice, selectRandomAdvice } from "@/lib/coach/gto-engine"
import { calculateEquity, calculatePotOdds, calculateEV } from "@/lib/coach/equity-engine"
import { getOpponentDecision } from "@/lib/coach/opponent-engine"
import { evaluateDeviation } from "@/lib/coach/feedback-engine"
import { evaluateHandStrength, getPostflopAdvice } from "@/lib/coach/postflop-strategy"

// ====== 牌桌工具 ======

/** Generate a full 52-card deck */
function createDeck(): string[] {
  const ranks = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"]
  const suits = ["s", "h", "d", "c"]
  const deck: string[] = []
  for (const rank of ranks) {
    for (const suit of suits) {
      deck.push(`${rank}${suit}`)
    }
  }
  return deck
}

/** Draw `count` unique cards from a shuffled deck, optionally excluding already-dealt cards. */
function drawCards(count: number, exclude: string[] = []): string[] {
  const excludeSet = new Set(exclude)
  const available = createDeck().filter((card) => !excludeSet.has(card))
  // Fisher-Yates shuffle
  for (let i = available.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [available[i], available[j]] = [available[j], available[i]]
  }
  return available.slice(0, count)
}

/** Generate random hole cards (2 unique cards) */
function generateRandomHoleCards(): string[] {
  return drawCards(2)
}

/** Map postflop advice (PostflopAdvice) to the standard GTOAdvice shape used by the store. */
function toGTOAdvice(
  action: GTOAction,
  frequency: number,
  betSize?: number,
): GTOAdvice {
  return { action, frequency, raiseSize: betSize }
}

/** Default position for the coach user (heads-up Button). */
const DEFAULT_POSITION: Position = "BTN"

// ====== Store 类型定义 ======

interface CoachState {
  // 训练会话
  currentSession: CoachSession | null
  sessions: CoachSession[]
  decisions: CoachDecision[]
  feedbacks: CoachFeedback[]

  // 当前手牌状态
  handNumber: number
  street: Street
  potSize: number
  userStack: number
  opponentStack: number
  holeCards: string[]
  boardCards: string[]
  isUserTurn: boolean
  isHandComplete: boolean
  handResult: string | null
  netChips: number

  // Amount the user needs to call right now (for getPotOdds)
  currentCallAmount: number

  // 训练设置
  settings: TrainingSettings

  // 加载状态
  loading: boolean
  error: string | null
}

interface CoachActions {
  // 训练设置
  setSettings: (settings: Partial<TrainingSettings>) => void

  // 会话管理
  createSession: () => void
  loadSessions: () => void
  endSession: (action: "complete" | "abandon") => void

  // 手牌流程
  dealNewHand: () => void
  advanceStreet: () => void
  recordDecision: (action: UserAction, betAmount: number) => void
  nextHand: () => void

  // 查询
  getCurrentAdvice: () => { action: GTOAction; frequency: number; raiseSize?: number }
  getCurrentEquity: () => number
  getPotOdds: () => number
  getCurrentEV: () => number

  // 状态
  setLoading: (loading: boolean) => void
  reset: () => void
}

const DEFAULT_SETTINGS: TrainingSettings = {
  mode: "cash",
  startingStack: 10000,
  blindSmall: 50,
  blindBig: 100,
  opponentStyle: "gto",
  totalHands: 25,
}

const initialState: CoachState = {
  currentSession: null,
  sessions: [],
  decisions: [],
  feedbacks: [],
  handNumber: 0,
  street: "preflop",
  potSize: 0,
  userStack: 10000,
  opponentStack: 10000,
  holeCards: [],
  boardCards: [],
  isUserTurn: true,
  isHandComplete: false,
  handResult: null,
  netChips: 0,
  currentCallAmount: 0,
  settings: DEFAULT_SETTINGS,
  loading: false,
  error: null,
}

export const useCoachStore = create<CoachState & CoachActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      setSettings: (partial) =>
        set((state) => ({ settings: { ...state.settings, ...partial } })),

      createSession: () => {
        const { settings } = get()
        const now = new Date().toISOString()
        const session: CoachSession = {
          id: `coach-${Date.now()}`,
          mode: settings.mode,
          status: "in_progress",
          startingStack: settings.startingStack,
          blindSmall: settings.blindSmall,
          blindBig: settings.blindBig,
          opponentStyle: settings.opponentStyle,
          totalHands: 0,
          totalEv: 0,
          createdAt: now,
          completedAt: null,
        }
        set({
          currentSession: session,
          sessions: [session, ...get().sessions],
          decisions: [],
          feedbacks: [],
          handNumber: 0,
          userStack: settings.startingStack,
          opponentStack: settings.startingStack,
          potSize: 0,
          street: "preflop",
          holeCards: [],
          boardCards: [],
          isUserTurn: true,
          isHandComplete: false,
          handResult: null,
          netChips: 0,
          currentCallAmount: 0,
        })
      },

      loadSessions: () => {
        // Sessions are already hydrated from localStorage by zustand persist middleware.
        // This method is a no-op required by the CoachActions interface.
      },

      endSession: (action) => {
        const { currentSession } = get()
        if (!currentSession) return
        const now = new Date().toISOString()
        const updated: CoachSession = {
          ...currentSession,
          status: action === "complete" ? "completed" : "abandoned",
          completedAt: now,
        }
        set((state) => ({
          currentSession: updated,
          sessions: state.sessions.map((s) => (s.id === updated.id ? updated : s)),
        }))
      },

      dealNewHand: () => {
        const { currentSession, settings } = get()
        if (!currentSession) return

        const handNum = get().handNumber + 1
        const holeCards = generateRandomHoleCards()
        const street: Street = "preflop"

        set({
          handNumber: handNum,
          street,
          holeCards,
          boardCards: [],
          potSize: settings.blindSmall + settings.blindBig,
          isUserTurn: true,
          isHandComplete: false,
          handResult: null,
          netChips: 0,
          // Preflop: user faces the big blind — the amount to call is the big blind
          currentCallAmount: settings.blindBig,
        })
      },

      advanceStreet: () => {
        const { street, boardCards, holeCards } = get()
        const nextStreet: Record<Street, Street | null> = {
          preflop: "flop",
          flop: "turn",
          turn: "river",
          river: null,
        }
        const next = nextStreet[street]
        if (!next) {
          set({ isHandComplete: true, handResult: "win", netChips: get().potSize })
          return
        }

        // Deal incrementally: flop = 3 new cards, turn/river = 1 new card
        let newBoardCards: string[]
        if (next === "flop") {
          newBoardCards = drawCards(3, [...holeCards])
        } else {
          // turn or river: add 1 card to existing board, excluding all known cards
          newBoardCards = [...boardCards, ...drawCards(1, [...holeCards, ...boardCards])]
        }

        set({
          street: next,
          boardCards: newBoardCards,
          isUserTurn: true,
          // On a new street user can check for free; call amount always resets to 0
          currentCallAmount: 0,
        })
      },

      recordDecision: (action, betAmount) => {
        const state = get()
        const { currentSession, holeCards, boardCards, potSize, userStack, opponentStack, street, handNumber } = state
        if (!currentSession) return

        // --- 1. GTO advice via real engines ---
        let gtoAdvice: GTOAdvice
        if (street === "preflop") {
          const advices = getPreflopAdvice(DEFAULT_POSITION, holeCards)
          const selected = selectRandomAdvice(advices)
          gtoAdvice = { action: selected.action, frequency: selected.frequency, raiseSize: selected.raiseSize }
        } else {
          const handStrength = evaluateHandStrength(holeCards, boardCards)
          const postflop = getPostflopAdvice(street, handStrength, potSize, userStack, true)
          gtoAdvice = toGTOAdvice(postflop.action, postflop.frequency, postflop.betSize)
        }

        // --- 2. Equity via real engine ---
        const equityResult = calculateEquity(holeCards, boardCards)
        const equity = equityResult.equity

        // --- 3. Pot odds & EV via real engine formulas ---
        const callAmount = action === "call" ? betAmount : 0
        const potOdds = calculatePotOdds(potSize, callAmount)
        const ev = calculateEV(equity, potSize, callAmount)

        // --- 4. Deviation feedback via real engine ---
        const context: DecisionContext = { street, equity, potOdds, ev, potSize }
        const deviationResult = evaluateDeviation(action, gtoAdvice, context)
        const isCorrect = deviationResult.feedbackType === "positive"

        // --- 5. Opponent decision via real engine ---
        const opponentResponse = action === "fold"
          ? { action: "none" as const, betAmount: 0 }
          : getOpponentDecision(
              street,
              holeCards,
              boardCards,
              potSize,
              opponentStack,
              action,
              betAmount,
              currentSession.opponentStyle || "gto",
            )

        // --- 6. Compute stack updates ---
        let newPot = potSize
        let newUserStack = userStack
        let newOpponentStack = opponentStack

        if (action === "fold") {
          newPot = potSize
        } else if (opponentResponse.action === "fold") {
          newUserStack = userStack - betAmount + potSize
          newPot = 0
        } else {
          newUserStack = userStack - betAmount
          newOpponentStack = opponentStack - opponentResponse.betAmount
          newPot = potSize + betAmount + opponentResponse.betAmount
        }

        // --- 7. Build decision record ---
        const decision: CoachDecision = {
          id: `dec-${Date.now()}`,
          sessionId: currentSession.id,
          handNumber,
          street,
          holeCards,
          boardCards,
          potSize,
          userStack,
          opponentStack,
          userAction: action,
          userBetAmount: betAmount,
          opponentAction: opponentResponse.action === "none" ? null : opponentResponse.action,
          opponentBetAmount: opponentResponse.betAmount,
          gtoRecommendation: gtoAdvice.action,
          gtoFrequency: gtoAdvice.frequency,
          equity,
          potOdds,
          ev,
          isCorrect,
          deviation: deviationResult.deviationScore,
          result: action === "fold" ? "fold" : opponentResponse.action === "fold" ? "win" : null,
          netChips: action === "fold" ? -betAmount : opponentResponse.action === "fold" ? potSize : 0,
          createdAt: new Date().toISOString(),
        }

        const feedbackRecord: CoachFeedback = {
          id: `fb-${Date.now()}`,
          sessionId: currentSession.id,
          decisionId: decision.id,
          feedbackType: deviationResult.feedbackType,
          message: deviationResult.message,
          suggestion: deviationResult.suggestion,
          createdAt: new Date().toISOString(),
        }

        // --- 8. Determine if hand is over ---
        const isHandOver = action === "fold" || opponentResponse.action === "fold" || street === "river"

        set({
          decisions: [...state.decisions, decision],
          feedbacks: [...state.feedbacks, feedbackRecord],
          potSize: newPot,
          userStack: newUserStack,
          opponentStack: newOpponentStack,
          isUserTurn: false,
          isHandComplete: isHandOver,
          handResult: isHandOver ? (action === "fold" ? "lose" : opponentResponse.action === "fold" ? "win" : null) : null,
          netChips: isHandOver ? (action === "fold" ? -betAmount : opponentResponse.action === "fold" ? potSize : 0) : 0,
        })
      },

      nextHand: () => {
        const { currentSession, decisions } = get()
        if (!currentSession) return

        const totalEv = decisions.reduce((sum, d) => sum + (d.ev || 0), 0)
        const updatedSession: CoachSession = {
          ...currentSession,
          totalHands: get().handNumber,
          totalEv,
        }

        set({
          currentSession: updatedSession,
          sessions: get().sessions.map((s) => (s.id === updatedSession.id ? updatedSession : s)),
          street: "preflop",
          holeCards: [],
          boardCards: [],
          potSize: 0,
          isUserTurn: true,
          isHandComplete: false,
          handResult: null,
          netChips: 0,
          currentCallAmount: 0,
        })
      },

      getCurrentAdvice: () => {
        const { holeCards, street, boardCards, potSize, userStack } = get()
        if (street === "preflop") {
          const advices = getPreflopAdvice(DEFAULT_POSITION, holeCards)
          const selected = selectRandomAdvice(advices)
          return { action: selected.action, frequency: selected.frequency, raiseSize: selected.raiseSize }
        }
        const handStrength = evaluateHandStrength(holeCards, boardCards)
        const postflop = getPostflopAdvice(street, handStrength, potSize, userStack, true)
        return { action: postflop.action, frequency: postflop.frequency, raiseSize: postflop.betSize }
      },

      getCurrentEquity: () => {
        const { holeCards, boardCards } = get()
        return calculateEquity(holeCards, boardCards).equity
      },

      getPotOdds: () => {
        const { potSize, currentCallAmount } = get()
        return calculatePotOdds(potSize, currentCallAmount)
      },

      getCurrentEV: () => {
        const equity = get().getCurrentEquity()
        const { potSize, currentCallAmount } = get()
        return calculateEV(equity, potSize, currentCallAmount)
      },

      setLoading: (loading) => set({ loading }),

      reset: () => set(initialState),
    }),
    {
      name: "poker-coach-store",
      partialize: (state) => ({
        sessions: state.sessions,
        decisions: state.decisions,
        feedbacks: state.feedbacks,
        settings: state.settings,
      }),
    }
  )
)
