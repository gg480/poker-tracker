"use client"

import { useState } from "react"
import { CardSelector, CardDisplay } from "./card-selector"
import { useQuickEntryStore, QUICK_TAGS, QUICK_TAG_ICONS, type QuickTag } from "@/stores/quick-entry-store"

export interface QuickEntrySaveData {
  heroCards: string[]
  boardCards: string[]
  result: number | null
  winner: string | null
  notes: string | null
  tags: string | null
  handId?: string
  sessionId?: string | null
}

interface QuickEntryWizardProps {
  onSave: (data: QuickEntrySaveData) => void
  onCancel: () => void
}

export function QuickEntryWizard({ onSave, onCancel }: QuickEntryWizardProps) {
  const { step, heroCards, result, tag, note, setHeroCards, setResult, setTag, setNote, nextStep, prevStep, reset } = useQuickEntryStore()
  const [saving, setSaving] = useState(false)

  const resultNumber = result === "win" ? 1 : result === "lose" ? -1 : 0

  const handleSave = () => {
    if (heroCards.length !== 2 || !result || !tag) return
    setSaving(true)
    onSave({
      heroCards: heroCards.map(cardName),
      boardCards: [],
      result: resultNumber,
      winner: null,
      notes: note || null,
      tags: tag,
      sessionId: null,
    })
    reset()
  }

  function cardName(card: number): string {
    const r = (card >> 4) & 0xF
    const s = card & 0xF
    const R = " 23456789TJQKA"
    const S = "cdhs"
    return `${R[r]}${S[s]}`
  }

  return (
    <div className="border border-border/50 rounded-lg bg-muted/10 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">⚡</span>
          <span className="text-sm font-semibold">快速记录手牌</span>
        </div>
        <button onClick={() => { reset(); onCancel() }} className="text-xs text-muted-foreground hover:text-white transition-colors">取消</button>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-3">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-1.5">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step === s ? "bg-primary text-primary-foreground" : step > s ? "bg-emerald-500/60 text-white" : "bg-muted/30 text-muted-foreground/50"}`}>
              {step > s ? "✓" : s}
            </div>
            <span className={`text-[10px] ${step === s ? "text-primary font-medium" : "text-muted-foreground/50"}`}>
              {s === 1 ? "选牌" : s === 2 ? "结果" : "标签"}
            </span>
            {s < 3 && <div className={`w-8 h-0.5 ${step > s ? "bg-emerald-500/60" : "bg-muted/30"} transition-all`} />}
          </div>
        ))}
      </div>

      {heroCards.length === 2 && (
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">手牌:</span>
          {heroCards.map((c) => <CardDisplay key={c} card={c} size="sm" />)}
        </div>
      )}

      {/* Step 1: Select Cards */}
      {step === 1 && (
        <div className="space-y-3">
          <div className="text-xs text-muted-foreground">选择你的起手牌（2张）</div>
          <CardSelector selectedCards={heroCards} onCardSelect={(c) => setHeroCards([...heroCards, c])} maxCards={2} />
          <div className="flex justify-end pt-2">
            <button onClick={nextStep} disabled={heroCards.length < 2}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-primary/20 text-primary border border-primary/40 hover:bg-primary/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
              下一步 →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Select Result */}
      {step === 2 && (
        <div className="space-y-3">
          <div className="text-xs text-muted-foreground">这手牌结果如何？</div>
          <div className="flex gap-3">
            {[
              { key: "win" as const, label: "🏆 赢了", color: "emerald" },
              { key: "lose" as const, label: "😞 输了", color: "red" },
              { key: "split" as const, label: "🤝 平分", color: "blue" },
            ].map((opt) => (
              <button key={opt.key} onClick={() => setResult(opt.key)}
                className={`flex-1 py-3 rounded-lg text-sm font-medium border transition-all ${result === opt.key
                  ? opt.color === "emerald" ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400" : opt.color === "red" ? "bg-red-500/20 border-red-500/40 text-red-400" : "bg-blue-500/20 border-blue-500/40 text-blue-400"
                  : "bg-muted/20 border-border/30 text-muted-foreground hover:bg-muted/30"}`}>
                {opt.label}
              </button>
            ))}
          </div>
          <div className="flex justify-between pt-2">
            <button onClick={prevStep} className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted/20 transition-all">← 上一步</button>
            <button onClick={nextStep} disabled={!result}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-primary/20 text-primary border border-primary/40 hover:bg-primary/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
              下一步 →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Tags + Note */}
      {step === 3 && (
        <div className="space-y-3">
          <div className="text-xs text-muted-foreground">添加标签</div>
          <div className="grid grid-cols-3 gap-2">
            {QUICK_TAGS.map((t) => (
              <button key={t} onClick={() => setTag(t)}
                className={`py-2.5 rounded-lg text-xs font-medium border transition-all ${tag === t
                  ? "bg-amber-500/20 border-amber-500/40 text-amber-400"
                  : "bg-muted/20 border-border/30 text-muted-foreground hover:bg-muted/30"}`}>
                {QUICK_TAG_ICONS[t]} {t}
              </button>
            ))}
          </div>

          <div className="text-xs text-muted-foreground">备注（可选）</div>
          <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={200}
            className="w-full px-3 py-2 rounded-lg bg-muted/20 border border-border/30 text-sm focus:outline-none focus:border-primary/50 transition-colors"
            placeholder="简短描述这手牌..." />

          <div className="flex justify-between pt-2">
            <button onClick={prevStep} className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted/20 transition-all">← 上一步</button>
            <button onClick={handleSave} disabled={!tag || saving}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
              {saving ? "保存中..." : "⚡ 保存"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
