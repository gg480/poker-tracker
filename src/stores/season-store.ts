import { create } from "zustand"

interface SeasonState {
  seasons: any[]
  activeSeason: any | null
  loading: boolean
}

interface SeasonActions {
  loadSeasons: (seasons: any[]) => void
  addSeason: (season: any) => void
  updateSeason: (season: any) => void
  endSeason: (season: any) => void
  setActiveSeason: (season: any | null) => void
  setLoading: (loading: boolean) => void
  reset: () => void
}

const initialState: SeasonState = {
  seasons: [],
  activeSeason: null,
  loading: false,
}

export const useSeasonStore = create<SeasonState & SeasonActions>()((set) => ({
  ...initialState,

  loadSeasons: (seasons) =>
    set({
      seasons,
      activeSeason: seasons.find((s: any) => s.active) || null,
    }),

  addSeason: (season) =>
    set((state) => ({
      seasons: [season, ...state.seasons],
      activeSeason: season.active ? season : state.activeSeason,
    })),

  updateSeason: (season) =>
    set((state) => ({
      seasons: state.seasons.map((s: any) => (s.id === season.id ? season : s)),
      activeSeason:
        state.activeSeason?.id === season.id ? season : state.activeSeason,
    })),

  endSeason: (season) =>
    set((state) => ({
      seasons: state.seasons.map((s: any) => (s.id === season.id ? season : s)),
      activeSeason:
        state.activeSeason?.id === season.id ? null : state.activeSeason,
    })),

  setActiveSeason: (season) => set({ activeSeason: season }),

  setLoading: (loading) => set({ loading }),

  reset: () => set(initialState),
}))
