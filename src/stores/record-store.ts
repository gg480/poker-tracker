import { create } from "zustand"

interface RecordState {
  records: any[]
  sessions: any[]
  loading: boolean
}

interface RecordActions {
  loadRecords: (records: any[]) => void
  addRecord: (record: any) => void
  addRecords: (records: any[]) => void
  removeRecordsByDate: (date: string) => void
  loadSessions: (sessions: any[]) => void
  addSession: (session: any) => void
  updateSession: (session: any) => void
  removeSession: (sessionId: string) => void
  setLoading: (loading: boolean) => void
  reset: () => void
}

const initialState: RecordState = {
  records: [],
  sessions: [],
  loading: false,
}

export const useRecordStore = create<RecordState & RecordActions>()((set) => ({
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
}))
