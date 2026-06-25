"use client"

import { create } from "zustand"
import { useShallow } from "zustand/react/shallow"
import type { Card } from "@/components/poker/hand/poker-engine"

import type { QuickTag } from '@/lib/constants'

// Re-exported from constants.ts for backward compatibility.
// New code should import from @/lib/constants instead.
export { QUICK_TAGS, QUICK_TAG_ICONS } from '@/lib/constants'
export type { QuickTag }

export type QuickResult = "win" | "lose" | "split"

// ==================== State & Actions ====================

export interface QuickEntryState {
  step: 1 | 2 | 3
  heroCards: Card[]
  result: QuickResult | null
  tag: QuickTag | null
  note: string
}

export interface QuickEntryActions {
  setHeroCards: (cards: Card[]) => void
  setResult: (result: QuickResult) => void
  setTag: (tag: QuickTag) => void
  setNote: (note: string) => void
  nextStep: () => void
  prevStep: () => void
  reset: () => void
}

const initialState: QuickEntryState = {
  step: 1,
  heroCards: [],
  result: null,
  tag: null,
  note: "",
}

// ==================== Derived State (pure functions) ====================

/**
 * Whether the user can advance from the current step:
 * - Step 1: 2 hero cards must be selected
 * - Step 2: a result must be selected
 * - Step 3: a tag must be selected
 */
export function canProceed(state: QuickEntryState): boolean {
  switch (state.step) {
    case 1: return state.heroCards.length === 2
    case 2: return state.result !== null
    case 3: return state.tag !== null
    default: return false
  }
}

/**
 * Whether the user can go back from the current step.
 * Always returns true for step > 1 in a 3-step form.
 * Exported as a derived selector for API symmetry with `canProceed`.
 */
export function canGoBack(state: QuickEntryState): boolean {
  return state.step > 1
}

/**
 * All required fields are filled — the entry is ready to save.
 */
export function isComplete(state: QuickEntryState): boolean {
  return state.heroCards.length === 2 && state.result !== null && state.tag !== null
}

// ==================== Store ====================

export const useQuickEntryStore = create<QuickEntryState & QuickEntryActions>()(
  (set, get) => ({
    ...initialState,

    /**
     * Set the hero's hole cards. `canProceed` expects exactly 2 cards
     * before allowing the user to advance past step 1.
     */
    setHeroCards: (heroCards) => set({ heroCards }),
    setResult: (result) => set({ result }),
    setTag: (tag) => set({ tag }),
    setNote: (note) => set({ note }),

    /**
     * Advance to the next step.
     * Guard: refuses to advance if the current step's prerequisites are not met.
     */
    nextStep: () => {
      const state = get()
      if (!canProceed(state)) return
      if (state.step >= 3) return
      set({ step: (state.step + 1) as 1 | 2 | 3 })
    },

    /**
     * Go back to the previous step (always allowed).
     */
    prevStep: () => {
      const state = get()
      if (state.step <= 1) return
      set({ step: (state.step - 1) as 1 | 2 | 3 })
    },

    /**
     * Reset the entire form to its initial state.
     */
    reset: () => set(initialState),
  }),
)

// ==================== Imperative Accessor ====================

/**
 * Read the current QuickEntry state outside of React.
 *
 * Useful for service workers, event handlers, or any non-React code
 * that needs to inspect the form state without subscribing to a hook.
 *
 * @example
 *   import { getQuickEntryState, useQuickEntryStore } from './quick-entry-store'
 *   const state = getQuickEntryState()
 *   if (state.step === 1) { /* ... *​/ }
 */
export function getQuickEntryState(): QuickEntryState {
  const { step, heroCards, result, tag, note } = useQuickEntryStore.getState()
  return { step, heroCards, result, tag, note }
}

/**
 * Imperative access to QuickEntry actions outside of React.
 *
 * @example
 *   const { reset } = getQuickEntryActions()
 *   reset()
 */
export function getQuickEntryActions(): QuickEntryActions {
  const { setHeroCards, setResult, setTag, setNote, nextStep, prevStep, reset } =
    useQuickEntryStore.getState()
  return { setHeroCards, setResult, setTag, setNote, nextStep, prevStep, reset }
}

// ==================== Specialized Selectors ====================

/**
 * Subscribe to actions only — never re-renders on state changes.
 * Use this in callbacks or effects that only dispatch actions.
 *
 * @example
 *   const { reset } = useQuickEntryActions()
 */
export function useQuickEntryActions(): QuickEntryActions {
  return useQuickEntryStore(
    useShallow((s) => ({
      setHeroCards: s.setHeroCards,
      setResult: s.setResult,
      setTag: s.setTag,
      setNote: s.setNote,
      nextStep: s.nextStep,
      prevStep: s.prevStep,
      reset: s.reset,
    })),
  )
}

/**
 * Subscribe to state with shallow comparison — avoids re-renders when
 * an unrelated slice of the store changes.
 *
 * @example
 *   const { step, heroCards } = useQuickEntryState()
 */
export function useQuickEntryState(): QuickEntryState {
  return useQuickEntryStore(
    useShallow((s) => ({
      step: s.step,
      heroCards: s.heroCards,
      tag: s.tag,
      result: s.result,
      note: s.note,
    })),
  )
}
