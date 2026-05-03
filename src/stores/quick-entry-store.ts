"use client"

import { create } from "zustand"
import type { Card } from "@/components/poker/hand/poker-engine"

export type QuickResult = "win" | "lose" | "split"
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

interface QuickEntryState {
  step: 1 | 2 | 3
  heroCards: Card[]
  result: QuickResult | null
  tag: QuickTag | null
  note: string

  setHeroCards: (cards: Card[]) => void
  setResult: (result: QuickResult) => void
  setTag: (tag: QuickTag) => void
  setNote: (note: string) => void
  nextStep: () => void
  prevStep: () => void
  reset: () => void
}

export const useQuickEntryStore = create<QuickEntryState>((set) => ({
  step: 1,
  heroCards: [],
  result: null,
  tag: null,
  note: "",

  setHeroCards: (heroCards) => set({ heroCards }),
  setResult: (result) => set({ result }),
  setTag: (tag) => set({ tag }),
  setNote: (note) => set({ note }),
  nextStep: () => set((s) => ({ step: (Math.min(s.step + 1, 3)) as 1 | 2 | 3 })),
  prevStep: () => set((s) => ({ step: (Math.max(s.step - 1, 1)) as 1 | 2 | 3 })),
  reset: () => set({
    step: 1, heroCards: [], result: null, tag: null, note: "",
  }),
}))
