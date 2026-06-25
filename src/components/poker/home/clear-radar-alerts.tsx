"use client"

import { useEffect, useState } from "react"
import type { SettlementData } from "@/lib/excel-settlement-parser"
import { TEXT_POSITIVE, TEXT_NEGATIVE } from "@/lib/constants"
import { Card, CardContent } from "@/components/ui/card"
import { Radar, AlertTriangle, Loader2 } from "lucide-react"

interface ClearRadarAlertsProps {}

// 从 API 获取清分数据
async function fetchSettlements(): Promise<SettlementData[]> {
  try {
    const res = await fetch("/api/settlements-excel")
    const json = await res.json()
    return json.success ? json.data as SettlementData[] : []
  } catch {
    return []
  }
}

// 单条清分行
function SettlementRow({ data }: { data: SettlementData }) {
  const isNegative = data.settleBalance < 0
  const balanceColor = isNegative ? TEXT_NEGATIVE : TEXT_POSITIVE
  const rowBorder = isNegative ? "border-red-500/40 bg-red-500/10" : "border-border/40 bg-muted/10"
  const Icon = isNegative ? AlertTriangle : Radar
  const iconColor = isNegative ? "text-red-400" : "text-muted-foreground"

  return (
    <div className={`flex items-center justify-between p-3 rounded-lg border ${rowBorder}`}>
      <div className="flex items-center gap-2 min-w-0">
        <Icon className={`size-4 shrink-0 ${iconColor}`} strokeWidth={2} />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${isNegative ? "text-red-400" : ""}`}>
              {data.player}
            </span>
            {isNegative && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">
                负余额
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
            <span>清分 {data.settleCount} 次</span>
            <span>兑现 {data.cashedCount} 次</span>
            {data.season1Settle !== 0 && (
              <span>赛季1 {data.season1Settle.toLocaleString()}</span>
            )}
          </div>
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className={`font-mono text-sm font-semibold ${balanceColor}`}>
          {data.settleBalance.toLocaleString()}
        </div>
        <div className="text-[10px] text-muted-foreground">清分余额</div>
      </div>
    </div>
  )
}

export function ClearRadarAlerts({}: ClearRadarAlertsProps) {
  const [data, setData] = useState<SettlementData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const result = await fetchSettlements()
      setData(result)
      setLoading(false)
    }
    load()
  }, [])

  // 按清分余额升序排列（负数在前）
  const sortedData = [...data].sort((a, b) => a.settleBalance - b.settleBalance)

  return (
    <Card className="glass-card spotlight-border">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Radar className="size-4 text-primary" strokeWidth={2} />
          <span className="text-sm font-semibold">清分雷达</span>
          {!loading && data.length > 0 && (
            <span className="text-xs text-muted-foreground font-normal">
              {data.length} 条数据
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">加载清分数据...</span>
          </div>
        ) : sortedData.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            暂无清分数据
          </p>
        ) : (
          <div className="space-y-2">
            {sortedData.map((item) => (
              <SettlementRow key={item.player} data={item} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
