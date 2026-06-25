import { create } from "zustand"
import type { ImportLogDB } from "@/storage/database/crud"

// 文件监控器状态
interface WatcherStatus {
  watching: boolean
  dir: string
  lastEvent: string
}

// 手动触发导入的汇总信息
interface ImportSummary {
  totalFiles: number
  totalRecords: number
  skipped: number
  message: string
}

interface ImportState {
  watcherStatus: WatcherStatus | null
  importLogs: ImportLogDB[]
  loading: boolean
  importing: boolean
  error: string | null
  lastImportSummary: ImportSummary | null
}

interface ImportActions {
  loadStatus: () => Promise<void>
  triggerImport: () => Promise<void>
  clearError: () => void
}

export const useImportStore = create<ImportState & ImportActions>()((set) => ({
  watcherStatus: null,
  importLogs: [],
  loading: false,
  importing: false,
  error: null,
  lastImportSummary: null,

  loadStatus: async () => {
    set({ loading: true, error: null })
    try {
      const res = await fetch("/api/import-status")
      const json = await res.json()
      if (json.success) {
        set({
          watcherStatus: json.data.watcher as WatcherStatus,
          importLogs: json.data.imports as ImportLogDB[],
          loading: false,
        })
      } else {
        set({ loading: false, error: json.error || "加载失败" })
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "未知错误"
      set({ loading: false, error: msg })
    }
  },

  triggerImport: async () => {
    set({ importing: true, error: null })
    try {
      const res = await fetch("/api/import-status", { method: "POST" })
      const json = await res.json()
      if (json.success) {
        set({
          importing: false,
          lastImportSummary: json.data.summary as ImportSummary,
        })
        // 导入完成后刷新状态
        await useImportStore.getState().loadStatus()
      } else {
        set({ importing: false, error: json.error || "导入失败" })
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "未知错误"
      set({ importing: false, error: msg })
    }
  },

  clearError: () => set({ error: null }),
}))
