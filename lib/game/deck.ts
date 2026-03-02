import type { Card, Rank, Suit } from "./types";

const SUITS: Suit[] = ["spades", "hearts", "diamonds", "clubs"];
const RANKS: Rank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

/**
 * Creates a 108-card deck: 2× standard 52-card decks + 4 jokers (2 big, 2 small).
 * Card IDs are unique: `{suit}_{rank}_{deckIndex}`.
 */
export function createDeck(): Card[] {
  const deck: Card[] = [];

  for (const deckIndex of [0, 1] as const) {
    // 52 standard cards per deck
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        deck.push({
          id: `${suit}_${rank}_${deckIndex}`,
          suit,
          rank,
          deckIndex,
        });
      }
    }

    // 2 jokers per deck
    deck.push({
      id: `joker_small_joker_${deckIndex}`,
      suit: "joker",
      rank: "small_joker",
      deckIndex,
    });
    deck.push({
      id: `joker_big_joker_${deckIndex}`,
      suit: "joker",
      rank: "big_joker",
      deckIndex,
    });
  }

  return deck; // 108 cards total
}

/**
 * Fisher-Yates in-place shuffle. Returns the same array mutated.
 */
export function shuffleDeck(deck: Card[]): Card[] {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

/**
 * Deals from a shuffled 108-card deck.
 * Each of 4 players receives 25 cards; the remaining 8 go to the kitty.
 */
export function dealCards(deck: Card[]): {
  hands: [Card[], Card[], Card[], Card[]];
  kitty: Card[];
} {
  if (deck.length !== 108) {
    throw new Error(`Expected 108-card deck, got ${deck.length}`);
  }

  const hands: [Card[], Card[], Card[], Card[]] = [[], [], [], []];

  // Deal 25 cards to each player (4 × 25 = 100)
  for (let i = 0; i < 100; i++) {
    hands[i % 4].push(deck[i]);
  }

  // Remaining 8 cards are the kitty
  const kitty = deck.slice(100);

  return { hands, kitty };
}
