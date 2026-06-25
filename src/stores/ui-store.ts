import { create } from "zustand"
import { persist } from "zustand/middleware"

/**
 * Tab identifiers used in the bottom navigation bar.
 * Note: `TabKey` in `@/lib/types` is the full superset (includes "coach").
 * This type is intentionally a subset — not all app sections appear as tabs.
 */
export type TabType = "home" | "record" | "ranking" | "hand" | "profile"

interface DialogStates {
  endSeason: boolean
  settlePlayer: boolean
  shareCard: boolean
  addHand: boolean
  importExport: boolean
}

interface UIState {
  activeTab: TabType
  seasonFilter: string
  selectedPlayer: string | null
  dialogStates: DialogStates
  currentSessionId: string | null
}

interface UIActions {
  setActiveTab: (tab: TabType) => void
  setSeasonFilter: (seasonId: string) => void
  setSelectedPlayer: (player: string | null) => void
  toggleDialog: (dialog: keyof DialogStates, open?: boolean) => void
  resetDialogs: () => void
  setCurrentSessionId: (sessionId: string | null) => void
}

const initialDialogStates: DialogStates = {
  endSeason: false,
  settlePlayer: false,
  shareCard: false,
  addHand: false,
  importExport: false,
}

export const useUIStore = create<UIState & UIActions>()(
  persist(
    (set) => ({
      activeTab: "home",
      seasonFilter: "all",
      selectedPlayer: null,
      dialogStates: initialDialogStates,
      currentSessionId: null,

      setActiveTab: (tab) => set({ activeTab: tab }),
      setSeasonFilter: (seasonId) => set({ seasonFilter: seasonId }),
      setSelectedPlayer: (player) => set({ selectedPlayer: player }),
      toggleDialog: (dialog, open) =>
        set((state) => ({
          dialogStates: {
            ...state.dialogStates,
            [dialog]: open !== undefined ? open : !state.dialogStates[dialog],
          },
        })),
      resetDialogs: () => set({ dialogStates: initialDialogStates }),
      setCurrentSessionId: (sessionId) => set({ currentSessionId: sessionId }),
    }),
    {
      name: "poker-ui-store",
      partialize: (state) => ({
        activeTab: state.activeTab,
        seasonFilter: state.seasonFilter,
        currentSessionId: state.currentSessionId,
      }),
      migrate: (persisted) => {
        const s = persisted as Record<string, unknown>
        if (s.seasonFilter === "") s.seasonFilter = "all"
        return s
      },
      version: 1,
    }
  )
)
