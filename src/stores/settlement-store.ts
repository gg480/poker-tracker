import type { PlayerSettlement } from "@/lib/types"
import { create } from "zustand"
import { persist } from "zustand/middleware"

interface SettlementState {
  settlements: PlayerSettlement[]
  loading: boolean
}

interface SettlementActions {
  loadSettlements: (settlements: PlayerSettlement[]) => void
  upsertSettlement: (settlement: PlayerSettlement) => void
  getBalance: (player: string, seasonId: string, totalScore: number) => number
  setLoading: (loading: boolean) => void
  reset: () => void
}

const initialState: SettlementState = {
  settlements: [],
  loading: false,
}

export const useSettlementStore = create<SettlementState & SettlementActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      loadSettlements: (settlements) => set({ settlements }),

      upsertSettlement: (settlement) =>
        set((state) => {
          const idx = state.settlements.findIndex(
            (s: PlayerSettlement) => s.player === settlement.player && s.seasonId === settlement.seasonId
          )
          if (idx >= 0) {
            const updated = [...state.settlements]
            updated[idx] = settlement
            return { settlements: updated }
          }
          return { settlements: [...state.settlements, settlement] }
        }),

      getBalance: (player, seasonId, totalScore) => {
        const settlement = get().settlements.find(
          (s: PlayerSettlement) => s.player === player && s.seasonId === seasonId
        )
        if (!settlement) return totalScore
        return totalScore - settlement.settleScore + settlement.seasonAdjust
      },

      setLoading: (loading) => set({ loading }),

      reset: () => set(initialState),
    }),
    {
      name: "poker-settlement-store",
      partialize: (state) => ({
        settlements: state.settlements,
      }),
    }
  )
)
