import type { Season } from "@/lib/types"
import { create } from "zustand"
import { persist } from "zustand/middleware"

interface SeasonState {
  seasons: Season[]
  activeSeason: Season | null
  loading: boolean
}

interface SeasonActions {
  loadSeasons: (seasons: Season[]) => void
  addSeason: (season: Season) => void
  updateSeason: (season: Season) => void
  endSeason: (season: Season) => void
  setActiveSeason: (season: Season | null) => void
  setLoading: (loading: boolean) => void
  reset: () => void
}

const initialState: SeasonState = {
  seasons: [],
  activeSeason: null,
  loading: false,
}

export const useSeasonStore = create<SeasonState & SeasonActions>()(
  persist(
    (set) => ({
      ...initialState,

      loadSeasons: (seasons) =>
        set({
          seasons,
          activeSeason: seasons.find((s: Season) => s.active) || null,
        }),

      addSeason: (season) =>
        set((state) => ({
          seasons: [season, ...state.seasons],
          activeSeason: season.active ? season : state.activeSeason,
        })),

      updateSeason: (season) =>
        set((state) => ({
          seasons: state.seasons.map((s: Season) => (s.id === season.id ? season : s)),
          activeSeason:
            state.activeSeason?.id === season.id ? season : state.activeSeason,
        })),

      endSeason: (season) =>
        set((state) => ({
          seasons: state.seasons.map((s: Season) => (s.id === season.id ? season : s)),
          activeSeason:
            state.activeSeason?.id === season.id ? null : state.activeSeason,
        })),

      setActiveSeason: (season) => set({ activeSeason: season }),

      setLoading: (loading) => set({ loading }),

      reset: () => set(initialState),
    }),
    {
      name: "poker-season-store",
      partialize: (state) => ({
        seasons: state.seasons,
        activeSeason: state.activeSeason,
      }),
    }
  )
)
