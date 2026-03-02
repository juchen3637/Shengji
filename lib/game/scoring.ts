import type { Card, Combo, ComboType } from "./types";

// ─── Point values ─────────────────────────────────────────────────────────────

/** Cards worth points: 5s are worth 5, 10s and Kings (13) are worth 10. */
export const POINT_VALUES: Record<number, number> = {
  5: 5,
  10: 10,
  13: 10, // King
};

/**
 * Returns the point value of a single card (0, 5, or 10).
 */
export function cardPoints(card: Card): number {
  if (typeof card.rank === "string") return 0; // jokers have no point value
  return POINT_VALUES[card.rank] ?? 0;
}

/**
 * Returns the total points in an array of cards.
 */
export function totalPoints(cards: Card[]): number {
  return cards.reduce((sum, c) => sum + cardPoints(c), 0);
}

// ─── Kitty scoring ────────────────────────────────────────────────────────────

/**
 * Multiplier applied to the kitty based on the last trick's combo.
 *
 *   single / normal  → ×2
 *   pair             → ×4
 *   tractor          → ×8
 */
function kittyMultiplier(lastTrickComboType: ComboType): number {
  switch (lastTrickComboType) {
    case "tractor":
      return 8;
    case "pair":
      return 4;
    default:
      return 2;
  }
}

/**
 * Calculates the points the attacking team earns from the kitty.
 * The kitty points are multiplied based on the final trick's combo type.
 *
 * Called only if the attacking team wins the last trick.
 * If the declarers win the last trick, they score 0 from the kitty.
 */
export function scoreKitty(
  kitty: Card[],
  lastTrickCombo: Combo
): number {
  const basePoints = totalPoints(kitty);
  if (basePoints === 0) return 0;
  return basePoints * kittyMultiplier(lastTrickCombo.type);
}

// ─── Level advancement ────────────────────────────────────────────────────────

/**
 * Determines round outcome and level advancement for the declaring team.
 *
 * Standard Shengji point thresholds (opponent = non-declaring team):
 *
 *  opponents score  | result
 *  ─────────────────┼────────────────────────────────────────
 *   0               | declarers win, advance 3 levels
 *   5–35            | declarers win, advance 2 levels
 *   40–75           | declarers win, advance 1 level
 *   80               | opponents win: attackers advance 0
 *   85–115           | opponents win: attackers advance 1
 *   120+             | opponents win: attackers advance 2
 *
 * Total points in the deck: 4 suits × (5 + 10 + 10) = 120, plus kitty.
 * The threshold is against the 120-point base (kitty is bonus).
 */
export function levelAdvancement(opponentPoints: number): {
  declarersWin: boolean;
  levelsGained: number;
} {
  if (opponentPoints < 40) {
    // Declarers crushed the opponents
    const levelsGained = opponentPoints === 0 ? 3 : opponentPoints < 40 ? 2 : 1;
    return { declarersWin: true, levelsGained };
  }
  if (opponentPoints < 80) {
    return { declarersWin: true, levelsGained: 1 };
  }
  // Opponents scored 80+ — attackers win
  if (opponentPoints < 120) {
    return { declarersWin: false, levelsGained: 0 };
  }
  if (opponentPoints < 160) {
    return { declarersWin: false, levelsGained: 1 };
  }
  return { declarersWin: false, levelsGained: 2 };
}

/**
 * Advance a team level by `levels`, capping at 14 (Ace).
 * After reaching 14, the game is won.
 */
export function advanceLevel(currentLevel: number, levels: number): number {
  return Math.min(14, currentLevel + levels);
}

/**
 * Returns true if a team has won the game (reached and "passed" Ace level).
 * Conventionally, winning at Ace (14) means the team wins.
 */
export function isGameWon(level: number): boolean {
  return level >= 14;
}
