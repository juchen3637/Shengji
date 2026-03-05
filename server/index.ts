import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { RoomManager } from './RoomManager';
import { GameManager } from './GameManager';
import type { JoinRoomPayload } from './types';

const PORT = process.env.PORT ?? 3002;

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

const roomManager = new RoomManager();
const gameManager = new GameManager();

// Cleanup stale rooms every 30 min
setInterval(() => roomManager.cleanup(), 30 * 60 * 1000);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

io.on('connection', (socket) => {
  console.log(`[Socket] Connected: ${socket.id}`);

  // Create a new room
  socket.on('create_room', (playerName: string, callback: (result: { success: boolean; roomId?: string; playerId?: string; error?: string }) => void) => {
    const room = roomManager.createRoom();
    const playerId = uuidv4();
    const result = roomManager.joinRoom(room.id, {
      socketId: socket.id,
      playerId,
      name: playerName,
      roomId: room.id,
    });
    if (result.success) {
      socket.join(room.id);
      callback({ success: true, roomId: room.id, playerId });
      io.to(room.id).emit('room_update', {
        roomId: room.id,
        players: room.players.map(p => ({ id: p.playerId, name: p.name })),
        playerCount: room.players.length,
      });
    } else {
      callback({ success: false, error: result.error });
    }
  });

  // Join an existing room
  socket.on('join_room', ({ roomId, playerName }: JoinRoomPayload, callback: (result: { success: boolean; roomId?: string; playerId?: string; error?: string }) => void) => {
    const playerId = uuidv4();
    const result = roomManager.joinRoom(roomId, {
      socketId: socket.id,
      playerId,
      name: playerName,
      roomId,
    });
    if (result.success) {
      socket.join(roomId);
      const room = roomManager.getRoom(roomId)!;
      callback({ success: true, roomId, playerId });
      io.to(roomId).emit('room_update', {
        roomId,
        players: room.players.map(p => ({ id: p.playerId, name: p.name })),
        playerCount: room.players.length,
      });
      // If room is now full (4 players), notify everyone
      if (room.players.length === 4) {
        io.to(roomId).emit('room_full', { roomId });
      }
    } else {
      callback({ success: false, error: result.error });
    }
  });

  // Start the game (first player / room creator only)
  socket.on('start_game', (roomId: string, callback?: (result: { success: boolean; error?: string }) => void) => {
    const room = roomManager.getRoom(roomId);
    if (!room) return callback?.({ success: false, error: 'Room not found' });
    if (room.players.length < 2) return callback?.({ success: false, error: 'Need at least 2 players' });
    if (room.players[0].socketId !== socket.id) return callback?.({ success: false, error: 'Only the room creator can start' });

    const gameState = gameManager.startGame(room);

    // Send each player their private view (other hands hidden)
    room.players.forEach(player => {
      const { state, myHand } = gameManager.getPlayerView(gameState, player.playerId);
      io.to(player.socketId).emit('game_started', {
        gameState: state,
        myHand,
      });
    });

    callback?.({ success: true });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`[Socket] Disconnected: ${socket.id}`);
    const room = roomManager.leaveRoom(socket.id);
    if (room) {
      io.to(room.id).emit('room_update', {
        roomId: room.id,
        players: room.players.map(p => ({ id: p.playerId, name: p.name })),
        playerCount: room.players.length,
      });
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`[Server] Shengji game server running on port ${PORT}`);
});
