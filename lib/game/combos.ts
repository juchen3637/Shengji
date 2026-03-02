import type { Card, Combo, ComboType, TrickPlay, TrumpConfig } from "./types";
import { cardTrumpValue, getEffectiveSuit, isTrump } from "./trump";

// ─── Pair detection ───────────────────────────────────────────────────────────

/**
 * Returns true if `cards` is exactly two cards that form a valid pair.
 * Two cards pair when they have the same rank AND same suit, OR both are
 * the same joker type (both big_joker or both small_joker).
 * Note: the deckIndex intentionally differs (one from each deck).
 */
export function isPair(cards: Card[], _trump: TrumpConfig): boolean {
  if (cards.length !== 2) return false;
  const [a, b] = cards;

  // Joker pairs
  if (a.rank === "big_joker" && b.rank === "big_joker") return true;
  if (a.rank === "small_joker" && b.rank === "small_joker") return true;

  // Standard pair: same rank, same suit, different deck
  return (
    a.rank === b.rank &&
    a.suit === b.suit &&
    a.deckIndex !== b.deckIndex
  );
}

// ─── Tractor detection ────────────────────────────────────────────────────────

/**
 * Groups cards into pairs (sorted by trump value or rank) and checks whether
 * the pairs form a valid tractor (2+ consecutive pairs of the same effective suit).
 *
 * Consecutiveness rules in trump:
 *  - small_joker pair  → big_joker pair  ✓
 *  - off-suit trump-rank pair → trump-suit trump-rank pair ✓  (trump-rank "bridge")
 *  - regular trump-suit consecutive ranks ✓
 *
 * In non-trump suits only consecutive ranks form tractors.
 */
export function isTractor(cards: Card[], trump: TrumpConfig): boolean {
  if (cards.length < 4 || cards.length % 2 !== 0) return false;

  // All cards must share the same effective suit
  const suits = new Set(cards.map((c) => getEffectiveSuit(c, trump)));
  if (suits.size !== 1) return false;

  const effectiveSuit = [...suits][0];

  // Sort cards by their comparable value within this suit
  const sortKey = (c: Card): number => {
    if (effectiveSuit === "trump") return cardTrumpValue(c, trump);
    return c.rank as number;
  };

  const sorted = [...cards].sort((a, b) => sortKey(a) - sortKey(b));

  // Extract pairs from sorted list
  const pairs: [Card, Card][] = [];
  for (let i = 0; i < sorted.length; i += 2) {
    const pair: [Card, Card] = [sorted[i], sorted[i + 1]];
    if (!isPair([...pair], trump)) return false;
    pairs.push(pair);
  }

  // Verify consecutiveness of pairs
  for (let i = 1; i < pairs.length; i++) {
    const prevVal = sortKey(pairs[i - 1][0]);
    const currVal = sortKey(pairs[i][0]);

    if (effectiveSuit === "trump") {
      // In trump, check if the two trump values are "adjacent" pairs.
      // Valid consecutive trump jumps:
      //   value 70 → 80 (off-suit trump rank → on-suit trump rank)
      //   any standard consecutive trump-suit cards (diff of 1 in rankOrder)
      //   small joker (90) → big joker (100) — diff of 10
      const validDiff = currVal - prevVal;
      if (validDiff !== 1 && validDiff !== 10 && !(prevVal === 70 && currVal === 80)) {
        return false;
      }
    } else {
      // Non-trump: consecutive ranks (diff of 1), skipping trump rank
      if (currVal - prevVal !== 1) return false;
      // If one of the ranks IS the trump rank, they can't be consecutive in non-trump
      const prevRank = pairs[i - 1][0].rank as number;
      const currRank = pairs[i][0].rank as number;
      if (prevRank === trump.rank || currRank === trump.rank) return false;
    }
  }

  return true;
}

// ─── Combo identification ─────────────────────────────────────────────────────

/**
 * Identifies the combo type of the given cards.
 * Returns null if the cards don't form a valid, recognisable combo.
 */
export function identifyCombo(
  cards: Card[],
  trump: TrumpConfig
): ComboType | null {
  if (cards.length === 0) return null;
  if (cards.length === 1) return "single";
  if (cards.length === 2) {
    if (isPair(cards, trump)) return "pair";
    return null; // Two non-paired cards aren't a valid combo
  }
  if (cards.length >= 4 && isTractor(cards, trump)) return "tractor";
  // "multi" — a mixed throw of singles/pairs (only legal as a lead, validated separately)
  if (cards.length > 2) return "multi";
  return null;
}

// ─── Play validation ──────────────────────────────────────────────────────────

/**
 * Validates whether `cards` is a legal play given `hand`, `leadCombo`, and `trump`.
 *
 * Rules:
 *  1. Must play the same number of cards as the lead.
 *  2. Must follow the lead suit if you hold any of it.
 *  3. If you can fully match the lead combo structure (single/pair/tractor), you must.
 *  4. If you can't follow suit at all, you may play anything.
 */
export function isValidPlay(
  cards: Card[],
  hand: Card[],
  leadCombo: Combo,
  trump: TrumpConfig
): boolean {
  if (cards.length !== leadCombo.cards.length) return false;

  // Confirm all played cards are actually in hand
  const handIds = new Set(hand.map((c) => c.id));
  if (!cards.every((c) => handIds.has(c.id))) return false;

  const leadSuit = getEffectiveSuit(leadCombo.cards[0], trump);
  const handInSuit = hand.filter(
    (c) => getEffectiveSuit(c, trump) === leadSuit
  );

  // If we have no cards in lead suit, anything is legal
  if (handInSuit.length === 0) return true;

  // All played cards must be from the lead suit if you have enough
  const playedInSuit = cards.filter(
    (c) => getEffectiveSuit(c, trump) === leadSuit
  );

  const mustContribute = Math.min(handInSuit.length, leadCombo.cards.length);
  if (playedInSuit.length < mustContribute) return false;

  return true;
}

// ─── Trick winner ─────────────────────────────────────────────────────────────

/**
 * Determines which player wins the trick.
 *
 * The lead player's combo establishes the lead suit.
 * Only cards that match the lead suit OR are trump can beat the lead.
 * Among valid contributions, the highest single trump value (or highest
 * lead-suit rank for non-trump tricks) wins.
 *
 * For tractors/pairs, only the "top" card value is compared for winning.
 */
export function winsTrick(
  plays: TrickPlay[],
  leadPlayer: number,
  trump: TrumpConfig
): number {
  const leadPlay = plays.find((p) => p.player === leadPlayer);
  if (!leadPlay) throw new Error("Lead player not found in plays");

  const leadSuit = getEffectiveSuit(leadPlay.combo.cards[0], trump);

  let winnerIndex = leadPlayer;
  let winnerValue = topValue(leadPlay.combo.cards, leadSuit, trump);

  for (const play of plays) {
    if (play.player === leadPlayer) continue;

    const playedSuit = getEffectiveSuit(play.combo.cards[0], trump);

    // Must follow lead suit or trump to potentially win
    if (playedSuit !== leadSuit && playedSuit !== "trump") continue;

    // Can't win with non-trump when lead was trump
    if (leadSuit === "trump" && playedSuit !== "trump") continue;

    const val = topValue(play.combo.cards, leadSuit, trump);
    if (val > winnerValue) {
      winnerValue = val;
      winnerIndex = play.player;
    }
  }

  return winnerIndex;
}

/** Returns the highest comparable value in a set of played cards. */
function topValue(
  cards: Card[],
  leadSuit: string,
  trump: TrumpConfig
): number {
  return Math.max(
    ...cards.map((c) => {
      const es = getEffectiveSuit(c, trump);
      if (es === "trump") return cardTrumpValue(c, trump);
      if (es === leadSuit) return c.rank as number;
      return 0;
    })
  );
}

/** Convenience: build a Combo from an array of cards */
export function buildCombo(cards: Card[], trump: TrumpConfig): Combo | null {
  const type = identifyCombo(cards, trump);
  if (type === null) return null;
  return { type, cards };
}

/** Returns true if the card is a valid trump-rank card for bidding purposes */
export function isTrumpRankCard(card: Card, trumpRank: number): boolean {
  return card.rank === trumpRank || card.rank === "big_joker" || card.rank === "small_joker";
}

/** Check if a set of cards can constitute a valid bid */
export function isValidBid(cards: Card[], trumpRank: number): boolean {
  if (!cards.every((c) => isTrumpRankCard(c, trumpRank))) return false;
  if (cards.length === 1) return true; // single
  if (cards.length === 2) {
    const [a, b] = cards;
    // Joker pair
    if (a.rank === "big_joker" && b.rank === "big_joker") return true;
    if (a.rank === "small_joker" && b.rank === "small_joker") return true;
    // Trump-rank pair: same suit, different decks
    if (
      typeof a.rank === "number" &&
      a.rank === b.rank &&
      a.suit === b.suit &&
      a.deckIndex !== b.deckIndex
    )
      return true;
  }
  return false;
}
