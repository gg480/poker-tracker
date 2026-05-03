"use client"

import { useState, useCallback, useMemo } from "react"
import {
  PokerEngine, HandEvaluator,
  STREETS, STREET_LABEL,
  makeCard, parseCardCode,
  type Card, type Position, type Action, type Street, type GameAction,
} from "./poker-engine"
import {
  CardSelector, CardDisplay, ActionSelector, ActionHistoryRow, PositionCard, formatActionLine,
  POSITIONS_FOR_N, getBetLevelLabel,
} from "./card-selector"
import {
  getGTORecommendation, ACTION_LABEL, ACTION_COLOR,
  type PlayerStyle, type GTORecommendation as GTORec,
  PLAYER_STYLE_LABEL, PLAYER_STYLE_DESC,
} from "./gto-engine"

interface HandWizardProps {
  onSave: (data: HandWizardData) => void
  onCancel: () => void
  players?: string[]
  activeSeasonId?: string
}

export interface HandWizardData {
  date: string
  heroCards: Card[]
  heroPosition: Position
  numPlayers: number
  blinds: { sb: number; bb: number }
  history: GameAction[][]
  flopCards: Card[]
  turnCard: Card | null
  riverCard: Card | null
  result: number
  winner: Position[]
  notes: string
  tags: string
  sessionId?: string
}

const STEP_ORDER: Record<Street, number> = { preflop: 0, flop: 1, turn: 2, river: 3 }

export function HandWizard({ onSave, onCancel, players, activeSeasonId }: HandWizardProps) {
  const [engine, setEngine] = useState<PokerEngine | null>(null)
  const [heroCards, setHeroCards] = useState<Card[]>([])
  const [heroPosition, setHeroPosition] = useState<Position>("CO")
  const [numPlayers, setNumPlayers] = useState(6)
  const [blinds, setBlinds] = useState({ sb: 50, bb: 100 })
  const [flopCards, setFlopCards] = useState<Card[]>([])
  const [turnCard, setTurnCard] = useState<Card | null>(null)
  const [riverCard, setRiverCard] = useState<Card | null>(null)
  const [result, setResult] = useState("")
  const [notes, setNotes] = useState("")
  const [tags, setTags] = useState("")
  const [addingFor, setAddingFor] = useState<Position | null>(null)
  const [analysis, setAnalysis] = useState<{ equity: number; outs: number; handName: string } | null>(null)
  const [winners, setWinners] = useState<Position[]>([])
  const [showSavePanel, setShowSavePanel] = useState(false)
  const [playerStyle, setPlayerStyle] = useState<PlayerStyle>("standard")
  const [facingAction, setFacingAction] = useState<"open" | "raise" | "3bet" | undefined>(undefined)

  const gtoRec: GTORec | null = useMemo(() => {
    if (heroCards.length !== 2) return null
    return getGTORecommendation(
      [heroCards[0], heroCards[1]],
      heroPosition,
      numPlayers,
      playerStyle,
      facingAction,
    )
  }, [heroCards, heroPosition, numPlayers, playerStyle, facingAction])

  const tablePositions = useMemo(() => POSITIONS_FOR_N[numPlayers] || POSITIONS_FOR_N[6], [numPlayers])

  const usedCards = useMemo(() => {
    const cards = [...heroCards, ...flopCards]
    if (turnCard) cards.push(turnCard)
    if (riverCard) cards.push(riverCard)
    return cards
  }, [heroCards, flopCards, turnCard, riverCard])

  const startRound = useCallback(() => {
    const eng = new PokerEngine(numPlayers, heroPosition, blinds)
    setEngine(eng)
    setAddingFor(null)

    const heroCs = [...heroCards]
    const board = [...flopCards]
    if (turnCard) board.push(turnCard)
    if (riverCard) board.push(riverCard)
    if (heroCs.length === 2) {
      const equity = HandEvaluator.calcEquity(heroCs, board, eng.activePlayers.length - 1, 300)
      const outs = HandEvaluator.calcOuts(heroCs, board)
      const score = HandEvaluator.evaluate([...heroCs, ...board])
      setAnalysis({
        equity: Math.round(equity * 100),
        outs,
        handName: HandEvaluator.getHandName(score),
      })
    }
  }, [numPlayers, heroPosition, blinds, heroCards, flopCards, turnCard, riverCard])

  const handleAction = useCallback((position: Position, action: Action, amount: number) => {
    if (!engine) return
    const result = engine.applyAction(position, action, amount)
    if (result) {
      setEngine(engine.clone())
      setAddingFor(null)
    }
  }, [engine])

  const handleAdvanceStreet = useCallback(() => {
    if (!engine) return
    engine.advanceStreet()
    setEngine(engine.clone())
    setAddingFor(null)
  }, [engine])

  const handleNumPlayersChange = useCallback((n: number) => {
    setNumPlayers(n)
    const newPos = POSITIONS_FOR_N[n]
    if (!newPos.includes(heroPosition)) {
      setHeroPosition(newPos[Math.min(3, newPos.length - 1)])
    }
    setEngine(null)
  }, [heroPosition])

  const handleHeroCardSelect = useCallback((card: Card) => {
    setHeroCards((prev) => prev.includes(card) ? prev.filter((c) => c !== card) : prev.length >= 2 ? prev : [...prev, card])
  }, [])

  const handleFlopCardSelect = useCallback((card: Card) => {
    setFlopCards((prev) => prev.includes(card) ? prev.filter((c) => c !== card) : prev.length >= 3 ? prev : [...prev, card])
  }, [])

  const handleTurnCardSelect = useCallback((card: Card) => {
    if (usedCards.includes(card) && card !== turnCard) return
    setTurnCard(turnCard === card ? null : card)
  }, [turnCard, usedCards])

  const handleRiverCardSelect = useCallback((card: Card) => {
    if (usedCards.includes(card) && card !== riverCard) return
    setRiverCard(riverCard === card ? null : card)
  }, [riverCard, usedCards])

  const totalPot = useMemo(() => {
    if (!engine) return blinds.sb + blinds.bb
    let pot = 0
    for (const [, p] of engine.players) {
      pot += p.totalChipsCommitted
    }
    return pot
  }, [engine, blinds])

  const autoResult = useMemo(() => {
    if (!engine || winners.length === 0) return null
    const results = engine.computeResults(winners)
    const heroResult = results.get(heroPosition)
    return heroResult ?? null
  }, [engine, winners, heroPosition])

  const currentStep: Street = engine?.street || "preflop"
  const stepIndex = STEP_ORDER[currentStep]

  const isComplete = engine ? engine.isRoundComplete() : false

  const canFinish = useMemo(() => {
    if (!engine) return false
    if (engine.notEnough) return true
    if (isComplete && engine.street === "river") return true
    if (isComplete && showSavePanel) return true
    return false
  }, [engine, isComplete, showSavePanel])

  const handleSave = useCallback(() => {
    const heroResult = autoResult ?? (result ? Number(result) : 0)
    onSave({
      date: new Date().toISOString().slice(0, 10),
      heroCards, heroPosition, numPlayers, blinds,
      history: engine ? engine.history.map((h) => h.actions) : [[], [], [], []],
      flopCards, turnCard, riverCard,
      result: heroResult,
      winner: winners,
      notes, tags,
    })
  }, [heroCards, heroPosition, numPlayers, blinds, engine, flopCards, turnCard, riverCard, result, notes, tags, autoResult, winners])

  const canStart = heroCards.length === 2

  const renderBoard = () => (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium">公共牌:</span>
      {flopCards.map((c) => <CardDisplay key={c} card={c} size="sm" />)}
      {turnCard && <CardDisplay card={turnCard} size="sm" />}
      {riverCard && <CardDisplay card={riverCard} size="sm" />}
      {(flopCards.length === 0 && !engine) && <span className="text-xs text-muted-foreground">待翻牌</span>}
    </div>
  )

  if (!engine) {
    return (
      <div className="space-y-5">
        <div>
          <div className="text-sm font-medium mb-2">1. 选择手牌（2张）</div>
          <CardSelector selectedCards={heroCards} onCardSelect={handleHeroCardSelect} maxCards={2} />
        </div>
        <div>
          <div className="text-sm font-medium mb-2">2. 位置</div>
          <div className="flex flex-wrap gap-1.5">
            {tablePositions.map((pos) => (
              <button key={pos} onClick={() => setHeroPosition(pos)}
                className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-all ${heroPosition === pos ? "bg-primary/20 text-primary border border-primary/40" : "bg-muted/30 text-muted-foreground border border-transparent hover:bg-muted/50"}`}>
                ★ {pos}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="text-sm font-medium mb-2">3. 人数 & 盲注</div>
          <div className="flex items-center gap-3">
            {[2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <button key={n} onClick={() => handleNumPlayersChange(n)}
                className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${numPlayers === n ? "bg-primary/20 text-primary border border-primary/40" : "bg-muted/30 text-muted-foreground border border-transparent hover:bg-muted/50"}`}>{n}</button>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-muted-foreground">SB</span>
            <input type="number" value={blinds.sb} onChange={(e) => setBlinds((b) => ({ ...b, sb: Number(e.target.value) || 0 }))}
              className="w-16 bg-background/80 border border-border rounded-md px-2 py-1 text-sm font-mono" />
            <span className="text-muted-foreground">/</span>
            <span className="text-xs text-muted-foreground">BB(底分)</span>
            <input type="number" value={blinds.bb} onChange={(e) => setBlinds((b) => ({ ...b, bb: Number(e.target.value) || 0 }))}
              className="w-16 bg-background/80 border border-border rounded-md px-2 py-1 text-sm font-mono" />
          </div>
          <div className="mt-1 text-xs text-muted-foreground">位置: {tablePositions.join(" → ")}，底分 = BB = {blinds.bb}</div>
        </div>
        <div>
          <div className="text-sm font-medium mb-2">4. 公共牌（可选）</div>
          <div className="space-y-2">
            <div>
              <span className="text-xs text-muted-foreground">翻牌Flop (3张)</span>
              <CardSelector selectedCards={flopCards} onCardSelect={handleFlopCardSelect} maxCards={3} disabledCards={heroCards} />
            </div>
            <div>
              <span className="text-xs text-muted-foreground">转牌Turn (1张)</span>
              <CardSelector selectedCards={turnCard ? [turnCard] : []} onCardSelect={handleTurnCardSelect} maxCards={1} disabledCards={[...heroCards, ...flopCards]} />
            </div>
            <div>
              <span className="text-xs text-muted-foreground">河牌River (1张)</span>
              <CardSelector selectedCards={riverCard ? [riverCard] : []} onCardSelect={handleRiverCardSelect} maxCards={1} disabledCards={[...heroCards, ...flopCards, ...(turnCard ? [turnCard] : [])]} />
            </div>
          </div>
        </div>
        {gtoRec && (
          <div className="p-3 rounded-lg border border-primary/30 bg-primary/5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-primary">📊 翻前GTO建议</div>
              <div className="flex items-center gap-1.5">
                {(["standard", "tight-strong", "tight-weak", "loose-strong", "loose-weak"] as PlayerStyle[]).map((s) => (
                  <button key={s} onClick={() => setPlayerStyle(s)}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${playerStyle === s
                      ? "bg-primary/20 text-primary border border-primary/40"
                      : "bg-muted/30 text-muted-foreground border border-transparent hover:bg-muted/50"}`}
                    title={PLAYER_STYLE_DESC[s]}>
                    {PLAYER_STYLE_LABEL[s]}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span>牌力: <span className="font-mono font-bold text-primary">{gtoRec.handScore}</span>/100</span>
              <span>排名: <span className="font-mono font-bold text-amber-400">{gtoRec.percentileLabel}</span></span>
              <span>{gtoRec.positionRangeLabel}</span>
              <span className={`font-semibold ${gtoRec.inRange ? "text-emerald-400" : "text-red-400"}`}>
                {gtoRec.inRange ? "✓ 在范围内" : "✗ 超出范围"}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">面对:</span>
              {([undefined, "open", "raise", "3bet"] as const).map((fa) => (
                <button key={fa ?? "first"} onClick={() => setFacingAction(fa)}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${facingAction === fa
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                    : "bg-muted/30 text-muted-foreground border border-transparent hover:bg-muted/50"}`}>
                  {fa === undefined ? "先行动" : fa === "open" ? "面对Open" : fa === "raise" ? "面对Raise" : "面对3-bet"}
                </button>
              ))}
            </div>

            <div className="space-y-1.5">
              {gtoRec.actions.map((a, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={`w-16 text-xs font-medium text-right ${ACTION_COLOR[a.action]}`}>
                    {ACTION_LABEL[a.action]}
                  </div>
                  <div className="flex-1 h-4 bg-muted/20 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${a.action === "fold" ? "bg-red-500/40" : a.action === "call" ? "bg-blue-500/40" : a.action === "3bet" || a.action === "4bet" ? "bg-amber-500/40" : "bg-emerald-500/40"}`}
                      style={{ width: `${a.probability}%` }}
                    />
                  </div>
                  <span className={`w-10 text-xs font-mono font-bold text-right ${ACTION_COLOR[a.action]}`}>
                    {a.probability}%
                  </span>
                  {a.sizing && (
                    <span className="text-[10px] text-muted-foreground font-mono w-20 text-right">
                      {a.sizing.min === a.sizing.max
                        ? `${a.sizing.min}bb`
                        : `${a.sizing.min}-${a.sizing.max}bb`}
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="text-[11px] text-muted-foreground leading-relaxed">
              {gtoRec.notes}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 pt-4 border-t border-border/50">
          <button onClick={startRound} disabled={!canStart}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
            ▶ 开始记录下注轮次
          </button>
          <button onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all">取消</button>
          {!canStart && <span className="text-xs text-muted-foreground">请先选择2张手牌</span>}
        </div>
      </div>
    )
  }

  const roundPlayers = engine.getRoundPlayers()

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {(engine.street === "preflop" || engine.history[0].actions.length > 0) && (
          <button onClick={() => {}}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border ${engine.street === "preflop" ? "bg-primary/20 text-primary border-primary/40" : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"}`}>
            翻前 {engine.street !== "preflop" && "✓"}
          </button>
        )}
        {engine.history[0].actions.length > 0 && (
          <button onClick={() => {}}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border ${engine.street === "flop" ? "bg-primary/20 text-primary border-primary/40" : engine.street === "turn" || engine.street === "river" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : "bg-muted/20 text-muted-foreground border-border/30"}`}>
            翻牌 {(engine.street === "turn" || engine.street === "river") && "✓"}
          </button>
        )}
        {engine.history[1].actions.length > 0 && (
          <button onClick={() => {}}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border ${engine.street === "turn" ? "bg-primary/20 text-primary border-primary/40" : engine.street === "river" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : "bg-muted/20 text-muted-foreground border-border/30"}`}>
            转牌 {engine.street === "river" && "✓"}
          </button>
        )}
        {engine.history[2].actions.length > 0 && (
          <button onClick={() => {}}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border ${engine.street === "river" ? "bg-primary/20 text-primary border-primary/40" : "bg-muted/20 text-muted-foreground border-border/30"}`}>
            河牌
          </button>
        )}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">
          {STREET_LABEL[engine.street]}
          {engine.haveBets && engine.streetIndex === 0 && (
            <span className="ml-2 text-xs text-amber-400 font-mono">
              ({getBetLevelLabel(engine.history[0].actions.filter((a) => a.action === "raise" || a.action === "bet").length + (engine.history[0].actions.some((a) => a.position === "BB" && a.action === "bet") ? 1 : 0))})
            </span>
          )}
        </span>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-muted-foreground">当前注: <span className="font-mono text-amber-400 font-semibold">{engine.currentBet.toLocaleString()}</span></span>
          <span>底池: <span className="font-mono text-amber-400 font-semibold">{totalPot.toLocaleString()}</span></span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">手牌:</span>
        {heroCards.map((c) => <CardDisplay key={c} card={c} size="sm" />)}
        <span className="text-xs text-muted-foreground font-mono">★{heroPosition}</span>
      </div>

      {renderBoard()}

      <div className="flex flex-wrap gap-1.5">
        {engine.positions.map((pos) => {
          const pl = engine.players.get(pos)
          if (!pl) return null
          const nextInRound = !isComplete && roundPlayers[0] === pos
          const isAllInMatch = pl.isAllIn && pl.streetBetAmount === engine.currentBet
          return (
            <PositionCard key={pos}
              position={pos}
              isHero={pos === heroPosition}
              isActive={pl.isActive && !pl.hasFolded}
              isFolded={pl.hasFolded}
              isAllIn={pl.isAllIn}
              isAllInMatch={isAllInMatch}
              isNext={nextInRound}
              onClick={addingFor ? undefined : () => roundPlayers.includes(pos) ? setAddingFor(pos) : undefined}
            />
          )
        })}
      </div>

      <div className="space-y-1">
        {engine.history[engine.streetIndex].actions.map((act, i) => {
          const isBlind = engine.streetIndex === 0 && i <= 1 && (act.action === "bet" || act.position === "SB" || act.position === "BB")
          return (
            <ActionHistoryRow key={`${act.position}-${act.action}-${i}`}
              action={act} heroPosition={heroPosition} isBlind={isBlind}
              onRemove={isBlind ? undefined : () => {
                engine.history[engine.streetIndex].actions.splice(i, 1)
                setEngine(engine.clone())
              }}
            />
          )
        })}
      </div>

      {analysis && (
        <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-muted/10 border border-border/20">
          <div className="text-center">
            <div className="text-[10px] text-muted-foreground">牌力</div>
            <div className="text-sm font-bold text-primary">{analysis.handName}</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-muted-foreground">胜率</div>
            <div className="text-sm font-bold text-emerald-400">{analysis.equity}%</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-muted-foreground">Outs</div>
            <div className="text-sm font-bold text-amber-400">{analysis.outs}</div>
          </div>
        </div>
      )}

      {gtoRec && engine?.street === "preflop" && (
        <div className="p-2.5 rounded-lg border border-primary/20 bg-primary/5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-primary">📊 GTO翻前参考</span>
            <span className={`text-[10px] font-semibold ${gtoRec.inRange ? "text-emerald-400" : "text-red-400"}`}>
              {gtoRec.inRange ? "✓ 在范围" : "✗ 超范围"} · {gtoRec.percentileLabel}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {gtoRec.actions.map((a, i) => (
              <span key={i} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${ACTION_COLOR[a.action]} bg-muted/20`}>
                {ACTION_LABEL[a.action]} {a.probability}%
                {a.sizing && <span className="text-muted-foreground">({a.sizing.min}-{a.sizing.max}bb)</span>}
              </span>
            ))}
          </div>
        </div>
      )}

      {isComplete ? (
        <div className="space-y-2">
          <div className="text-xs text-emerald-400 text-center py-2 bg-emerald-500/10 rounded-md border border-emerald-500/20">
            ✓ {STREET_LABEL[engine.street]} 下注轮次结束
            {engine.street === "river" ? " → 可保存手牌" : " → 可翻开下一张公共牌或结束手牌"}
          </div>
          {engine.street !== "river" && !showSavePanel && (
            <div className="flex gap-2">
              <button onClick={handleAdvanceStreet}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30 transition-all">
                ▶ 翻开{STREET_LABEL[STREETS[engine.streetIndex + 1]] === "翻牌" ? "3张翻牌" : STREET_LABEL[STREETS[engine.streetIndex + 1]] + "牌"} → 进入下一轮
              </button>
              <button onClick={() => setShowSavePanel(true)}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-amber-500/20 text-amber-400 border border-amber-500/40 hover:bg-amber-500/30 transition-all">
                ⏹ 结束手牌
              </button>
            </div>
          )}
          {(engine.street === "river" || showSavePanel) && (
            <div className="border-t border-border/50 pt-3 space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">赢家（可多选，平分底池）</label>
                <div className="flex flex-wrap gap-1.5">
                  {engine.getNonFoldedPositions().map((pos) => (
                    <button key={pos} onClick={() => setWinners((prev) => prev.includes(pos) ? prev.filter((p) => p !== pos) : [...prev, pos])}
                      className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-all ${winners.includes(pos)
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 ring-1 ring-emerald-500/30"
                        : "bg-muted/30 text-muted-foreground border border-transparent hover:bg-muted/50"}`}>
                      {pos === heroPosition ? "★ " : ""}{pos}
                      {winners.includes(pos) && " ✓"}
                    </button>
                  ))}
                </div>
              </div>
              {winners.length > 0 && engine && (
                <div className="p-2.5 rounded-lg bg-muted/10 border border-border/20 space-y-1.5">
                  <div className="text-xs text-muted-foreground">
                    底池: <span className="font-mono text-amber-400 font-semibold">{totalPot.toLocaleString()}</span>
                    {" · "}赢家: <span className="font-mono text-emerald-400">{winners.join(", ")}</span>
                    {winners.length > 1 && <span className="text-muted-foreground">（平分）</span>}
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    {engine.positions.map((pos) => {
                      const pl = engine.players.get(pos)
                      if (!pl || pl.hasFolded) return null
                      const res = engine.computeResults(winners).get(pos) ?? 0
                      return (
                        <div key={pos} className={`text-xs px-2 py-1 rounded ${pos === heroPosition ? "bg-primary/10 text-primary" : "bg-muted/20 text-muted-foreground"}`}>
                          {pos === heroPosition ? "★ " : ""}{pos}: <span className={`font-mono font-semibold ${res > 0 ? "text-emerald-400" : res < 0 ? "text-red-400" : ""}`}>
                            {res > 0 ? "+" : ""}{res.toLocaleString()}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
              {autoResult !== null && (
                <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-primary/5 border border-primary/20">
                  <span className="text-sm font-medium">Hero结果:</span>
                  <span className={`text-lg font-bold font-mono ${autoResult > 0 ? "text-emerald-400" : autoResult < 0 ? "text-red-400" : "text-muted-foreground"}`}>
                    {autoResult > 0 ? "+" : ""}{autoResult.toLocaleString()}
                  </span>
                  <span className="text-xs text-muted-foreground">（自动汇算）</span>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1.5">手动调整积分（可选，覆盖自动汇算）</label>
                <input type="number" value={result} onChange={(e) => setResult(e.target.value)} placeholder={autoResult !== null ? String(autoResult) : "+/- 积分"}
                  className="w-full bg-background/80 border border-border rounded-md px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">复盘笔记</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="这手牌的复盘感想..."
                  className="w-full bg-background/80 border border-border rounded-md px-3 py-2 text-sm min-h-[60px] resize-y" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">标签</label>
                <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="如: 诈唬, 价值下注"
                  className="w-full bg-background/80 border border-border rounded-md px-3 py-2 text-sm" />
              </div>
            </div>
          )}
        </div>
      ) : engine.notEnough ? (
        <div className="space-y-2">
          <div className="text-xs text-amber-400 text-center py-2 bg-amber-500/10 rounded-md border border-amber-500/20">
            只剩一位玩家未弃牌 → 手牌结束
          </div>
          <div className="border-t border-border/50 pt-3 space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">赢家</label>
              <div className="flex flex-wrap gap-1.5">
                {engine.getNonFoldedPositions().map((pos) => (
                  <button key={pos} onClick={() => setWinners((prev) => prev.includes(pos) ? prev.filter((p) => p !== pos) : [...prev, pos])}
                    className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-all ${winners.includes(pos)
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 ring-1 ring-emerald-500/30"
                      : "bg-muted/30 text-muted-foreground border border-transparent hover:bg-muted/50"}`}>
                    {pos === heroPosition ? "★ " : ""}{pos}
                    {winners.includes(pos) && " ✓"}
                  </button>
                ))}
              </div>
            </div>
            {winners.length > 0 && autoResult !== null && (
              <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-primary/5 border border-primary/20">
                <span className="text-sm font-medium">Hero结果:</span>
                <span className={`text-lg font-bold font-mono ${autoResult > 0 ? "text-emerald-400" : autoResult < 0 ? "text-red-400" : "text-muted-foreground"}`}>
                  {autoResult > 0 ? "+" : ""}{autoResult.toLocaleString()}
                </span>
                <span className="text-xs text-muted-foreground">（自动汇算）</span>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1.5">手动调整积分（可选）</label>
              <input type="number" value={result} onChange={(e) => setResult(e.target.value)} placeholder={autoResult !== null ? String(autoResult) : "+/- 积分"}
                className="w-full bg-background/80 border border-border rounded-md px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">复盘笔记</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="这手牌的复盘感想..."
                className="w-full bg-background/80 border border-border rounded-md px-3 py-2 text-sm min-h-[60px] resize-y" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">标签</label>
              <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="如: 诈唬, 价值下注"
                className="w-full bg-background/80 border border-border rounded-md px-3 py-2 text-sm" />
            </div>
          </div>
        </div>
      ) : addingFor ? (
        <div className="p-3 rounded-lg border border-primary/30 bg-primary/5 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {addingFor === heroPosition ? "★ " : ""}{addingFor} 的行动
            </span>
            <span className="text-xs text-muted-foreground">
              {engine.toCall(addingFor) > 0 ? `需补 ${engine.toCall(addingFor).toLocaleString()}` : "可过牌"}
            </span>
            <button onClick={() => setAddingFor(null)} className="ml-auto text-xs text-muted-foreground hover:text-foreground">取消</button>
          </div>
          <ActionSelector
            legalActions={engine.computeLegalActions(addingFor)}
            toCall={engine.toCall(addingFor)}
            currentBet={engine.currentBet}
            minRaise={engine.minRaise}
            onAction={(action, amount) => handleAction(addingFor, action, amount)}
          />
        </div>
      ) : (
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">
            下一位: <span className="text-primary font-mono font-semibold">
              {roundPlayers[0] === heroPosition ? "★ " : ""}{roundPlayers[0]}
            </span>
            {engine.toCall(roundPlayers[0]) > 0 && <span className="ml-1">（需补 {engine.toCall(roundPlayers[0]).toLocaleString()}）</span>}
          </div>
          <button onClick={() => setAddingFor(roundPlayers[0])}
            className="px-3 py-1.5 rounded-md text-xs font-mono font-medium bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 active:scale-95 transition-all">
            {roundPlayers[0] === heroPosition ? "★ " : ""}{roundPlayers[0]} 行动
          </button>
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-border/50">
        <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all">取消</button>
        {canFinish && winners.length > 0 && (
          <button onClick={handleSave}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30 transition-all">
            💾 保存手牌
          </button>
        )}
      </div>
    </div>
  )
}
