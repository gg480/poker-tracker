"use client"

import { useMemo, useState, useCallback } from "react"
import {
  RANK_STR, SUIT_CHAR, SUIT_SYMBOL, SUIT_COLOR,
  POSITIONS, POSITION_LABEL, POSITIONS_FOR_N,
  ACTIONS, STREET_LABEL,
  makeCard, cardName, parseCardCode, cardRankStr, cardSuitChar, cardSuitSymbol,
  type Card, type Position, type Action, type Street, type GameAction,
} from "./poker-engine"

export type { Card, Position, Action, Street, GameAction }
export { makeCard, cardName, parseCardCode, cardRankStr, cardSuitChar, cardSuitSymbol, POSITIONS, POSITIONS_FOR_N, STREET_LABEL }

export const ACTION_LABELS: Record<Action, string> = {
  fold: "弃牌", check: "过牌", call: "跟注", bet: "下注", raise: "加注", all_in: "全下",
}

export const ACTION_COLORS: Record<Action, string> = {
  fold: "bg-red-500/20 text-red-400 border-red-500/30",
  check: "bg-slate-500/20 text-slate-300 border-slate-400/30",
  call: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  bet: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  raise: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  all_in: "bg-purple-500/20 text-purple-400 border-purple-500/30",
}

export function getBetLevelLabel(level: number): string {
  if (level <= 0) return ""
  if (level === 1) return "Open"
  if (level === 2) return "3-bet"
  if (level === 3) return "4-bet"
  if (level === 4) return "5-bet"
  return `${level + 1}-bet`
}

interface CardSelectorProps {
  selectedCards: Card[]
  onCardSelect: (card: Card) => void
  maxCards?: number
  label?: string
  disabledCards?: Card[]
}

export function CardSelector({ selectedCards, onCardSelect, maxCards = 5, label, disabledCards }: CardSelectorProps) {
  const selectedSet = useMemo(() => new Set(selectedCards), [selectedCards])
  const disabledSet = useMemo(() => new Set(disabledCards || []), [disabledCards])

  return (
    <div className="space-y-3">
      {label && <div className="text-xs text-muted-foreground">{label}</div>}
      <div className="space-y-2">
        {SUIT_CHAR.map((suit) => (
          <div key={suit} className="flex items-center gap-1.5">
            <span className={`w-8 text-center text-lg font-bold ${SUIT_COLOR[suit]}`}>{SUIT_SYMBOL[suit]}</span>
            <div className="flex gap-1">
              {RANK_STR.map((rank) => {
                const code = makeCard(rank, suit)
                const isSelected = selectedSet.has(code)
                const isDisabled = disabledSet.has(code)
                const isFull = selectedCards.length >= maxCards && !isSelected
                return (
                  <button key={code} disabled={isFull || isDisabled} onClick={() => onCardSelect(code)}
                    className={`w-9 h-8 rounded text-sm font-mono font-semibold transition-all duration-150
                      ${isSelected
                        ? suit === "h" || suit === "d"
                          ? "bg-red-500/25 text-red-300 ring-1 ring-red-500/50"
                          : "bg-slate-500/25 text-slate-200 ring-1 ring-slate-400/50"
                        : isDisabled ? "bg-muted/10 text-muted-foreground/20 cursor-not-allowed line-through"
                        : isFull ? "bg-muted/20 text-muted-foreground/30 cursor-not-allowed"
                        : "bg-muted/30 text-muted-foreground hover:bg-muted/50 active:scale-95"}`}>
                    {rank}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="text-xs text-muted-foreground">已选 {selectedCards.length}/{maxCards} 张</div>
    </div>
  )
}

export function CardDisplay({ card, size = "md" }: { card: Card; size?: "sm" | "md" | "lg" }) {
  const rank = cardRankStr(card)
  const suit = cardSuitChar(card)
  const symbol = cardSuitSymbol(card)
  const isRed = suit === "h" || suit === "d"
  const sizeClass = size === "sm" ? "w-8 h-12 text-xs" : size === "lg" ? "w-14 h-20 text-lg" : "w-10 h-14 text-sm"
  return (
    <div className={`${sizeClass} flex flex-col items-center justify-center rounded-md font-mono font-bold border
      ${isRed ? "border-red-500/40 bg-red-500/10 text-red-300" : "border-slate-400/40 bg-slate-500/10 text-slate-200"}`}>
      <span className="leading-none">{rank}</span>
      <span className="leading-none text-[0.85em]">{symbol}</span>
    </div>
  )
}

interface ActionSelectorProps {
  legalActions: Action[]
  toCall: number
  currentBet: number
  minRaise: number
  onAction: (action: Action, amount: number) => void
}

export function ActionSelector({ legalActions, toCall, currentBet, minRaise, onAction }: ActionSelectorProps) {
  const [pending, setPending] = useState<Action | null>(null)
  const [amountStr, setAmountStr] = useState("")

  const handleClick = useCallback((action: Action) => {
    if (action === "fold") { onAction(action, 0); return }
    if (action === "check") { onAction(action, 0); return }
    if (action === "call") { onAction(action, toCall); return }
    setPending(action)
    const defaultAmt = action === "bet" ? minRaise : currentBet + minRaise
    setAmountStr(String(defaultAmt))
  }, [onAction, toCall, currentBet, minRaise])

  const confirmAmount = useCallback(() => {
    if (pending) {
      onAction(pending, Number(amountStr) || 0)
      setPending(null); setAmountStr("")
    }
  }, [pending, amountStr, onAction])

  const actionConfig: { key: Action; label: string; color: string }[] = []

  if (legalActions.includes("fold"))
    actionConfig.push({ key: "fold", label: "弃牌", color: "bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30" })
  if (legalActions.includes("check"))
    actionConfig.push({ key: "check", label: "过牌", color: "bg-slate-500/20 text-slate-300 border-slate-400/30 hover:bg-slate-500/30" })
  if (legalActions.includes("call"))
    actionConfig.push({ key: "call", label: `跟注 ${toCall}`, color: "bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30" })
  if (legalActions.includes("bet"))
    actionConfig.push({ key: "bet", label: currentBet === 0 ? "下注" : "加注", color: "bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/30" })
  if (legalActions.includes("raise") && !legalActions.includes("bet"))
    actionConfig.push({ key: "raise", label: "加注", color: "bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/30" })
  if (legalActions.includes("all_in"))
    actionConfig.push({ key: "all_in", label: "全下", color: "bg-purple-500/20 text-purple-400 border-purple-500/30 hover:bg-purple-500/30" })

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {actionConfig.map((a) => (
          <button key={a.key} onClick={() => handleClick(a.key)}
            className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all duration-150 active:scale-95 ${a.color}`}>
            {a.label}
          </button>
        ))}
      </div>
      {pending && (pending === "bet" || pending === "raise" || pending === "all_in") && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {pending === "bet" && currentBet === 0 ? "下注金额" : pending === "all_in" ? "全下金额" : "加注到（总投入）"}:
            </span>
            <input type="number" value={amountStr} onChange={(e) => setAmountStr(e.target.value)}
              placeholder={String(minRaise)}
              className="w-24 bg-background/80 border border-border rounded-md px-2 py-1 text-sm font-mono"
              autoFocus onKeyDown={(e) => e.key === "Enter" && confirmAmount()} />
            <button onClick={confirmAmount}
              className="px-3 py-1 rounded-md text-sm font-medium bg-primary/20 text-primary border border-primary/40 hover:bg-primary/30">确认</button>
            <button onClick={() => { setPending(null); setAmountStr("") }}
              className="px-2 py-1 rounded-md text-sm text-muted-foreground hover:bg-muted/30">取消</button>
          </div>
          {currentBet > 0 && Number(amountStr) > currentBet && (
            <div className="text-xs text-muted-foreground pl-1 space-y-0.5">
              <div>跟注 <span className="text-blue-400 font-mono">{toCall}</span> + 加注 <span className="text-amber-400 font-mono">{Math.max(0, Number(amountStr) - currentBet)}</span> = 总投入 <span className="text-foreground font-mono font-semibold">{amountStr}</span></div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function ActionHistoryRow({ action, heroPosition, isBlind, onRemove }: {
  action: GameAction; heroPosition: Position; isBlind?: boolean; onRemove?: () => void;
}) {
  return (
    <div className="flex items-center gap-2 px-2 py-1 rounded bg-muted/10 group">
      <span className={`text-xs font-mono font-semibold min-w-[40px] ${action.position === heroPosition ? "text-primary" : "text-muted-foreground"}`}>
        {action.position === heroPosition && "★"}{action.position}
      </span>
      <span className={`text-xs font-medium px-1.5 py-0.5 rounded border ${ACTION_COLORS[action.action]}`}>
        {isBlind ? (action.position === "SB" ? "小盲" : "大盲") : ACTION_LABELS[action.action]}
      </span>
      {action.amount > 0 && (
        <span className="text-xs font-mono text-amber-400">
          {action.action === "call" ? `到${action.amount.toLocaleString()}` : action.amount.toLocaleString()}
        </span>
      )}
      {action.betLevel && action.betLevel > 0 && (
        <span className="text-[10px] font-mono text-orange-300/80">{getBetLevelLabel(action.betLevel)}</span>
      )}
      {onRemove && !isBlind && (
        <button onClick={onRemove} className="ml-auto text-xs text-muted-foreground/50 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
      )}
    </div>
  )
}

export function PositionCard({ position, isHero, isActive, isFolded, isAllIn, isAllInMatch, isNext, onClick }: {
  position: Position; isHero: boolean; isActive: boolean; isFolded: boolean; isAllIn: boolean; isAllInMatch: boolean; isNext: boolean; onClick?: () => void;
}) {
  let bg = "bg-muted/30"
  let border = "border-transparent"
  let text = "text-muted-foreground"
  if (isNext) { bg = "bg-primary/15"; border = "border-primary/40"; text = "text-primary" }
  else if (isHero && isActive) { bg = "bg-primary/10"; border = "border-primary/30"; text = "text-primary" }
  else if (isAllIn) { bg = "bg-purple-500/10"; border = "border-purple-500/30"; text = "text-purple-400" }
  else if (isFolded) { bg = "bg-red-500/10"; border = "border-red-500/20"; text = "text-red-400/60 line-through" }
  else if (!isActive) { bg = "bg-muted/15"; text = "text-muted-foreground/50" }

  return (
    <button disabled={!onClick} onClick={onClick}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-mono font-medium border transition-all active:scale-95 ${bg} ${border} ${text}`}
      title={isAllInMatch ? "已匹配当前下注，等待他人行动" : isAllIn ? "已全下" : isFolded ? "已弃牌" : ""}>
      {isHero && "★ "}{POSITION_LABEL[position]}
      {isFolded && <span className="text-[10px]">弃</span>}
      {isAllIn && <span className="text-[10px]">全下</span>}
      {isAllInMatch && <span className="text-[10px] text-emerald-400">✓</span>}
    </button>
  )
}

export function formatActionLine(action: GameAction, heroPosition: Position): React.ReactNode {
  return (
    <span className="inline-flex items-center gap-1 text-[11px]">
      {action.position === heroPosition && <span className="text-primary">★</span>}
      <span className={`font-mono ${action.position === heroPosition ? "text-primary" : "text-muted-foreground"}`}>{action.position}</span>
      <span className={`px-1 py-0.5 rounded text-[10px] border ${ACTION_COLORS[action.action]}`}>
        {ACTION_LABELS[action.action]}
      </span>
      {action.amount > 0 && (
        <span className="font-mono text-amber-400">{action.action === "call" ? `到${action.amount.toLocaleString()}` : action.amount.toLocaleString()}</span>
      )}
      {action.betLevel && action.betLevel > 0 && (
        <span className="text-[9px] font-mono text-orange-300/80">{getBetLevelLabel(action.betLevel)}</span>
      )}
    </span>
  )
}
