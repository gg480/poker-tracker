import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { AIConfig } from "@/lib/types"

interface AIConfigState {
  config: AIConfig
}

interface AIConfigActions {
  setConfig: (config: Partial<AIConfig>) => void
  resetConfig: () => void
}

const defaultConfig: AIConfig = {
  apiKey: "",
  baseUrl: "",
  model: "doubao-seed-2-0-lite-260215",
  temperature: 0.8,
}

export const useAIConfigStore = create<AIConfigState & AIConfigActions>()(
  persist(
    (set) => ({
      config: { ...defaultConfig },
      setConfig: (partial) =>
        set((state) => ({
          config: { ...state.config, ...partial },
        })),
      resetConfig: () => set({ config: { ...defaultConfig } }),
    }),
    {
      name: "poker-ai-config",
    }
  )
)
