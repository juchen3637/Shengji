// ─── Suits & Ranks ───────────────────────────────────────────────────────────

export type Suit = "spades" | "hearts" | "diamonds" | "clubs" | "joker";

/** Numeric ranks 2–14 (Ace=14), plus joker sentinels */
export type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | "big_joker" | "small_joker";

export interface Card {
  id: string;        // e.g. "spades_10_0" — suit_rank_deckIndex
  suit: Suit;
  rank: Rank;
  deckIndex: 0 | 1;  // which of the two decks this card belongs to
}

// ─── Trump ───────────────────────────────────────────────────────────────────

/**
 * Describes the current trump configuration.
 * `suit` is null when the winning bid was a joker pair (no trump suit).
 */
export interface TrumpConfig {
  rank: number;       // 2–14, the current "level" rank that is trump
  suit: Suit | null;  // null → joker-pair bid, no trump suit
}

// ─── Bidding ─────────────────────────────────────────────────────────────────

export type BidType = "single" | "pair" | "joker_pair";

export interface Bid {
  player: number;  // index into GameState.players
  cards: Card[];
  type: BidType;
}

// ─── Combos ──────────────────────────────────────────────────────────────────

export type ComboType = "single" | "pair" | "tractor" | "multi";

export interface Combo {
  type: ComboType;
  cards: Card[];
}

// ─── Players ─────────────────────────────────────────────────────────────────

export interface PlayerState {
  id: string;
  name: string;
  hand: Card[];
  team: 0 | 1;    // team 0 = declarers (升级 side), team 1 = opponents
  level: number;  // 2–14, current level of the player
}

// ─── Tricks ──────────────────────────────────────────────────────────────────

export interface TrickPlay {
  player: number;
  combo: Combo;
}

export interface Trick {
  plays: TrickPlay[];
  leadPlayer: number;
  winner: number | null;
}

// ─── Game Phases ─────────────────────────────────────────────────────────────

export type Phase =
  | "waiting"   // lobby, waiting for players
  | "dealing"   // cards are being dealt
  | "bidding"   // players may bid for trump
  | "kitty"     // declarer team hides kitty cards
  | "playing"   // trick-taking phase
  | "scoring"   // round is over, scoring in progress
  | "done";     // game over

// ─── Game State ──────────────────────────────────────────────────────────────

export interface GameState {
  roomId: string;
  phase: Phase;

  players: PlayerState[];          // 4 players, indices 0–3
  declarerTeam: 0 | 1;            // which team is currently "declaring"
  declarerPlayerIndex: number;    // player who won the bid / is leading this round

  trump: TrumpConfig;

  deck: Card[];                   // remaining undealt cards (empty after dealing)
  kitty: Card[];                  // 8 hidden bottom cards
  currentBid: Bid | null;         // strongest bid so far this round

  tricks: Trick[];                // completed tricks
  currentTrick: Trick | null;     // trick in progress

  /** Points collected by each team this round */
  roundPoints: [number, number];  // [team0Points, team1Points]

  /** Cumulative levels (2–14) for each team */
  teamLevels: [number, number];

  currentPlayerIndex: number;     // whose turn it is
}

// ─── Socket events (shared client ↔ server) ──────────────────────────────────

export interface ServerToClientEvents {
  gameState: (state: GameState) => void;
  error: (message: string) => void;
}

export interface ClientToServerEvents {
  joinRoom: (roomId: string, playerName: string) => void;
  placeBid: (bid: Bid) => void;
  setKitty: (cards: Card[]) => void;
  playCards: (cards: Card[]) => void;
}
