/**
 * Hand Evaluator — 5-card poker hand evaluation
 *
 * Evaluates the best 5-card hand from any set of cards (2-7).
 * Supports all 10 standard hand categories with kicker comparison.
 *
 * Card format: 2-character strings, e.g. "As" = Ace of spades,
 * "Td" = Ten of diamonds, "2c" = Two of clubs, "Kh" = King of hearts.
 *
 * Ranks: 2,3,4,5,6,7,8,9,T,J,Q,K,A
 * Suits: s (spades), h (hearts), d (diamonds), c (clubs)
 *
 * Compatible with ES2017 target (no downlevelIteration needed).
 */

export type HandCategory =
  | "high_card"
  | "one_pair"
  | "two_pair"
  | "three_of_a_kind"
  | "straight"
  | "flush"
  | "full_house"
  | "four_of_a_kind"
  | "straight_flush"
  | "royal_flush"

const RANKS: string[] = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"]
const SUITS: string[] = ["s", "h", "d", "c"]

/** Convert a rank character (2-9,T,J,Q,K,A) to its numeric value (2-14) */
function rankValue(rank: string): number {
  const idx = RANKS.indexOf(rank.toUpperCase())
  return idx >= 0 ? idx + 2 : 0
}

/**
 * Normalize a card to standard format: uppercase rank + lowercase suit.
 * Handles both 2-char (e.g. "As") and 3-char (e.g. "10s" -> "Ts") formats.
 */
export function normalizeCard(card: string): string {
  if (card.length === 2) {
    return card[0].toUpperCase() + card[1].toLowerCase()
  }
  if (card.length === 3) {
    return "T" + card[2].toLowerCase()
  }
  return card
}

/**
 * Get hand name from two hole cards, e.g. ["Ah", "Kd"] -> "AKo",
 * ["As", "Ks"] -> "AKs", ["Ac", "Ad"] -> "AA".
 */
export function getHandName(holeCards: string[]): string {
  if (holeCards.length !== 2) return "Unknown"

  const c1 = normalizeCard(holeCards[0])
  const c2 = normalizeCard(holeCards[1])
  const rank1 = c1[0]
  const rank2 = c2[0]
  const suit1 = c1[1]
  const suit2 = c2[1]

  const r1Idx = RANKS.indexOf(rank1.toUpperCase())
  const r2Idx = RANKS.indexOf(rank2.toUpperCase())
  const ranks =
    r1Idx >= r2Idx
      ? [rank1.toUpperCase(), rank2.toUpperCase()]
      : [rank2.toUpperCase(), rank1.toUpperCase()]

  const suited = suit1 === suit2 ? "s" : "o"

  if (ranks[0] === ranks[1]) return ranks[0] + ranks[1]
  return ranks[0] + ranks[1] + suited
}

/** Generate all k-combinations from an array */
function getCombinations(arr: string[], k: number): string[][] {
  if (k === 0) return [[]]
  if (arr.length < k || k <= 0) return []

  const result: string[][] = []
  for (let i = 0; i <= arr.length - k; i++) {
    const restCombos = getCombinations(arr.slice(i + 1), k - 1)
    for (let j = 0; j < restCombos.length; j++) {
      result.push([arr[i], ...restCombos[j]])
    }
  }
  return result
}

/**
 * Precomputed C(7,5) index combinations for efficient 7-card evaluation.
 * There are exactly 21 ways to choose 5 cards from 7.
 */
const C7_INDICES: number[][] = (() => {
  const indices: number[][] = []
  for (let a = 0; a < 3; a++)
    for (let b = a + 1; b < 4; b++)
      for (let c = b + 1; c < 5; c++)
        for (let d = c + 1; d < 6; d++)
          for (let e = d + 1; e < 7; e++)
            indices.push([a, b, c, d, e])
  return indices
})()

/**
 * Evaluate exactly 5 cards and return a numeric score array.
 * The score array is designed for lexicographic comparison:
 *   [categoryRank, kicker1, kicker2, ...]
 *
 * Higher category rank = stronger hand. Within the same category,
 * subsequent values break ties (kickers).
 *
 * Categories and their scores:
 *   Royal Flush:     [10]
 *   Straight Flush:  [9, highCard]
 *   Four of a Kind:  [8, quadRank, kicker]
 *   Full House:      [7, tripRank, pairRank]
 *   Flush:           [6, r1, r2, r3, r4, r5]
 *   Straight:        [5, highCard]
 *   Three of a Kind: [4, tripRank, k1, k2]
 *   Two Pair:        [3, highPair, lowPair, kicker]
 *   One Pair:        [2, pairRank, k1, k2, k3]
 *   High Card:       [1, r1, r2, r3, r4, r5]
 */
function evaluate5Cards(cards: string[]): number[] {
  // Parse and sort by rank descending
  const parsed = cards
    .map((c) => ({
      value: rankValue(c.length === 3 ? "T" : c[0]),
      suit: c.length === 3 ? c[2] : c[1].toLowerCase(),
    }))
    .sort((a, b) => b.value - a.value)

  const values = parsed.map((p) => p.value)
  return evaluate5Values(values, parsed[0].suit, parsed.every((p) => p.suit === parsed[0].suit))
}

/**
 * Fast-path evaluation: takes pre-sorted values and a flush flag.
 * Avoids re-parsing and re-sorting cards in inner Monte Carlo loops.
 * values must be sorted descending by rank value.
 */
function evaluate5Values(values: number[], _flushSuit: string, isFlush: boolean): number[] {
  // Detect straight
  const uniqueVals = Array.from(new Set(values)).sort((a, b) => b - a)
  let isStraight = false
  let straightHigh = 0

  if (uniqueVals.length === 5) {
    if (uniqueVals[0] - uniqueVals[4] === 4) {
      isStraight = true
      straightHigh = uniqueVals[0]
    } else if (
      uniqueVals[0] === 14 && uniqueVals[1] === 5 &&
      uniqueVals[2] === 4 && uniqueVals[3] === 3 && uniqueVals[4] === 2
    ) {
      isStraight = true
      straightHigh = 5
    }
  }

  // Frequency counting
  const freq: Record<number, number> = {}
  for (let vi = 0; vi < values.length; vi++) freq[values[vi]] = (freq[values[vi]] || 0) + 1

  const byCount: Record<number, number[]> = {}
  const rankVals = Object.keys(freq).map(Number)
  for (let ri = 0; ri < rankVals.length; ri++) {
    const v = rankVals[ri]
    const count = freq[v]
    if (!byCount[count]) byCount[count] = []
    byCount[count].push(v)
  }
  const countKeys = Object.keys(byCount).map(Number)
  for (let ci = 0; ci < countKeys.length; ci++) byCount[countKeys[ci]].sort((a, b) => b - a)

  const hasFour = byCount[4] !== undefined
  const hasThree = byCount[3] !== undefined
  const pairCount = (byCount[2] || []).length

  if (isFlush && isStraight) return straightHigh === 14 ? [10] : [9, straightHigh]
  if (hasFour) return [8, byCount[4][0], (byCount[1] || [0])[0]]
  if (hasThree && pairCount >= 1) return [7, byCount[3][0], byCount[2][0]]
  if (isFlush) return [6, ...values]
  if (isStraight) return [5, straightHigh]
  if (hasThree) {
    const kickers = (byCount[1] || []).sort((a, b) => b - a)
    return [4, byCount[3][0], ...kickers.slice(0, 2)]
  }
  if (pairCount >= 2) return [3, byCount[2][0], byCount[2][1], (byCount[1] || [0])[0]]
  if (pairCount === 1) {
    const kickers = (byCount[1] || []).sort((a, b) => b - a)
    return [2, byCount[2][0], ...kickers.slice(0, 3)]
  }
  return [1, ...values]
}

/** Compare two score arrays lexicographically. Returns negative/0/positive. */
function compareScoreArrays(a: number[], b: number[]): number {
  const len = Math.min(a.length, b.length)
  for (let i = 0; i < len; i++) {
    if (a[i] !== b[i]) return a[i] - b[i]
  }
  return 0
}

/**
 * Get the best 5-card hand score from any set of cards (2-7 cards).
 * For hands with >5 cards, evaluates all C(n,5) combinations and returns the best.
 */
export function getBestHand(cards: string[]): number[] {
  const normalized = cards.map(normalizeCard)

  // Remove duplicates (same card appearing twice)
  const seen = new Set<string>()
  const unique: string[] = []
  for (let i = 0; i < normalized.length; i++) {
    if (!seen.has(normalized[i])) {
      seen.add(normalized[i])
      unique.push(normalized[i])
    }
  }

  if (unique.length < 5) return [0]

  if (unique.length === 5) return evaluate5Cards(unique)

  const combos = getCombinations(unique, 5)
  let best: number[] | null = null
  for (let ci = 0; ci < combos.length; ci++) {
    const score = evaluate5Cards(combos[ci])
    if (best === null || compareScoreArrays(score, best) > 0) {
      best = score
    }
  }
  return best!
}

/**
 * Compare two poker hands (each can be 2-7 cards).
 * Returns:
 *   1 if hand1 wins
 *   0 if tie
 *  -1 if hand2 wins
 */
export function compareHands(hand1: string[], hand2: string[]): number {
  const score1 = getBestHand(hand1)
  const score2 = getBestHand(hand2)
  const diff = compareScoreArrays(score1, score2)
  return diff > 0 ? 1 : diff < 0 ? -1 : 0
}

/**
 * Optimized version of getBestHand for Monte Carlo inner loops.
 * Skips normalization and deduplication — assumes cards are already
 * normalized and unique (which is guaranteed in Monte Carlo sampling).
 *
 * Uses a direct 7-card evaluation algorithm that avoids enumerating
 * all C(7,5)=21 combinations, for much faster performance.
 */
export function getBestHandNormalized(cards: string[]): number[] {
  if (cards.length < 5) return [0]
  if (cards.length === 5) return evaluate5Cards(cards)

  // Pre-parse cards: get values (2-14) and suits
  const values = cards.map((c) => rankValue(c[0]))
  const suits = cards.map((c) => c[1].toLowerCase())

  // Sort values descending for straight/high-card detection
  const sortedVals = [...values].sort((a, b) => b - a)

  // For exactly 7 cards, use the direct 7-card evaluator
  if (cards.length === 7) {
    return evaluate7CardsDirect(values, suits, sortedVals)
  }

  // General case (8+ cards) — use combination generation
  const combos = getCombinations(cards, 5)
  let best: number[] | null = null
  for (let ci = 0; ci < combos.length; ci++) {
    const score = evaluate5Cards(combos[ci])
    if (best === null || compareScoreArrays(score, best) > 0) {
      best = score
    }
  }
  return best!
}

/**
 * Direct 7-card evaluator that finds the best 5-card hand without
 * enumerating all 21 combinations.
 *
 * Approach:
 * 1. Count rank frequencies (quads, trips, pairs)
 * 2. Check for flushes: which suit appears 5+ times
 * 3. Check for straights among unique ranks
 * 4. Combine findings to construct the best hand
 */
function evaluate7CardsDirect(
  values: number[],
  suits: string[],
  sortedVals: number[]
): number[] {
  // Step 1: rank frequencies
  const freq: Record<number, number> = {}
  for (let i = 0; i < values.length; i++) freq[values[i]] = (freq[values[i]] || 0) + 1

  const byCount: Record<number, number[]> = {}
  const rankKeys = Object.keys(freq).map(Number)
  for (let i = 0; i < rankKeys.length; i++) {
    const v = rankKeys[i]
    const c = freq[v]
    if (!byCount[c]) byCount[c] = []
    byCount[c].push(v)
  }
  for (const c of Object.keys(byCount)) byCount[Number(c)].sort((a, b) => b - a)

  const quads = byCount[4] || []
  const trips = byCount[3] || []
  const pairs = byCount[2] || []
  const singles = byCount[1] || []

  // Step 2: check for flush
  const suitCount: Record<string, number> = {}
  let flushSuit = ""
  for (let i = 0; i < suits.length; i++) {
    suitCount[suits[i]] = (suitCount[suits[i]] || 0) + 1
    if (suitCount[suits[i]] >= 5) flushSuit = suits[i]
  }

  let flushValues: number[] = []
  if (flushSuit) {
    for (let i = 0; i < values.length; i++) {
      if (suits[i] === flushSuit) flushValues.push(values[i])
    }
    flushValues.sort((a, b) => b - a)
    flushValues = flushValues.slice(0, 5)
  }

  // Step 3: check for straight
  // Use sortedVals (descending, with possible duplicates)
  const uniq = [...new Set(sortedVals)].sort((a, b) => b - a)
  const straight = findBestStraight(uniq)

  // Step 4: Check for straight flush (within the flush suit cards)
  let straightFlush: { high: number } | null = null
  if (flushSuit !== "") {
    straightFlush = findStraightFlushInFlushCards(flushValues)
  }

  // Step 5: Determine best hand

  // Royal/Straight flush
  if (straightFlush !== null) {
    return straightFlush.high === 14 ? [10] : [9, straightFlush.high]
  }

  // Four of a kind — kicker is the highest remaining card after removing quads
  if (quads.length > 0) {
    const q = quads[0]
    let kicker = 0
    for (let si = 0; si < sortedVals.length; si++) {
      if (sortedVals[si] !== q) { kicker = sortedVals[si]; break }
    }
    return [8, q, kicker]
  }

  // Full house
  if (trips.length > 0 && (pairs.length > 0 || trips.length >= 2)) {
    const t = trips[0]
    const p = trips.length >= 2 ? trips[1] : pairs[0]
    return [7, t, p]
  }

  // Flush
  if (flushSuit !== "") {
    return [6, ...flushValues]
  }

  // Straight
  if (straight !== null) {
    return [5, straight.high]
  }

  // Three of a kind
  if (trips.length > 0) {
    const kickers = singles.sort((a, b) => b - a)
    return [4, trips[0], ...kickers.slice(0, 2)]
  }

  // Two pair
  if (pairs.length >= 2) {
    // Find the best kicker from remaining unused cards
    const p0 = pairs[0]
    const p1 = pairs[1]
    let needSkip0 = 2
    let needSkip1 = 2
    let kicker = 0
    for (let si = 0; si < sortedVals.length; si++) {
      const v = sortedVals[si]
      if (v === p0 && needSkip0 > 0) { needSkip0--; continue }
      if (v === p1 && needSkip1 > 0) { needSkip1--; continue }
      kicker = v
      break
    }
    return [3, p0, p1, kicker]
  }

  // One pair
  if (pairs.length === 1) {
    const kickers = singles.sort((a, b) => b - a)
    return [2, pairs[0], ...kickers.slice(0, 3)]
  }

  // High card
  return [1, ...sortedVals.slice(0, 5)]
}

/** Find the best straight flush from all cards of a flush suit */
function findStraightFlushInFlushCards(flushCards: number[]): { high: number } | null {
  const uniq = [...new Set(flushCards)].sort((a, b) => b - a)

  // Regular straight flush
  for (let i = 0; i <= uniq.length - 5; i++) {
    if (uniq[i] - uniq[i + 4] === 4) {
      return { high: uniq[i] }
    }
  }

  // Wheel straight flush
  if (uniq.length >= 5 && uniq[0] === 14) {
    const hasWheel = [5, 4, 3, 2].every((r) => uniq.includes(r))
    if (hasWheel) return { high: 5 }
  }

  return null
}

/** Find the best straight from a sorted unique list of rank values (descending). Returns null if no straight. */
function findBestStraight(uniqueVals: number[]): { high: number; isWheel: boolean } | null {
  if (uniqueVals.length < 5) return null

  // Normal straight: check for 5 consecutive
  for (let i = 0; i <= uniqueVals.length - 5; i++) {
    if (uniqueVals[i] - uniqueVals[i + 4] === 4) {
      return { high: uniqueVals[i], isWheel: false }
    }
  }

  // Wheel: A-2-3-4-5
  if (uniqueVals[0] === 14 && uniqueVals.includes(5) && uniqueVals.includes(4) && uniqueVals.includes(3) && uniqueVals.includes(2)) {
    return { high: 5, isWheel: true }
  }

  return null
}

/**
 * Optimized version of compareHands for Monte Carlo inner loops.
 * Skips normalization — assumes all cards are already normalized.
 */
export function compareHandsNormalized(hand1: string[], hand2: string[]): number {
  const score1 = getBestHandNormalized(hand1)
  const score2 = getBestHandNormalized(hand2)
  const diff = compareScoreArrays(score1, score2)
  return diff > 0 ? 1 : diff < 0 ? -1 : 0
}

/**
 * Get the human-readable category name from a score array.
 */
export function getHandCategoryName(score: number[]): HandCategory {
  const cat = score[0]
  switch (cat) {
    case 10:
      return "royal_flush"
    case 9:
      return "straight_flush"
    case 8:
      return "four_of_a_kind"
    case 7:
      return "full_house"
    case 6:
      return "flush"
    case 5:
      return "straight"
    case 4:
      return "three_of_a_kind"
    case 3:
      return "two_pair"
    case 2:
      return "one_pair"
    default:
      return "high_card"
  }
}

/** Convert a numeric rank value (2-14) back to a rank character */
function rankFromValue(value: number): string {
  return RANKS[value - 2] || "?"
}

/**
 * Get a human-readable description of a hand score array.
 * E.g. "Pair of Kings" or "Flush, A-K-Q-9-5".
 */
export function describeHandScore(score: number[]): string {
  if (score.length === 0 || score[0] === 0) return "Invalid hand"

  const cat = getHandCategoryName(score)

  switch (cat) {
    case "royal_flush":
      return "Royal Flush"
    case "straight_flush":
      return "Straight Flush, " + rankFromValue(score[1]) + " high"
    case "four_of_a_kind":
      return "Four of a Kind, " + rankFromValue(score[1]) + "s"
    case "full_house":
      return (
        "Full House, " +
        rankFromValue(score[1]) +
        "s full of " +
        rankFromValue(score[2]) +
        "s"
      )
    case "flush":
      return "Flush, " + score.slice(1).map(rankFromValue).join("-")
    case "straight":
      return "Straight, " + rankFromValue(score[1]) + " high"
    case "three_of_a_kind":
      return "Three of a Kind, " + rankFromValue(score[1]) + "s"
    case "two_pair":
      return (
        "Two Pair, " +
        rankFromValue(score[1]) +
        "s and " +
        rankFromValue(score[2]) +
        "s"
      )
    case "one_pair":
      return "Pair of " + rankFromValue(score[1]) + "s"
    case "high_card":
      return "High Card " + rankFromValue(score[1])
  }
}
