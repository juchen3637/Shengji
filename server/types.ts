import type { GameState, Card } from '../lib/game/types';

export interface ConnectedPlayer {
  socketId: string;
  playerId: string;
  name: string;
  roomId: string;
}

export interface Room {
  id: string;
  players: ConnectedPlayer[];
  gameState: GameState | null;
  createdAt: number;
}

// Socket event payloads
export interface JoinRoomPayload { roomId: string; playerName: string; }
export interface PlaceBidPayload { roomId: string; cardIds: string[]; }
export interface DiscardKittyPayload { roomId: string; cardIds: string[]; }
export interface PlayCardsPayload { roomId: string; cardIds: string[]; }

export interface RoomUpdateEvent { room: Omit<Room, 'gameState'>; playerCount: number; }
export interface GameStateEvent { gameState: GameState; yourHand: Card[]; }
export interface ErrorEvent { message: string; code: string; }
