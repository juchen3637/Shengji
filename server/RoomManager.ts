import { v4 as uuidv4 } from 'uuid';
import type { Room, ConnectedPlayer } from './types';

export class RoomManager {
  private rooms = new Map<string, Room>();

  createRoom(): Room {
    const id = Math.random().toString(36).substring(2, 8).toUpperCase(); // 6-char code e.g. "X7K2PQ"
    const room: Room = { id, players: [], gameState: null, createdAt: Date.now() };
    this.rooms.set(id, room);
    console.log(`[Room] Created room ${id}`);
    return room;
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  joinRoom(roomId: string, player: ConnectedPlayer): { success: boolean; error?: string } {
    const room = this.rooms.get(roomId);
    if (!room) return { success: false, error: 'Room not found' };
    if (room.players.length >= 4) return { success: false, error: 'Room is full' };
    if (room.gameState) return { success: false, error: 'Game already in progress' };
    room.players.push(player);
    console.log(`[Room] ${player.name} joined room ${roomId} (${room.players.length}/4)`);
    return { success: true };
  }

  leaveRoom(socketId: string): Room | null {
    for (const room of this.rooms.values()) {
      const idx = room.players.findIndex(p => p.socketId === socketId);
      if (idx !== -1) {
        const [player] = room.players.splice(idx, 1);
        console.log(`[Room] ${player.name} left room ${room.id}`);
        if (room.players.length === 0) {
          this.rooms.delete(room.id);
          console.log(`[Room] Room ${room.id} deleted (empty)`);
        }
        return room;
      }
    }
    return null;
  }

  getRoomBySocket(socketId: string): Room | null {
    for (const room of this.rooms.values()) {
      if (room.players.some(p => p.socketId === socketId)) return room;
    }
    return null;
  }

  // Clean up rooms older than 2 hours with no game
  cleanup(): void {
    const cutoff = Date.now() - 2 * 60 * 60 * 1000;
    for (const [id, room] of this.rooms.entries()) {
      if (room.createdAt < cutoff && !room.gameState) {
        this.rooms.delete(id);
        console.log(`[Room] Cleaned up stale room ${id}`);
      }
    }
  }
}
