/**
 * Room Store
 * Manages game room creation, joining, and state synchronization
 */

import { create } from 'zustand';
import { firebaseFirestore, COLLECTIONS } from '../config/firebase.config';
import { generateUniqueRoomCode } from '../utils/roomCode';
import type { RuleOptions } from '../game-logic/rules';

export interface RoomPlayer {
  userId: string;
  username: string;
  displayName: string;
  teamId: 1 | 2;
  isReady: boolean;
  slot: number;
}

export interface GameRoom {
  id: string;
  roomCode: string;
  hostUserId: string;
  players: RoomPlayer[];
  maxPlayers: number;
  status: 'waiting' | 'ready' | 'playing' | 'finished';
  gameMode: 'online';
  ruleOptions: RuleOptions;
  createdAt: Date;
  gameStateRef?: string; // Path to Realtime DB game state
}

interface RoomState {
  currentRoom: GameRoom | null;
  isHost: boolean;
  isLoading: boolean;
  error: string | null;
}

interface RoomActions {
  createRoom: (
    hostUserId: string,
    hostUsername: string,
    hostDisplayName: string,
    maxPlayers?: number,
    ruleOptions?: RuleOptions
  ) => Promise<GameRoom>;
  joinRoom: (
    roomCode: string,
    userId: string,
    username: string,
    displayName: string
  ) => Promise<GameRoom>;
  leaveRoom: (roomId: string, userId: string) => Promise<void>;
  setReady: (roomId: string, userId: string, ready: boolean) => Promise<void>;
  startGame: (roomId: string) => Promise<void>;
  subscribeToRoom: (roomId: string) => () => void;
  clearRoom: () => void;
}

type RoomStore = RoomState & RoomActions;

export const useRoomStore = create<RoomStore>((set, get) => ({
  // State
  currentRoom: null,
  isHost: false,
  isLoading: false,
  error: null,

  // Actions
  createRoom: async (
    hostUserId: string,
    hostUsername: string,
    hostDisplayName: string,
    maxPlayers = 4,
    ruleOptions = {}
  ) => {
    try {
      set({ isLoading: true, error: null });

      // Generate unique room code
      const roomCode = await generateUniqueRoomCode();

      // Create room document
      const roomData: Omit<GameRoom, 'id' | 'createdAt'> & { createdAt: any } = {
        roomCode,
        hostUserId,
        players: [
          {
            userId: hostUserId,
            username: hostUsername,
            displayName: hostDisplayName,
            teamId: 1,
            isReady: false,
            slot: 0,
          },
        ],
        maxPlayers,
        status: 'waiting',
        gameMode: 'online',
        ruleOptions,
        createdAt: new Date(),
      };

      const docRef = await firebaseFirestore
        .collection(COLLECTIONS.GAME_ROOMS)
        .add(roomData);

      const room: GameRoom = {
        ...roomData,
        id: docRef.id,
        createdAt: roomData.createdAt,
      };

      set({
        currentRoom: room,
        isHost: true,
        isLoading: false,
      });

      return room;
    } catch (error: any) {
      console.error('Create room error:', error);
      set({
        error: error.message || 'Failed to create room',
        isLoading: false,
      });
      throw error;
    }
  },

  joinRoom: async (
    roomCode: string,
    userId: string,
    username: string,
    displayName: string
  ) => {
    try {
      set({ isLoading: true, error: null });

      // Find room by code
      const roomsSnapshot = await firebaseFirestore
        .collection(COLLECTIONS.GAME_ROOMS)
        .where('roomCode', '==', roomCode.toUpperCase())
        .where('status', 'in', ['waiting', 'ready'])
        .get();

      if (roomsSnapshot.empty) {
        throw new Error('Room not found or already started');
      }

      const roomDoc = roomsSnapshot.docs[0];
      const roomData = roomDoc.data();

      // Check if room is full
      if (roomData.players.length >= roomData.maxPlayers) {
        throw new Error('Room is full');
      }

      // Check if user already in room
      if (roomData.players.some((p: RoomPlayer) => p.userId === userId)) {
        throw new Error('You are already in this room');
      }

      // Determine team assignment (alternate teams)
      const teamId = (roomData.players.length % 2 === 0 ? 1 : 2) as 1 | 2;

      // Add player to room
      const newPlayer: RoomPlayer = {
        userId,
        username,
        displayName,
        teamId,
        isReady: false,
        slot: roomData.players.length,
      };

      await roomDoc.ref.update({
        players: [...roomData.players, newPlayer],
      });

      // Get updated room data
      const updatedDoc = await roomDoc.ref.get();
      const updatedData = updatedDoc.data()!;

      const room: GameRoom = {
        id: roomDoc.id,
        roomCode: updatedData.roomCode,
        hostUserId: updatedData.hostUserId,
        players: updatedData.players,
        maxPlayers: updatedData.maxPlayers,
        status: updatedData.status,
        gameMode: updatedData.gameMode,
        ruleOptions: updatedData.ruleOptions,
        createdAt: updatedData.createdAt?.toDate() || new Date(),
        gameStateRef: updatedData.gameStateRef,
      };

      set({
        currentRoom: room,
        isHost: room.hostUserId === userId,
        isLoading: false,
      });

      return room;
    } catch (error: any) {
      console.error('Join room error:', error);
      set({
        error: error.message || 'Failed to join room',
        isLoading: false,
      });
      throw error;
    }
  },

  leaveRoom: async (roomId: string, userId: string) => {
    try {
      set({ isLoading: true, error: null });

      const roomRef = firebaseFirestore
        .collection(COLLECTIONS.GAME_ROOMS)
        .doc(roomId);

      const roomDoc = await roomRef.get();
      
      if (!roomDoc.exists) {
        throw new Error('Room not found');
      }

      const roomData = roomDoc.data()!;
      const remainingPlayers = roomData.players.filter(
        (p: RoomPlayer) => p.userId !== userId
      );

      if (remainingPlayers.length === 0) {
        // Delete room if no players left
        await roomRef.delete();
      } else if (roomData.hostUserId === userId) {
        // Transfer host to next player
        await roomRef.update({
          players: remainingPlayers,
          hostUserId: remainingPlayers[0].userId,
        });
      } else {
        // Just remove the player
        await roomRef.update({
          players: remainingPlayers,
        });
      }

      set({
        currentRoom: null,
        isHost: false,
        isLoading: false,
      });
    } catch (error: any) {
      console.error('Leave room error:', error);
      set({
        error: error.message || 'Failed to leave room',
        isLoading: false,
      });
      throw error;
    }
  },

  setReady: async (roomId: string, userId: string, ready: boolean) => {
    try {
      const roomRef = firebaseFirestore
        .collection(COLLECTIONS.GAME_ROOMS)
        .doc(roomId);

      const roomDoc = await roomRef.get();
      
      if (!roomDoc.exists) {
        throw new Error('Room not found');
      }

      const roomData = roomDoc.data()!;
      const updatedPlayers = roomData.players.map((p: RoomPlayer) =>
        p.userId === userId ? { ...p, isReady: ready } : p
      );

      await roomRef.update({
        players: updatedPlayers,
      });
    } catch (error: any) {
      console.error('Set ready error:', error);
      throw error;
    }
  },

  startGame: async (roomId: string) => {
    try {
      set({ isLoading: true, error: null });

      const roomRef = firebaseFirestore
        .collection(COLLECTIONS.GAME_ROOMS)
        .doc(roomId);

      const roomDoc = await roomRef.get();
      
      if (!roomDoc.exists) {
        throw new Error('Room not found');
      }

      const roomData = roomDoc.data()!;

      // Check if all players are ready
      const allReady = roomData.players.every((p: RoomPlayer) => p.isReady);
      
      if (!allReady) {
        throw new Error('Not all players are ready');
      }

      // Check minimum players (at least 2 for initial implementation)
      if (roomData.players.length < 2) {
        throw new Error('Need at least 2 players to start');
      }

      // Update room status to playing
      await roomRef.update({
        status: 'playing',
      });

      set({ isLoading: false });
    } catch (error: any) {
      console.error('Start game error:', error);
      set({
        error: error.message || 'Failed to start game',
        isLoading: false,
      });
      throw error;
    }
  },

  subscribeToRoom: (roomId: string) => {
    const unsubscribe = firebaseFirestore
      .collection(COLLECTIONS.GAME_ROOMS)
      .doc(roomId)
      .onSnapshot(
        (doc) => {
          if (doc.exists) {
            const data = doc.data()!;
            const room: GameRoom = {
              id: doc.id,
              roomCode: data.roomCode,
              hostUserId: data.hostUserId,
              players: data.players,
              maxPlayers: data.maxPlayers,
              status: data.status,
              gameMode: data.gameMode,
              ruleOptions: data.ruleOptions,
              createdAt: data.createdAt?.toDate() || new Date(),
              gameStateRef: data.gameStateRef,
            };

            const { currentRoom } = get();
            const userId = room.players.find(p => 
              currentRoom?.players.some(cp => cp.userId === p.userId)
            )?.userId;

            set({
              currentRoom: room,
              isHost: userId ? room.hostUserId === userId : false,
            });
          } else {
            // Room was deleted
            set({
              currentRoom: null,
              isHost: false,
            });
          }
        },
        (error) => {
          console.error('Room subscription error:', error);
          set({ error: error.message });
        }
      );

    return unsubscribe;
  },

  clearRoom: () => {
    set({
      currentRoom: null,
      isHost: false,
      error: null,
    });
  },
}));
