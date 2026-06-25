import type { PokerRecord, GameSession } from "@/lib/types"
import { create } from "zustand"
import { persist } from "zustand/middleware"

interface RecordState {
  records: PokerRecord[]
  sessions: GameSession[]
  loading: boolean
}

interface RecordActions {
  loadRecords: (records: PokerRecord[]) => void
  addRecord: (record: PokerRecord) => void
  addRecords: (records: PokerRecord[]) => void
  removeRecordsByDate: (date: string) => void
  loadSessions: (sessions: GameSession[]) => void
  addSession: (session: GameSession) => void
  updateSession: (session: GameSession) => void
  removeSession: (sessionId: string) => void
  setLoading: (loading: boolean) => void
  reset: () => void
}

const initialState: RecordState = {
  records: [],
  sessions: [],
  loading: false,
}

export const useRecordStore = create<RecordState & RecordActions>()(
  persist(
    (set) => ({
      ...initialState,

      loadRecords: (records) => set({ records }),

      addRecord: (record) =>
        set((state) => ({ records: [record, ...state.records] })),

      addRecords: (records) =>
        set((state) => ({ records: [...records, ...state.records] })),

      removeRecordsByDate: (date) =>
        set((state) => ({
          records: state.records.filter((r) => r.date !== date),
        })),

      loadSessions: (sessions) => set({ sessions }),

      addSession: (session) =>
        set((state) => ({ sessions: [session, ...state.sessions] })),

      updateSession: (session) =>
        set((state) => ({
          sessions: state.sessions.map((s) => (s.id === session.id ? session : s)),
        })),

      removeSession: (sessionId) =>
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== sessionId),
        })),

      setLoading: (loading) => set({ loading }),

      reset: () => set(initialState),
    }),
    {
      name: "poker-record-store",
      partialize: (state) => ({
        records: state.records,
        sessions: state.sessions,
      }),
    }
  )
)
