"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface QuickActionsProps {
  onNavigate: (tab: string) => void
}

export function QuickActions({ onNavigate }: QuickActionsProps) {
  return (
    <Card className="border-border/40 bg-card/60 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="text-lg">⚡</span> 快捷入口
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-auto py-3 flex-col gap-1"
            onClick={() => onNavigate("record")}
          >
            <span className="text-lg">✏️</span>
            <span className="text-xs">录入积分</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-auto py-3 flex-col gap-1"
            onClick={() => onNavigate("ranking")}
          >
            <span className="text-lg">🏆</span>
            <span className="text-xs">排行榜</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-auto py-3 flex-col gap-1"
            onClick={() => onNavigate("hand")}
          >
            <span className="text-lg">🃏</span>
            <span className="text-xs">记手牌</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-auto py-3 flex-col gap-1"
            onClick={() => onNavigate("profile")}
          >
            <span className="text-lg">⚙️</span>
            <span className="text-xs">管理</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
