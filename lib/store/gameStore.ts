import { create } from 'zustand';
import type { GameState } from '../game/types';

interface GameStore {
  gameState: GameState | null;
  myPlayerId: string | null;
  roomId: string | null;
  setGameState: (state: GameState) => void;
  setRoom: (roomId: string, playerId: string) => void;
  reset: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  gameState: null,
  myPlayerId: null,
  roomId: null,
  setGameState: (gameState) => set({ gameState }),
  setRoom: (roomId, myPlayerId) => set({ roomId, myPlayerId }),
  reset: () => set({ gameState: null, myPlayerId: null, roomId: null }),
}));
