import type { GameState, Card } from '../lib/game/types';
import { isTrump, getEffectiveSuit, cardTrumpValue } from '../lib/game/trump';

const BOT_DELAY_MS = 800;

export function isBotPlayer(playerId: string): boolean {
  return playerId.startsWith('bot_');
}

export function createBotId(seatIndex: number): string {
  return `bot_${seatIndex}`;
}

export function createBotName(seatIndex: number): string {
  const names = ['Bot East', 'Bot North', 'Bot West'];
  return names[seatIndex] ?? `Bot ${seatIndex}`;
}

export function chooseBotBid(hand: Card[], trump: GameState['trump']): Card[] | null {
  const bigJokers = hand.filter(c => c.rank === 'big_joker');
  if (bigJokers.length >= 2) return bigJokers.slice(0, 2);
  const trumpPairs = hand.filter(c => typeof c.rank === 'number' && c.rank === trump.rank && c.suit === trump.suit);
  if (trumpPairs.length >= 2) return trumpPairs.slice(0, 2);
  const singleTrump = hand.find(c => typeof c.rank === 'number' && c.rank === trump.rank);
  if (singleTrump && Math.random() > 0.5) return [singleTrump];
  return null;
}

export function chooseBotKittyDiscard(hand: Card[], trump: GameState['trump']): Card[] {
  const nonTrump = hand
    .filter(c => !isTrump(c, trump))
    .sort((a, b) => (typeof a.rank === 'number' ? a.rank : 15) - (typeof b.rank === 'number' ? b.rank : 15));
  if (nonTrump.length >= 8) return nonTrump.slice(0, 8);
  const trumpCards = hand
    .filter(c => isTrump(c, trump))
    .sort((a, b) => cardTrumpValue(a, trump) - cardTrumpValue(b, trump));
  return [...nonTrump, ...trumpCards].slice(0, 8);
}

export function chooseBotPlay(hand: Card[], leadCards: Card[] | null, trump: GameState['trump']): Card[] {
  if (!leadCards || leadCards.length === 0) {
    const sorted = [...hand].sort((a, b) => {
      if (isTrump(a, trump) && !isTrump(b, trump)) return -1;
      if (!isTrump(a, trump) && isTrump(b, trump)) return 1;
      const rv = (r: Card['rank']) => typeof r === 'number' ? r : r === 'big_joker' ? 20 : 19;
      return rv(b.rank) - rv(a.rank);
    });
    return [sorted[0]];
  }
  const leadSuit = getEffectiveSuit(leadCards[0], trump);
  const count = leadCards.length;
  const sameSuit = hand.filter(c => getEffectiveSuit(c, trump) === leadSuit);
  if (sameSuit.length >= count) {
    return sameSuit.sort((a, b) => (typeof a.rank === 'number' ? a.rank : 15) - (typeof b.rank === 'number' ? b.rank : 15)).slice(0, count);
  }
  const sorted = [...hand].sort((a, b) => {
    if (isTrump(a, trump) && !isTrump(b, trump)) return 1;
    if (!isTrump(a, trump) && isTrump(b, trump)) return -1;
    return (typeof a.rank === 'number' ? a.rank : 15) - (typeof b.rank === 'number' ? b.rank : 15);
  });
  return [...sameSuit, ...sorted.filter(c => !sameSuit.includes(c))].slice(0, count);
}

export { BOT_DELAY_MS };
