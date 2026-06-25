/**
 * Type declaration override for @idealic/poker-engine
 * Provides clean types for the engine without requiring source transpilation.
 * The engine is a source-only package; this file declares the subset we use.
 */

declare module "@idealic/poker-engine" {
  // Card types
  type Rank = "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "T" | "J" | "Q" | "K" | "A"
  type Suit = "c" | "d" | "h" | "s"
  type Card = `${Rank}${Suit}`
  type Street = "preflop" | "flop" | "turn" | "river"

  // Player
  interface Player {
    name: string
    seat: number
    stack: number
    bet: number
    cards: Card[]
    folded: boolean
    isAllIn: boolean
    isActive?: boolean
  }

  // Game
  interface Game {
    venue: string
    table: string
    hand: number
    gameTimestamp: number
    variant: string
    players: Player[]
    board: Card[]
    pot: number
    street: Street
    bet: number
    bigBlind: number
    minBet: number
    lastCompleteBet: number
    buttonIndex: number
    smallBlindIndex: number
    bigBlindIndex: number
    nextPlayerIndex: number
    isComplete: boolean
    isBettingComplete: boolean
    isShowdown: boolean
    isRunOut: boolean
    isAwaitingDealer?: boolean
    usedCards: number
    deck?: string[]
    stats: readonly any[]
    lastAction?: Action
    lastPlayerAction?: Action
    lastTimestamp?: number
    seed?: number
  }

  // Action
  interface Action {
    type: string
    playerIndex?: number
    amount?: number
    cards?: string[]
    street?: Street
    timestamp?: number
    isDealer?: boolean
  }

  // Pot
  interface Pot {
    amount: number
    eligiblePlayers: number[]
  }

  // Core functions
  export function applyAction(game: Game, action: Action): void
  export function advanceStreet(game: Game): void
  export function completeHand(game: Game): void
  export function compareHands(hand1: Card[], hand2: Card[]): number
  export function finalizeStacks(game: Game): void
  export function calculatePots(game: Game, includeCurrentRound?: boolean): Pot[]
  export function getNextCards(game: Game, count: number): Card[]
  export function getCurrentPlayerIndex(game: Game): number
  export function getNextEligiblePlayerIndex(game: Game): number
  export function getButtonIndex(players: number, blinds: number[]): number
  export function isPlayerTurn(game: Game, playerIndex: number): boolean
  export function canCheck(game: Game, position: number): boolean
  export function canCall(game: Game, position: number): boolean
  export function canBet(game: Game, position: number, amount?: number): boolean
  export function canRaise(game: Game, position: number, amount?: number): boolean
  export function canFold(game: Game, position: number): boolean

  // Action creators
  export function fold(game: Game, playerIndex: number): Action | null
  export function check(game: Game, playerIndex: number): Action | null
  export function call(game: Game, playerIndex: number): Action | null
  export function bet(game: Game, playerIndex: number, amount: number): Action | null
  export function raise(game: Game, playerIndex: number, amount: number): Action | null

  // Seats
  export function createDefaultSeats(playerCount: number): number[]
}
