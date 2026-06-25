import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"

// ==================== Variants ====================

const statCardVariants = cva("", {
  variants: {
    variant: {
      default: "",
      positive: "border-l-[3px] border-l-emerald-500/50",
      negative: "border-l-[3px] border-l-red-500/50",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

// ==================== Trend Helpers ====================

const trendConfig = {
  up: {
    Icon: TrendingUp,
    color: "text-emerald-500",
  },
  down: {
    Icon: TrendingDown,
    color: "text-red-500",
  },
  neutral: {
    Icon: Minus,
    color: "text-muted-foreground",
  },
} as const

// ==================== Props ====================

interface StatCardProps
  extends React.ComponentProps<"div">,
    VariantProps<typeof statCardVariants> {
  /** 指标标题 */
  title: string
  /** 指标数值 */
  value: string | number
  /** 可选图标（右侧展示） */
  icon?: React.ReactNode
  /** 趋势方向 */
  trend?: "up" | "down" | "neutral"
  /** 趋势数值说明（如 "+15%"），仅在 trend 传入时生效 */
  trendLabel?: string
  /** 描述/副文本 */
  description?: string
  /** 上升趋势的 aria-label 文本（默认 "上升"） */
  trendUpAria?: string
  /** 下降趋势的 aria-label 文本（默认 "下降"） */
  trendDownAria?: string
  /** 持平趋势的 aria-label 文本（默认 "持平"） */
  trendNeutralAria?: string
}

// ==================== Component ====================

function StatCard({
  className,
  variant,
  title,
  value,
  icon,
  trend,
  trendLabel,
  description,
  trendUpAria = "上升",
  trendDownAria = "下降",
  trendNeutralAria = "持平",
  ...props
}: StatCardProps) {
  const t = trend ? trendConfig[trend] : null
  const trendAria = trend === "up" ? trendUpAria : trend === "down" ? trendDownAria : trendNeutralAria

  return (
    <Card
      data-slot="stat-card"
      className={cn(statCardVariants({ variant }), className)}
      {...props}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          {/* --- Left: text group --- */}
          <div className="space-y-1 min-w-0 flex-1">
            {/* Title row */}
            <p className="text-xs text-muted-foreground font-medium truncate">
              {title}
            </p>

            {/* Value + trend */}
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tabular-nums tracking-tight">
                {value}
              </span>
              {t && (
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 text-xs font-medium shrink-0",
                    t.color,
                  )}
                  aria-label={`${title} ${trendAria}`}
                >
                  <t.Icon className="size-3.5" aria-hidden />
                  {trendLabel && <span>{trendLabel}</span>}
                </span>
              )}
            </div>

            {/* Description */}
            {description && (
              <p className="text-xs text-muted-foreground/70">{description}</p>
            )}
          </div>

          {/* --- Right: optional icon --- */}
          {icon && (
            <div className="p-2 rounded-lg bg-muted/50 shrink-0 text-muted-foreground">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export { StatCard, statCardVariants }
