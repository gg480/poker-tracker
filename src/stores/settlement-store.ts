import { create } from "zustand"

interface SettlementState {
  settlements: any[]
  loading: boolean
}

interface SettlementActions {
  loadSettlements: (settlements: any[]) => void
  upsertSettlement: (settlement: any) => void
  getBalance: (player: string, seasonId: string, totalScore: number) => number
  setLoading: (loading: boolean) => void
  reset: () => void
}

const initialState: SettlementState = {
  settlements: [],
  loading: false,
}

export const useSettlementStore = create<SettlementState & SettlementActions>()(
  (set, get) => ({
    ...initialState,

    loadSettlements: (settlements) => set({ settlements }),

    upsertSettlement: (settlement) =>
      set((state) => {
        const idx = state.settlements.findIndex(
          (s: any) => s.player === settlement.player && s.seasonId === settlement.seasonId
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
        (s: any) => s.player === player && s.seasonId === seasonId
      )
      if (!settlement) return totalScore
      return totalScore - settlement.settleScore + settlement.seasonAdjust
    },

    setLoading: (loading) => set({ loading }),

    reset: () => set(initialState),
  })
)
