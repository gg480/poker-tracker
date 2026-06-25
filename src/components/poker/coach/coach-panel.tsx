"use client"

import type { GTOAction, CoachFeedback } from "@/lib/coach/types"

interface CoachPanelProps {
  advice: { action: GTOAction; frequency: number; raiseSize?: number } | null
  equity: number
  potOdds: number
  ev: number
  feedback: CoachFeedback | null
  handNumber: number
}

const ACTION_LABELS: Record<GTOAction, string> = {
  fold: "弃牌",
  check: "过牌",
  call: "跟注",
  raise: "加注",
}

const FEEDBACK_COLORS: Record<string, string> = {
  positive: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  minor_deviation: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  major_deviation: "border-red-500/30 bg-red-500/10 text-red-400",
}

const FEEDBACK_ICONS: Record<string, string> = {
  positive: "✅",
  minor_deviation: "⚠️",
  major_deviation: "❌",
}

export function CoachPanel({ advice, equity, potOdds, ev, feedback, handNumber }: CoachPanelProps) {
  const equityPct = (equity * 100).toFixed(1)
  const potOddsPct = (potOdds * 100).toFixed(1)
  const isEvPositive = ev >= 0

  return (
    <div className="space-y-3">
      {/* 手牌信息 */}
      <div className="p-3 rounded-xl bg-card/50 border border-border/40">
        <div className="text-[10px] text-muted-foreground/50 font-mono mb-1">
          第 {handNumber} 手
        </div>
        <div className="text-xs font-semibold text-muted-foreground">教练面板</div>
      </div>

      {/* GTO 建议 */}
      <div className="p-3 rounded-xl bg-card/50 border border-border/40 space-y-2">
        <h4 className="text-xs font-semibold text-muted-foreground/70">GTO 建议</h4>
        {advice ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground/60">推荐动作</span>
              <span className="text-sm font-bold text-primary">
                {ACTION_LABELS[advice.action] || advice.action}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground/60">频率</span>
              <span className="text-xs font-mono font-semibold">
                {Math.round(advice.frequency * 100)}%
              </span>
            </div>
            {advice.raiseSize && advice.raiseSize > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground/60">加注尺寸</span>
                <span className="text-xs font-mono font-semibold text-amber-400">
                  {advice.raiseSize} BB
                </span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground/50">等待决策时机...</p>
        )}
      </div>

      {/* 胜率 / 赔率 / EV */}
      <div className="grid grid-cols-1 gap-2">
        <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <div className="text-[10px] text-muted-foreground/70 font-medium mb-0.5">胜率</div>
          <div className="text-lg font-bold text-blue-400 font-mono">{equityPct}%</div>
        </div>
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <div className="text-[10px] text-muted-foreground/70 font-medium mb-0.5">底池赔率</div>
          <div className="text-lg font-bold text-amber-400 font-mono">{potOddsPct}%</div>
        </div>
        <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
          <div className="text-[10px] text-muted-foreground/70 font-medium mb-0.5">预期价值 (EV)</div>
          <div className={`text-lg font-bold font-mono ${isEvPositive ? "text-emerald-400" : "text-red-400"}`}>
            {ev >= 0 ? "+" : ""}{ev.toFixed(1)}
          </div>
        </div>
      </div>

      {/* 反馈 */}
      {feedback && (
        <div
          className={`p-3 rounded-xl border ${
            FEEDBACK_COLORS[feedback.feedbackType] || "border-border/40 bg-card/50"
          }`}
        >
          <div className="flex items-start gap-2">
            <span className="text-sm mt-0.5">
              {FEEDBACK_ICONS[feedback.feedbackType] || "💬"}
            </span>
            <div className="space-y-1 flex-1 min-w-0">
              <p className="text-xs font-medium">{feedback.message}</p>
              {feedback.suggestion && (
                <p className="text-[10px] text-muted-foreground/70">{feedback.suggestion}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 无反馈时的提示 */}
      {!feedback && handNumber > 0 && (
        <div className="p-3 rounded-xl border border-dashed border-border/30 bg-card/30">
          <p className="text-[10px] text-muted-foreground/50 text-center">做出决策后将显示反馈</p>
        </div>
      )}
    </div>
  )
}
