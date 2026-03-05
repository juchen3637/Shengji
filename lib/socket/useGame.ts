import { useCallback } from 'react';
import { connectSocket, getSocket } from './client';
import { useGameStore } from '../store/gameStore';

export interface RoomPlayer { id: string; name: string; isBot?: boolean; }

export function useGame() {
  const { setRoom } = useGameStore();

  const createRoom = useCallback((playerName: string): Promise<{ roomId: string; playerId: string }> => {
    return new Promise((resolve, reject) => {
      const socket = connectSocket();
      socket.emit('create_room', playerName, (res: any) => {
        if (res.success) { setRoom(res.roomId, res.playerId); resolve(res); }
        else reject(new Error(res.error ?? 'Failed'));
      });
    });
  }, [setRoom]);

  const joinRoom = useCallback((roomId: string, playerName: string): Promise<{ roomId: string; playerId: string }> => {
    return new Promise((resolve, reject) => {
      const socket = connectSocket();
      socket.emit('join_room', { roomId, playerName }, (res: any) => {
        if (res.success) { setRoom(res.roomId, res.playerId); resolve(res); }
        else reject(new Error(res.error ?? 'Failed'));
      });
    });
  }, [setRoom]);

  const fillWithBots = useCallback((roomId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      getSocket().emit('fill_with_bots', roomId, (res: any) => {
        res.success ? resolve() : reject(new Error(res.error));
      });
    });
  }, []);

  const startGame = useCallback((roomId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      getSocket().emit('start_game', roomId, (res: any) => {
        res.success ? resolve() : reject(new Error(res.error));
      });
    });
  }, []);

  return { createRoom, joinRoom, fillWithBots, startGame };
}
