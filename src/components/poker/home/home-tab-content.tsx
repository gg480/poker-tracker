"use client"

import type { PokerRecord, Season, PlayerSettlement, ComputedStats } from "@/lib/types"
import type { TabType } from "@/stores/ui-store"
import { SeasonOverview } from "@/components/poker/home/season-overview"
import { Dashboard } from "@/components/poker/dashboard"
import { ClearRadarAlerts } from "@/components/poker/home/clear-radar-alerts"

export interface HomeTabContentProps {
  currentSeason: Season | null
  stats: ComputedStats
  filteredRecords: PokerRecord[]
  filteredSettlements: PlayerSettlement[]
  setActiveTab: (tab: TabType) => void
  setSelectedPlayer: (name: string | null) => void
}

export function HomeTabContent({
  currentSeason,
  stats,
  filteredRecords,
  filteredSettlements,
  setActiveTab,
  setSelectedPlayer,
}: HomeTabContentProps) {
  return (
    <div className="space-y-5">
      <SeasonOverview
        season={currentSeason as Season}
        totalGames={stats.totalGames}
        totalPlayers={stats.players.length}
        settlements={filteredSettlements}
      />
      <Dashboard
        stats={stats}
        settlements={filteredSettlements}
        onPlayerClick={(name) => {
          setSelectedPlayer(name)
          setActiveTab("ranking")
        }}
      />
      <ClearRadarAlerts />
    </div>
  )
}
