/**
 * Monte Carlo Equity Calculator
 *
 * Uses Monte Carlo simulation to estimate poker hand equity.
 * On the river (5 board cards), uses exact enumeration over all
 * possible opponent hands for precise equity.
 *
 * Performance target: 1000 iterations in < 100ms for 2 players.
 */

import { normalizeCard, getHandName, compareHandsNormalized } from "./hand-evaluator"
import type { EquityResult } from "./types"

const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"]
const SUITS = ["s", "h", "d", "c"]

/** Create a standard 52-card deck excluding specified cards */
function createDeck(exclude: string[]): string[] {
  const excluded = new Set(exclude.map(normalizeCard))
  const deck: string[] = []
  for (const rank of RANKS) {
    for (const suit of SUITS) {
      const card = rank + suit
      if (!excluded.has(card)) deck.push(card)
    }
  }
  return deck
}

/**
 * Draw `count` random cards from the deck without copying the deck.
 * Uses rejection sampling on random indices.
 * For small counts relative to deck size, this is very fast.
 */
function drawRandomCards(deck: string[], count: number): string[] {
  const drawn: string[] = []
  const used = new Set<number>()
  while (drawn.length < count) {
    const idx = Math.floor(Math.random() * deck.length)
    if (!used.has(idx)) {
      used.add(idx)
      drawn.push(deck[idx])
    }
  }
  return drawn
}

/**
 * Exact equity calculation on the river (5 board cards).
 * Enumerates all C(45,2) = 990 possible opponent hand combinations.
 */
function exactRiverEquity(
  heroCards: string[],
  boardCards: string[],
  opponentRange?: string[]
): EquityResult {
  const hero = heroCards.map(normalizeCard)
  const board = boardCards.map(normalizeCard)
  const heroFull = [...hero, ...board]
  const deck = createDeck([...hero, ...board])

  let wins = 0
  let ties = 0
  let total = 0

  for (let i = 0; i < deck.length - 1; i++) {
    for (let j = i + 1; j < deck.length; j++) {
      const oppHole = [deck[i], deck[j]]

      // Filter by opponent range if provided
      if (opponentRange && opponentRange.length > 0) {
        const name = getHandName(oppHole)
        if (!opponentRange.includes(name)) continue
      }

      const cmp = compareHandsNormalized(heroFull, [...oppHole, ...board])
      if (cmp > 0) wins++
      else if (cmp === 0) ties++
      total++
    }
  }

  if (total === 0) {
    return { win: 0, tie: 0, equity: 0 }
  }

  return {
    win: wins / total,
    tie: ties / total,
    equity: (wins + ties * 0.5) / total,
  }
}

/**
 * Filter a deck to only contain hands matching the given range.
 * Returns the list of valid 2-card opponent hand combos.
 */
function filterHandsByRange(deck: string[], range: string[]): string[][] {
  const valid: string[][] = []
  for (let i = 0; i < deck.length - 1; i++) {
    for (let j = i + 1; j < deck.length; j++) {
      const hand = [deck[i], deck[j]]
      if (range.includes(getHandName(hand))) {
        valid.push(hand)
      }
    }
  }
  return valid
}

/**
 * Calculate equity via Monte Carlo simulation.
 *
 * @param heroCards - Hero's two hole cards, e.g. ["Ah", "Kd"]
 * @param boardCards - Known community cards (0-5 cards)
 * @param opponentRange - Optional list of hand names to restrict opponent range
 * @param iterations - Number of Monte Carlo iterations (default 1000, max 10000)
 * @returns EquityResult with win%, tie%, and equity (win + tie/2)
 */
export function monteCarloEquity(
  heroCards: string[],
  boardCards: string[],
  opponentRange?: string[],
  iterations: number = 1000
): EquityResult {
  try {
    const hero = heroCards.map(normalizeCard)
    const board = boardCards.map(normalizeCard)

    // Guard: need exactly 2 hole cards
    if (hero.length !== 2) {
      return { win: 0, tie: 0, equity: 0 }
    }

    // Guard: board cannot have more than 5 cards
    if (board.length > 5) {
      return { win: 0, tie: 0, equity: 0 }
    }

    // On the river, use exact enumeration (no Monte Carlo needed)
    if (board.length === 5) {
      return exactRiverEquity(hero, board, opponentRange)
    }

    const remainingBoard = 5 - board.length
    const deck = createDeck([...hero, ...board])
    const n = Math.min(iterations, 10000)

    let wins = 0
    let ties = 0

    if (opponentRange && opponentRange.length > 0) {
      // Precompute all valid opponent hands matching the range
      const validOppHands = filterHandsByRange(deck, opponentRange)

      if (validOppHands.length === 0) {
        return { win: 0, tie: 0, equity: 0 }
      }

      for (let iter = 0; iter < n; iter++) {
        // Pick a random opponent hand from the valid set
        const oppIdx = Math.floor(Math.random() * validOppHands.length)
        const oppHole = validOppHands[oppIdx]

        // Ensure board cards don't overlap with opponent's hole cards
        const oppSet = new Set(oppHole.map(normalizeCard))
        const remainingDeck = deck.filter((c) => !oppSet.has(c))

        // Deal remaining board cards
        const newBoard = drawRandomCards(remainingDeck, remainingBoard)

        const cmp = compareHandsNormalized(
          [...hero, ...board, ...newBoard],
          [...oppHole, ...board, ...newBoard]
        )
        if (cmp > 0) wins++
        else if (cmp === 0) ties++
      }
    } else {
      // No range: deal random opponent hands and board cards together
      for (let iter = 0; iter < n; iter++) {
        const drawn = drawRandomCards(deck, remainingBoard + 2)
        const newBoard = drawn.slice(0, remainingBoard)
        const oppHole = drawn.slice(remainingBoard)

        const cmp = compareHandsNormalized(
          [...hero, ...board, ...newBoard],
          [...oppHole, ...board, ...newBoard]
        )
        if (cmp > 0) wins++
        else if (cmp === 0) ties++
      }
    }

    const winPct = wins / n
    const tiePct = ties / n

    return {
      win: winPct,
      tie: tiePct,
      equity: winPct + tiePct * 0.5,
    }
  } catch {
    return { win: 0, tie: 0, equity: 0 }
  }
}

/**
 * Track how equity changed across streets for the same hole cards.
 *
 * @param heroCards - Hero's hole cards (same across all streets)
 * @param decisions - Array of street snapshots with board state
 * @returns Array of {street, equity} at each point
 *
 * Example:
 *   trackEquityAcrossStreets(["As", "Ks"], [
 *     { street: "preflop", boardCards: [] },
 *     { street: "flop", boardCards: ["2h", "7c", "Jd"] },
 *     { street: "turn", boardCards: ["2h", "7c", "Jd", "Qs"] },
 *     { street: "river", boardCards: ["2h", "7c", "Jd", "Qs", "3c"] },
 *   ])
 */
export function trackEquityAcrossStreets(
  heroCards: string[],
  decisions: { street: string; boardCards: string[] }[]
): { street: string; equity: number }[] {
  try {
    return decisions.map((d) => {
      const result = monteCarloEquity(heroCards, d.boardCards)
      return {
        street: d.street,
        equity: Math.round(result.equity * 100) / 100,
      }
    })
  } catch {
    return decisions.map((d) => ({ street: d.street, equity: 0 }))
  }
}
