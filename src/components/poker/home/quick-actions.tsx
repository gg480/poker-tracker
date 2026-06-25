"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Pencil, Trophy, Spade, Settings, Zap } from "lucide-react"

interface QuickActionsProps {
  onNavigate: (tab: string) => void
}

export function QuickActions({ onNavigate }: QuickActionsProps) {
  const actions = [
    { icon: Pencil, label: "录入积分", tab: "record" },
    { icon: Trophy, label: "排行榜", tab: "ranking" },
    { icon: Spade, label: "记手牌", tab: "hand" },
    { icon: Settings, label: "管理", tab: "profile" },
  ]

  return (
    <Card className="glass-card spotlight-border">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="size-4 text-primary" strokeWidth={2} />
          <span className="text-sm font-semibold">快捷入口</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {actions.map((action) => {
            const Icon = action.icon
            return (
              <Button
                key={action.tab}
                variant="ghost"
                size="sm"
                className="h-auto py-3 flex-col gap-1.5 hover:bg-primary/10 hover:text-primary transition-all duration-200 active:scale-95"
                onClick={() => onNavigate(action.tab)}
              >
                <Icon className="size-5 text-muted-foreground group-hover:text-primary" strokeWidth={2} />
                <span className="text-[11px] font-medium">{action.label}</span>
              </Button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
