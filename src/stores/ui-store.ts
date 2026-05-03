import { create } from "zustand"
import { persist } from "zustand/middleware"

export type TabType = "home" | "record" | "ranking" | "hand" | "profile"

interface DialogStates {
  endSeason: boolean
  settlePlayer: boolean
  shareCard: boolean
  addHand: boolean
  importExport: boolean
  tencentDocs: boolean
}

interface UIState {
  activeTab: TabType
  seasonFilter: string
  selectedPlayer: string | null
  dialogStates: DialogStates
}

interface UIActions {
  setActiveTab: (tab: TabType) => void
  setSeasonFilter: (seasonId: string) => void
  setSelectedPlayer: (player: string | null) => void
  toggleDialog: (dialog: keyof DialogStates, open?: boolean) => void
  resetDialogs: () => void
}

const initialDialogStates: DialogStates = {
  endSeason: false,
  settlePlayer: false,
  shareCard: false,
  addHand: false,
  importExport: false,
  tencentDocs: false,
}

export const useUIStore = create<UIState & UIActions>()(
  persist(
    (set) => ({
      activeTab: "home",
      seasonFilter: "",
      selectedPlayer: null,
      dialogStates: initialDialogStates,

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
    }),
    {
      name: "poker-ui-store",
      partialize: (state) => ({
        activeTab: state.activeTab,
        seasonFilter: state.seasonFilter,
      }),
    }
  )
)
