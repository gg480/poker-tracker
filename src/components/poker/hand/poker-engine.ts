"use client"

export const RANK_STR = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"] as const
export type RankStr = (typeof RANK_STR)[number]

export const RANK_INT: Record<RankStr, number> = {
  "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8,
  "9": 9, "T": 10, "J": 11, "Q": 12, "K": 13, "A": 14,
}

export const SUIT_CHAR = ["c", "d", "h", "s"] as const
export type SuitChar = (typeof SUIT_CHAR)[number]

export const SUIT_INT: Record<SuitChar, number> = { c: 0, d: 1, h: 2, s: 3 }

export const SUIT_SYMBOL: Record<SuitChar, string> = { c: "♣", d: "♦", h: "♥", s: "♠" }

export const SUIT_COLOR: Record<SuitChar, string> = {
  c: "text-slate-200", d: "text-red-400", h: "text-red-400", s: "text-slate-200",
}

export const POSITIONS = ["UTG", "UTG+1", "MP", "LJ", "HJ", "CO", "BTN", "SB", "BB"] as const
export type Position = (typeof POSITIONS)[number]

export const POSITION_LABEL: Record<Position, string> = {
  UTG: "UTG", "UTG+1": "UTG+1", MP: "MP", LJ: "LJ", HJ: "HJ",
  CO: "CO", BTN: "BTN", SB: "SB", BB: "BB",
}

export const POSITIONS_FOR_N: Record<number, Position[]> = {
  2: ["SB", "BB"],
  3: ["BTN", "SB", "BB"],
  4: ["CO", "BTN", "SB", "BB"],
  5: ["HJ", "CO", "BTN", "SB", "BB"],
  6: ["MP", "HJ", "CO", "BTN", "SB", "BB"],
  7: ["UTG", "MP", "HJ", "CO", "BTN", "SB", "BB"],
  8: ["UTG", "UTG+1", "MP", "HJ", "CO", "BTN", "SB", "BB"],
  9: ["UTG", "UTG+1", "MP", "LJ", "HJ", "CO", "BTN", "SB", "BB"],
}

export const ACTIONS = ["fold", "check", "call", "bet", "raise", "all_in"] as const
export type Action = (typeof ACTIONS)[number]

export const STREETS = ["preflop", "flop", "turn", "river"] as const
export type Street = (typeof STREETS)[number]

export const STREET_LABEL: Record<Street, string> = {
  preflop: "翻前", flop: "翻牌", turn: "转牌", river: "河牌",
}

export type Card = number

export function makeCard(rank: RankStr, suit: SuitChar): Card {
  return SUIT_INT[suit] * 13 + RANK_INT[rank] - 2
}

export function cardRank(card: Card): number { return (card % 13) + 2 }
export function cardSuit(card: Card): number { return Math.floor(card / 13) }
export function cardRankStr(card: Card): string { return RANK_STR[card % 13] }
export function cardSuitChar(card: Card): SuitChar { return SUIT_CHAR[Math.floor(card / 13)] }
export function cardSuitSymbol(card: Card): string { return SUIT_SYMBOL[cardSuitChar(card)] }
export function cardName(card: Card): string { return cardRankStr(card) + cardSuitChar(card) }

export function parseCardCode(code: string): Card | null {
  if (!code || code.length < 2) return null
  const suitChar = code.slice(-1).toLowerCase() as SuitChar
  const rankStr = code.slice(0, -1).toUpperCase()
  const realRank = rankStr === "10" ? "T" : rankStr
  if (!SUIT_CHAR.includes(suitChar)) return null
  if (!(realRank in RANK_INT)) return null
  return makeCard(realRank as RankStr, suitChar)
}

export function encodeCardCode(rankIdx: number, suitIdx: number): string {
  return RANK_STR[rankIdx] + SUIT_CHAR[suitIdx]
}

export function getAllCards(): Card[] {
  const cards: Card[] = []
  for (let s = 0; s < 4; s++) {
    for (let r = 0; r < 13; r++) {
      cards.push(s * 13 + r)
    }
  }
  return cards
}

export interface PlayerState {
  position: Position
  isActive: boolean
  hasFolded: boolean
  isAllIn: boolean
  streetBetAmount: number
  totalChipsCommitted: number
}

export interface GameAction {
  position: Position
  action: Action
  amount: number
  street: Street
  betLevel?: number
}

export interface StreetHistory {
  actions: GameAction[]
}

export class PokerEngine {
  positions: Position[]
  heroPosition: Position
  blinds: { sb: number; bb: number }
  street: Street
  currentBet: number
  minRaise: number
  haveBets: boolean
  allPlayersHadTurn: boolean
  players: Map<Position, PlayerState>
  history: StreetHistory[]
  actionLog: GameAction[]
  actedSinceLastRaise: Set<Position>
  lastAggressor: Position | null

  constructor(numPlayers: number, heroPosition: Position, blinds: { sb: number; bb: number }) {
    this.positions = POSITIONS_FOR_N[numPlayers] || POSITIONS_FOR_N[6]
    this.heroPosition = heroPosition
    this.blinds = blinds
    this.street = "preflop"
    this.currentBet = 0
    this.minRaise = blinds.bb
    this.haveBets = false
    this.allPlayersHadTurn = false
    this.players = new Map()
    this.history = [{ actions: [] }, { actions: [] }, { actions: [] }, { actions: [] }]
    this.actionLog = []
    this.actedSinceLastRaise = new Set()
    this.lastAggressor = null

    for (const pos of this.positions) {
      this.players.set(pos, {
        position: pos,
        isActive: true,
        hasFolded: false,
        isAllIn: false,
        streetBetAmount: 0,
        totalChipsCommitted: 0,
      })
    }

    const sbPlayer = this.players.get("SB")
    const bbPlayer = this.players.get("BB")
    if (sbPlayer) {
      sbPlayer.streetBetAmount = blinds.sb
      sbPlayer.totalChipsCommitted = blinds.sb
    }
    if (bbPlayer) {
      bbPlayer.streetBetAmount = blinds.bb
      bbPlayer.totalChipsCommitted = blinds.bb
    }
    this.currentBet = blinds.bb
    this.haveBets = true
    this.minRaise = blinds.bb
  }

  get activePlayers(): Position[] {
    return this.positions.filter((p) => {
      const pl = this.players.get(p)
      return pl && pl.isActive && !pl.hasFolded && !pl.isAllIn
    })
  }

  get notEnough(): boolean {
    return this.activePlayers.length <= 1
  }

  get streetIndex(): number { return STREETS.indexOf(this.street) }

  getRoundPlayers(): Position[] {
    if (this.notEnough) return []

    const needToAct = this.positions.filter((p) => {
      const pl = this.players.get(p)
      return pl && pl.isActive && !pl.hasFolded && !pl.isAllIn && !this.actedSinceLastRaise.has(p)
    })

    if (needToAct.length === 0) return []

    let anchorIdx: number
    if (this.lastAggressor) {
      anchorIdx = this.positions.indexOf(this.lastAggressor)
    } else if (this.street === "preflop") {
      anchorIdx = this.positions.indexOf("BB")
    } else {
      const dealerPos: Position = this.positions.length === 2 ? "SB" : "BTN"
      anchorIdx = this.positions.indexOf(dealerPos)
    }

    const clockwise = [
      ...this.positions.slice(anchorIdx + 1),
      ...this.positions.slice(0, anchorIdx + 1),
    ]
    return clockwise.filter((p) => needToAct.includes(p))
  }

  toCall(player: Position): number {
    const pl = this.players.get(player)
    if (!pl) return 0
    return Math.max(0, this.currentBet - pl.streetBetAmount)
  }

  computeLegalActions(player: Position): Action[] {
    const pl = this.players.get(player)
    if (!pl || !pl.isActive || pl.hasFolded || pl.isAllIn) return []
    const toCall = this.toCall(player)
    const actions: Action[] = ["fold"]
    if (toCall === 0) actions.push("check")
    else actions.push("call")
    if (!this.haveBets) actions.push("bet")
    else actions.push("raise")
    actions.push("all_in")
    return actions
  }

  isValidBetAmount(player: Position, action: Action, amount: number): boolean {
    if (action === "fold" || action === "check") return true
    if (action === "all_in") return amount > 0
    if (action === "call") {
      return amount === this.toCall(player)
    }
    if (action === "bet") {
      return amount >= this.blinds.bb
    }
    if (action === "raise") {
      return amount >= this.currentBet + this.minRaise
    }
    return false
  }

  applyAction(player: Position, action: Action, amount: number): GameAction | null {
    if (!this.activePlayers.includes(player)) return null
    const legal = this.computeLegalActions(player)
    if (!legal.includes(action)) return null
    if (!this.isValidBetAmount(player, action, amount)) return null

    const pl = this.players.get(player)
    if (!pl) return null

    const gameAction: GameAction = {
      position: player,
      action,
      amount,
      street: this.street,
    }

    const stHistory = this.history[this.streetIndex]
    stHistory.actions.push(gameAction)
    this.actionLog.push(gameAction)

    switch (action) {
      case "fold":
        pl.hasFolded = true
        pl.isActive = false
        this.actedSinceLastRaise.add(player)
        break

      case "check":
        this.actedSinceLastRaise.add(player)
        break

      case "call": {
        const callAmt = this.toCall(player)
        pl.streetBetAmount = this.currentBet
        pl.totalChipsCommitted += callAmt
        gameAction.amount = callAmt
        this.actedSinceLastRaise.add(player)
        break
      }

      case "bet": {
        pl.streetBetAmount = amount
        pl.totalChipsCommitted += amount
        this.currentBet = amount
        this.haveBets = true
        this.minRaise = amount
        gameAction.betLevel = 1
        this.actedSinceLastRaise.clear()
        this.actedSinceLastRaise.add(player)
        this.lastAggressor = player
        break
      }

      case "raise": {
        const additionalChips = amount - pl.streetBetAmount
        const raiseAboveCurrent = amount - this.currentBet
        pl.streetBetAmount = amount
        pl.totalChipsCommitted += additionalChips
        this.minRaise = Math.max(this.minRaise, raiseAboveCurrent)
        this.currentBet = amount
        this.haveBets = true
        gameAction.betLevel = this.street === "preflop"
          ? (stHistory.actions.filter((a) => a.action === "raise").length + 1)
          : (stHistory.actions.filter((a) => a.action === "bet" || a.action === "raise").length)
        gameAction.amount = amount
        this.actedSinceLastRaise.clear()
        this.actedSinceLastRaise.add(player)
        this.lastAggressor = player
        break
      }

      case "all_in": {
        const previousStreetBet = pl.streetBetAmount
        pl.streetBetAmount = amount
        pl.totalChipsCommitted += Math.max(0, amount - previousStreetBet)
        pl.isAllIn = true
        if (pl.streetBetAmount > this.currentBet) {
          this.currentBet = pl.streetBetAmount
          this.haveBets = true
          this.actedSinceLastRaise.clear()
          this.lastAggressor = player
        }
        this.actedSinceLastRaise.add(player)
        break
      }
    }

    return gameAction
  }

  isRoundComplete(): boolean {
    if (this.notEnough) return true

    for (const pos of this.positions) {
      const pl = this.players.get(pos)
      if (!pl || pl.hasFolded || pl.isAllIn) continue
      if (!pl.isActive) continue
      if (!this.actedSinceLastRaise.has(pos)) return false
    }
    return true
  }

  advanceStreet(): Street | null {
    if (!this.isRoundComplete()) return null
    const idx = STREETS.indexOf(this.street)
    if (idx >= 3) return null
    const next = STREETS[idx + 1]
    this.street = next
    this.currentBet = 0
    this.haveBets = false
    this.allPlayersHadTurn = false
    this.actedSinceLastRaise.clear()
    this.lastAggressor = null
    for (const [, pl] of this.players) {
      pl.streetBetAmount = 0
      if (!pl.hasFolded) pl.isActive = true
    }
    return next
  }

  toJSON() {
    return {
      positions: this.positions,
      heroPosition: this.heroPosition,
      blinds: this.blinds,
      history: this.history.map((h) => h.actions),
      actionLog: this.actionLog,
    }
  }

  clone(): PokerEngine {
    const c = new PokerEngine(this.positions.length, this.heroPosition, { ...this.blinds })
    c.street = this.street
    c.currentBet = this.currentBet
    c.minRaise = this.minRaise
    c.haveBets = this.haveBets
    c.allPlayersHadTurn = this.allPlayersHadTurn
    c.lastAggressor = this.lastAggressor
    c.actedSinceLastRaise = new Set(this.actedSinceLastRaise)
    c.history = this.history.map((h) => ({ actions: [...h.actions] }))
    c.actionLog = [...this.actionLog]
    c.players = new Map()
    for (const pos of this.positions) {
      const pl = this.players.get(pos)
      if (pl) c.players.set(pos, { ...pl })
    }
    return c
  }

  static fromJSON(data: ReturnType<PokerEngine["toJSON"]>): PokerEngine {
    const engine = new PokerEngine(
      data.positions.length,
      data.heroPosition as Position,
      data.blinds
    )
    engine.history = [{ actions: [] }, { actions: [] }, { actions: [] }, { actions: [] }]
    engine.actionLog = []
    for (const action of data.actionLog) {
      engine.applyAction(action.position as Position, action.action as Action, action.action === "call" || action.action === "check" || action.action === "fold" ? 0 : action.amount)
    }
    return engine
  }

  /**
   * Compute net P&L for each position given the winner set.
   *
   * STRATEGY: total pot is split equally among winners, and each
   * loser loses the full amount they committed.
   *
   * LIMITATION: True poker side pots are not modelled. In a multi-way
   * all-in where players have different stack sizes, the pot should be
   * divided into main + side pots, each awarded to the best hand still
   * eligible. Here the entire pot is split equally among all named
   * winners, which is only accurate when every winner contributed the
   * same amount (or when only one winner exists).
   *
   * For the hand-wizard use case this is acceptable because:
   *   - Users can override results manually via the "手动调整积分" field.
   *   - The wizard records individual hands, not tournament payouts.
   */
  computeResults(winnerPositions: Position[]): Map<Position, number> {
    const results = new Map<Position, number>()
    const totalPot = Array.from(this.players.values()).reduce((s, p) => s + p.totalChipsCommitted, 0)

    for (const pos of this.positions) {
      results.set(pos, 0)
    }

    if (winnerPositions.length === 0) {
      // Nobody wins — active (non-folded) players lose their committed chips.
      // Folded players already forfeited; their P&L is 0 (the pot goes to no one).
      for (const pos of this.positions) {
        const pl = this.players.get(pos)
        if (pl && !pl.hasFolded) {
          results.set(pos, -pl.totalChipsCommitted)
        }
      }
      return results
    }

    const share = Math.floor(totalPot / winnerPositions.length)
    let remainder = totalPot % winnerPositions.length
    let distributed = 0

    for (const pos of this.positions) {
      const pl = this.players.get(pos)
      if (!pl) continue
      if (winnerPositions.includes(pos)) {
        const extra = distributed < remainder ? 1 : 0
        results.set(pos, share + extra - pl.totalChipsCommitted)
        distributed++
      } else {
        results.set(pos, -pl.totalChipsCommitted)
      }
    }

    return results
  }

  getNonFoldedPositions(): Position[] {
    return this.positions.filter((p) => {
      const pl = this.players.get(p)
      return pl && !pl.hasFolded
    })
  }
}

export class HandEvaluator {
  static evaluate(cards: Card[]): number {
    if (cards.length < 5 || cards.length > 7) return 0
    const combos = this.getCombinations(cards, 5)
    let best = 0
    for (const combo of combos) {
      const score = this.score5(combo)
      if (score > best) best = score
    }
    return best
  }

  private static getCombinations(arr: Card[], k: number): Card[][] {
    if (k === 0) return [[]]
    if (arr.length === 0) return []
    const [first, ...rest] = arr
    const withFirst = this.getCombinations(rest, k - 1).map((c) => [first, ...c])
    const without = this.getCombinations(rest, k)
    return [...withFirst, ...without]
  }

  private static score5(cards: Card[]): number {
    const ranks = cards.map(cardRank).sort((a, b) => b - a)
    const suits = cards.map(cardSuit)
    const isFlush = new Set(suits).size === 1
    const isStraight = this.isStraight(ranks)
    const rankCounts = this.countRanks(ranks)

    if (isFlush && isStraight && ranks[0] === 14) return 9 * 7462 + 0
    if (isFlush && isStraight) return 8 * 7462 + ranks[0]
    if (rankCounts[0] === 4) return 7 * 7462 + rankCounts[1] * 13 + rankCounts[2]
    if (rankCounts[0] === 3 && rankCounts[1] === 2) return 6 * 7462 + rankCounts[2] * 13 + rankCounts[3]
    if (isFlush) return 5 * 7462 + ranks.reduce((a, b) => a * 15 + b, 0)
    if (isStraight) return 4 * 7462 + ranks[0]
    if (rankCounts[0] === 3) return 3 * 7462 + rankCounts[1] * 13 * 13 + rankCounts[2] * 13 + rankCounts[3]
    if (rankCounts[0] === 2 && rankCounts[1] === 2) {
      return 2 * 7462 + Math.max(rankCounts[2], rankCounts[3]) * 13 * 13 + Math.min(rankCounts[2], rankCounts[3]) * 13 + rankCounts[4]
    }
    if (rankCounts[0] === 2) {
      return 1 * 7462 + rankCounts[1] * 13 * 13 * 13 + rankCounts[2] * 13 * 13 + rankCounts[3] * 13 + rankCounts[4]
    }
    return ranks.reduce((a, b) => a * 15 + b, 0)
  }

  private static isStraight(ranks: number[]): boolean {
    if (ranks[0] === 14 && ranks[1] === 5 && ranks[2] === 4 && ranks[3] === 3 && ranks[4] === 2) return true
    for (let i = 0; i < 4; i++) {
      if (ranks[i] !== ranks[i + 1] + 1) return false
    }
    return true
  }

  private static countRanks(ranks: number[]): number[] {
    const count: Record<number, number> = {}
    for (const r of ranks) count[r] = (count[r] || 0) + 1
    const result: { rank: number; cnt: number }[] = []
    for (const [r, c] of Object.entries(count)) {
      result.push({ rank: Number(r), cnt: c })
    }
    result.sort((a, b) => b.cnt !== a.cnt ? b.cnt - a.cnt : b.rank - a.rank)
    return [result[0]?.cnt || 0, result[1]?.cnt || 0, result[0]?.rank || 0, result[1]?.rank || 0, result[2]?.rank || 0]
  }

  static getHandName(score: number): string {
    const cat = Math.floor(score / 7462)
    const names = ["高牌", "一对", "两对", "三条", "顺子", "同花", "葫芦", "四条", "同花顺", "皇家同花顺"]
    return names[cat] || "未知"
  }

  static calcEquity(heroCards: Card[], board: Card[], numOpponents: number, numSamples = 500): number {
    const deck = getAllCards().filter((c) => !heroCards.includes(c) && !board.includes(c))
    let wins = 0

    for (let i = 0; i < numSamples; i++) {
      const remaining = this.fisherYatesSample([...deck], 5 - board.length + numOpponents * 2)
      const fullBoard = [...board, ...remaining.slice(0, 5 - board.length)]
      const heroScore = this.evaluate([...heroCards, ...fullBoard])
      let heroWins = true
      for (let o = 0; o < numOpponents; o++) {
        const oppCards = remaining.slice(5 - board.length + o * 2, 5 - board.length + o * 2 + 2)
        const oppScore = this.evaluate([...oppCards, ...fullBoard])
        if (oppScore >= heroScore) { heroWins = false; break }
      }
      if (heroWins) wins++
    }
    return wins / numSamples
  }

  static calcOuts(heroCards: Card[], board: Card[]): number {
    if (board.length === 0 || board.length >= 5) return 0
    const deck = getAllCards().filter((c) => !heroCards.includes(c) && !board.includes(c))
    const currentScore = this.evaluate([...heroCards, ...board])
    let outs = 0
    for (const card of deck) {
      const newScore = this.evaluate([...heroCards, ...board, card])
      if (newScore > currentScore) outs++
    }
    return outs
  }

  static calcPotOdds(potSize: number, callAmount: number): number {
    if (callAmount === 0) return 0
    return callAmount / (potSize + callAmount)
  }

  static shouldCall(potSize: number, callAmount: number, equity: number): { potOdds: number; implied: number; recommendation: string } {
    const potOdds = this.calcPotOdds(potSize, callAmount)
    const recommendation = potOdds < equity
      ? "EV+，建议跟注"
      : potOdds < equity + 0.05
        ? "边缘，视情况跟注"
        : "EV-，建议弃牌"
    return { potOdds, implied: equity - potOdds, recommendation }
  }

  private static fisherYatesSample(arr: Card[], n: number): Card[] {
    for (let i = arr.length - 1; i >= 0 && n > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr.slice(0, n)
  }
}
