import type { Bid, Card, TrumpConfig } from "./types";

/**
 * Returns the numeric trump ranking of a card (higher = stronger trump).
 * Returns 0 if the card is NOT trump.
 *
 * Hierarchy (highest → lowest):
 *   100  Big Joker
 *    90  Small Joker
 *    80  Trump rank + Trump suit  (e.g. 8♠ when spades & rank 8)
 *    70  Trump rank + Other suit  (off-suit trump rank cards)
 *  1–60  Trump suit by rank (2=1 … 14=13, skipping the trump rank itself)
 *     0  Not trump
 */
export function cardTrumpValue(card: Card, trump: TrumpConfig): number {
  if (card.rank === "big_joker") return 100;
  if (card.rank === "small_joker") return 90;

  const rank = card.rank as number;

  // Trump-rank cards — effective suit is always 'trump'
  if (rank === trump.rank) {
    if (trump.suit !== null && card.suit === trump.suit) return 80;
    return 70; // off-suit trump rank (or no trump suit declared)
  }

  // Regular trump-suit cards (only when a trump suit exists)
  if (trump.suit !== null && card.suit === trump.suit) {
    // Map rank 2–14 (excluding trump.rank) to values 1–13
    const rankOrder = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].filter(
      (r) => r !== trump.rank
    );
    const pos = rankOrder.indexOf(rank);
    return pos >= 0 ? pos + 1 : 0;
  }

  return 0;
}

/** Returns true if the card belongs to the trump category. */
export function isTrump(card: Card, trump: TrumpConfig): boolean {
  return cardTrumpValue(card, trump) > 0;
}

/**
 * Returns the effective suit of a card for trick-following purposes.
 * Trump-rank cards and jokers always return 'trump', regardless of printed suit.
 */
export function getEffectiveSuit(
  card: Card,
  trump: TrumpConfig
): "trump" | "spades" | "hearts" | "diamonds" | "clubs" {
  if (isTrump(card, trump)) return "trump";
  if (card.suit === "joker") return "trump"; // shouldn't happen after isTrump, but guard
  return card.suit as "spades" | "hearts" | "diamonds" | "clubs";
}

/**
 * Determines whether `newBid` can legally override `currentBid`.
 *
 * Rules:
 *  - Any bid beats no bid (currentBid === null).
 *  - single < pair < joker_pair in strength.
 *  - A bid of the same type can override only if made by a DIFFERENT player
 *    and uses the same or stronger bid type.
 *  - A stronger bid type always overrides regardless of player.
 */
export function compareBid(newBid: Bid, currentBid: Bid | null): boolean {
  if (currentBid === null) return true;

  const strength: Record<Bid["type"], number> = {
    single: 1,
    pair: 2,
    joker_pair: 3,
  };

  const newStrength = strength[newBid.type];
  const curStrength = strength[currentBid.type];

  if (newStrength > curStrength) return true;
  if (newStrength === curStrength && newBid.player !== currentBid.player)
    return true;

  return false;
}

/**
 * Derives a TrumpConfig from the winning bid.
 * A joker_pair bid → no trump suit (null).
 */
export function trumpFromBid(bid: Bid, currentTrumpRank: number): TrumpConfig {
  if (bid.type === "joker_pair") {
    return { rank: currentTrumpRank, suit: null };
  }
  // The bid cards all share the same suit
  const suit = bid.cards[0].suit;
  if (suit === "joker") {
    return { rank: currentTrumpRank, suit: null };
  }
  return { rank: currentTrumpRank, suit };
}
