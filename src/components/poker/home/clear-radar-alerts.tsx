"use client"

import type { ClearRadarAlert } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface ClearRadarAlertsProps {
  alerts: ClearRadarAlert[]
  onSettle?: (player: string) => void
}

const LEVEL_CONFIG = {
  alert: {
    icon: "⚠️",
    borderColor: "border-amber-500/40",
    bgColor: "bg-amber-500/10",
    textColor: "text-amber-400",
    label: "预警",
  },
  trigger: {
    icon: "🔴",
    borderColor: "border-red-500/40",
    bgColor: "bg-red-500/10",
    textColor: "text-red-400",
    label: "触发",
  },
  reminder: {
    icon: "🔔",
    borderColor: "border-orange-500/40",
    bgColor: "bg-orange-500/10",
    textColor: "text-orange-400",
    label: "催办",
  },
  none: {
    icon: "",
    borderColor: "",
    bgColor: "",
    textColor: "",
    label: "",
  },
}

export function ClearRadarAlerts({ alerts, onSettle }: ClearRadarAlertsProps) {
  if (alerts.length === 0) {
    return (
      <Card className="border-border/40 bg-card/60 backdrop-blur">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="text-lg">📡</span> 清分雷达
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            暂无清分提醒 ✨
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="text-lg">📡</span> 清分雷达
          <span className="text-xs text-muted-foreground font-normal">
            {alerts.length} 条提醒
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {alerts.map((alert) => {
            const config = LEVEL_CONFIG[alert.level]
            return (
              <div
                key={`${alert.player}-${alert.seasonId}`}
                className={`flex items-center justify-between p-3 rounded-lg border ${config.borderColor} ${config.bgColor}`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{config.icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${config.textColor}`}>
                        {alert.player}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/30 text-muted-foreground">
                        {config.label}
                      </span>
                    </div>
                    <p className={`text-xs mt-0.5 ${config.textColor} opacity-80`}>
                      {alert.message}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`font-mono text-sm font-semibold ${config.textColor}`}>
                    {alert.balance.toLocaleString()}
                  </span>
                  {onSettle && alert.level !== "alert" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => onSettle(alert.player)}
                    >
                      清分
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
