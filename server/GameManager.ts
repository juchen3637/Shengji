import type { Room } from './types';
import type { GameState, Card } from '../lib/game/types';
import { createDeck, shuffleDeck, dealCards } from '../lib/game/deck';

export class GameManager {
  startGame(room: Room): GameState {
    const deck = shuffleDeck(createDeck());
    const { hands, kitty } = dealCards(deck);

    const gameState: GameState = {
      roomId: room.id,
      phase: 'bidding',
      players: room.players.map((p, i) => ({
        id: p.playerId,
        name: p.name,
        team: (i % 2) as 0 | 1, // players 0,2 = team 0; players 1,3 = team 1
        level: 2,
        hand: hands[i],
      })),
      declarerTeam: 0,
      declarerPlayerIndex: 0,
      trump: { rank: 2, suit: null },
      deck: [],          // fully dealt — no remaining cards
      kitty,
      currentBid: null,
      tricks: [],
      currentTrick: null,
      roundPoints: [0, 0],
      teamLevels: [2, 2],
      currentPlayerIndex: 0,
    };

    room.gameState = gameState;
    console.log(`[Game] Started game in room ${room.id}`);
    return gameState;
  }

  /**
   * Returns a sanitized view of the game state for a specific player:
   * - their own hand is preserved
   * - all other players' hands are emptied (hidden)
   */
  getPlayerView(gameState: GameState, playerId: string): { state: GameState; myHand: Card[] } {
    const playerIndex = gameState.players.findIndex(p => p.id === playerId);
    const myHand: Card[] = playerIndex >= 0 ? [...gameState.players[playerIndex].hand] : [];

    const sanitizedState: GameState = {
      ...gameState,
      players: gameState.players.map((p, i) => ({
        ...p,
        hand: i === playerIndex ? p.hand : [], // hide other players' cards
      })),
    };

    return { state: sanitizedState, myHand };
  }
}
