/**
 * Room lifecycle management using Firebase Realtime Database.
 * Handles room creation, joining, leaving, ready states, and public room browsing.
 */

import { create } from "zustand";
import { firebaseAuth, firebaseDatabase, RTDB_PATHS } from "../config/firebase.config";

// ─── Types ───────────────────────────────────────────────────────

export interface RoomSettings {
  numPlayers: number;
  targetScore: number;
  isPublic: boolean;
}

export interface RoomPlayer {
  name: string;
  slot: number;
  ready: boolean;
}

export interface Room {
  id: string;
  code: string;
  hostId: string;
  settings: RoomSettings;
  status: "waiting" | "playing" | "finished";
  players: Record<string, RoomPlayer>;
  createdAt: number;
}

export interface PublicRoomInfo {
  id: string;
  code: string;
  hostName: string;
  numPlayers: number;
  currentPlayers: number;
  targetScore: number;
  createdAt: number;
}

interface RoomState {
  currentRoom: Room | null;
  roomId: string | null;
  mySlot: number | null;
  isHost: boolean;
  error: string | null;
  loading: boolean;
  publicRooms: PublicRoomInfo[];

  createRoom: (settings: RoomSettings, playerName: string) => Promise<string | null>;
  joinRoom: (code: string, playerName: string) => Promise<string | null>;
  leaveRoom: () => Promise<void>;
  setReady: (ready: boolean) => Promise<void>;
  startGame: () => Promise<boolean>;
  subscribeToRoom: (roomId: string) => () => void;
  fetchPublicRooms: () => Promise<void>;
  cleanup: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function getUid(): string | null {
  return firebaseAuth?.currentUser?.uid ?? null;
}

// ─── Store ───────────────────────────────────────────────────────

export const useRoomStore = create<RoomState>((set, get) => ({
  currentRoom: null,
  roomId: null,
  mySlot: null,
  isHost: false,
  error: null,
  loading: false,
  publicRooms: [],

  createRoom: async (settings, playerName) => {
    const db = firebaseDatabase;
    const uid = getUid();
    if (!db || !uid) {
      set({ error: "Not authenticated" });
      return null;
    }

    set({ loading: true, error: null });

    try {
      // Generate unique room code (check for collisions)
      let code = generateRoomCode();
      let attempts = 0;
      while (attempts < 10) {
        const existing = await db
          .ref(RTDB_PATHS.GAME_ROOMS)
          .orderByChild("code")
          .equalTo(code)
          .once("value");
        if (!existing.exists()) break;
        code = generateRoomCode();
        attempts++;
      }

      const roomRef = db.ref(RTDB_PATHS.GAME_ROOMS).push();
      const roomId = roomRef.key!;

      const room: Room = {
        id: roomId,
        code,
        hostId: uid,
        settings,
        status: "waiting",
        players: {
          [uid]: { name: playerName, slot: 0, ready: false },
        },
        createdAt: Date.now(),
      };

      await roomRef.set(room);

      // Add to public room index if public
      if (settings.isPublic) {
        await db.ref(`publicRooms/${roomId}`).set({
          code,
          hostName: playerName,
          numPlayers: settings.numPlayers,
          currentPlayers: 1,
          targetScore: settings.targetScore,
          createdAt: Date.now(),
        });
      }

      // Auto-remove player on disconnect
      db.ref(`${RTDB_PATHS.GAME_ROOMS}/${roomId}/players/${uid}`).onDisconnect().remove();

      set({
        currentRoom: room,
        roomId,
        mySlot: 0,
        isHost: true,
        loading: false,
      });

      return roomId;
    } catch (err: any) {
      set({ error: err.message || "Failed to create room", loading: false });
      return null;
    }
  },

  joinRoom: async (code, playerName) => {
    const db = firebaseDatabase;
    const uid = getUid();
    if (!db || !uid) {
      set({ error: "Not authenticated" });
      return null;
    }

    set({ loading: true, error: null });

    try {
      // Find room by code
      const snapshot = await db
        .ref(RTDB_PATHS.GAME_ROOMS)
        .orderByChild("code")
        .equalTo(code.toUpperCase())
        .once("value");

      if (!snapshot.exists()) {
        set({ error: "Room not found", loading: false });
        return null;
      }

      let roomId = "";
      let roomData: Room | null = null;
      snapshot.forEach((child) => {
        roomId = child.key!;
        roomData = child.val() as Room;
        return true;
      });

      if (!roomData || !roomId) {
        set({ error: "Room not found", loading: false });
        return null;
      }

      const room = roomData as Room;

      if (room.status !== "waiting") {
        set({ error: "Game already in progress", loading: false });
        return null;
      }

      // Already in room?
      if (room.players[uid]) {
        set({
          currentRoom: room,
          roomId,
          mySlot: room.players[uid].slot,
          isHost: room.hostId === uid,
          loading: false,
        });
        return roomId;
      }

      // Room full?
      const currentCount = Object.keys(room.players).length;
      if (currentCount >= room.settings.numPlayers) {
        set({ error: "Room is full", loading: false });
        return null;
      }

      // Find next slot
      const takenSlots = new Set(Object.values(room.players).map((p) => p.slot));
      let nextSlot = 0;
      while (takenSlots.has(nextSlot)) nextSlot++;

      // Add player
      const playerRef = db.ref(`${RTDB_PATHS.GAME_ROOMS}/${roomId}/players/${uid}`);
      await playerRef.set({ name: playerName, slot: nextSlot, ready: false });
      playerRef.onDisconnect().remove();

      // Update public room index
      if (room.settings.isPublic) {
        const newCount = currentCount + 1;
        await db.ref(`publicRooms/${roomId}/currentPlayers`).set(newCount);
        if (newCount >= room.settings.numPlayers) {
          await db.ref(`publicRooms/${roomId}`).remove();
        }
      }

      set({
        currentRoom: {
          ...room,
          players: { ...room.players, [uid]: { name: playerName, slot: nextSlot, ready: false } },
        },
        roomId,
        mySlot: nextSlot,
        isHost: false,
        loading: false,
      });

      return roomId;
    } catch (err: any) {
      set({ error: err.message || "Failed to join room", loading: false });
      return null;
    }
  },

  leaveRoom: async () => {
    const db = firebaseDatabase;
    const uid = getUid();
    const { roomId, currentRoom } = get();
    if (!db || !uid || !roomId) return;

    try {
      await db.ref(`${RTDB_PATHS.GAME_ROOMS}/${roomId}/players/${uid}`).remove();

      if (currentRoom?.hostId === uid) {
        const remaining = Object.keys(currentRoom.players).filter((id) => id !== uid);
        if (remaining.length > 0) {
          await db.ref(`${RTDB_PATHS.GAME_ROOMS}/${roomId}/hostId`).set(remaining[0]);
        } else {
          await db.ref(`${RTDB_PATHS.GAME_ROOMS}/${roomId}`).remove();
          await db.ref(`publicRooms/${roomId}`).remove();
        }
      }

      if (currentRoom?.settings.isPublic) {
        const count = Object.keys(currentRoom.players).length - 1;
        if (count > 0) {
          await db.ref(`publicRooms/${roomId}/currentPlayers`).set(count);
        }
      }

      set({ currentRoom: null, roomId: null, mySlot: null, isHost: false });
    } catch (err: any) {
      set({ error: err.message || "Failed to leave room" });
    }
  },

  setReady: async (ready) => {
    const db = firebaseDatabase;
    const uid = getUid();
    const { roomId } = get();
    if (!db || !uid || !roomId) return;

    await db.ref(`${RTDB_PATHS.GAME_ROOMS}/${roomId}/players/${uid}/ready`).set(ready);
  },

  startGame: async () => {
    const db = firebaseDatabase;
    const uid = getUid();
    const { roomId, currentRoom } = get();
    if (!db || !uid || !roomId || !currentRoom) return false;

    if (currentRoom.hostId !== uid) {
      set({ error: "Only the host can start" });
      return false;
    }

    const players = Object.values(currentRoom.players);
    if (players.length < currentRoom.settings.numPlayers) {
      set({ error: "Waiting for more players" });
      return false;
    }
    if (!players.every((p) => p.ready)) {
      set({ error: "Not all players are ready" });
      return false;
    }

    try {
      await db.ref(`${RTDB_PATHS.GAME_ROOMS}/${roomId}/status`).set("playing");
      await db.ref(`publicRooms/${roomId}`).remove();
      return true;
    } catch (err: any) {
      set({ error: err.message || "Failed to start game" });
      return false;
    }
  },

  subscribeToRoom: (roomId) => {
    const db = firebaseDatabase;
    const uid = getUid();
    if (!db || !uid) return () => {};

    const roomRef = db.ref(`${RTDB_PATHS.GAME_ROOMS}/${roomId}`);

    const listener = roomRef.on("value", (snapshot) => {
      if (!snapshot.exists()) {
        set({ currentRoom: null, roomId: null, mySlot: null, isHost: false });
        return;
      }

      const room = snapshot.val() as Room;
      room.id = roomId;

      const myPlayer = room.players?.[uid];
      set({
        currentRoom: room,
        roomId,
        mySlot: myPlayer?.slot ?? null,
        isHost: room.hostId === uid,
      });
    });

    return () => roomRef.off("value", listener);
  },

  fetchPublicRooms: async () => {
    const db = firebaseDatabase;
    if (!db) return;

    try {
      const snapshot = await db
        .ref("publicRooms")
        .orderByChild("createdAt")
        .limitToLast(20)
        .once("value");

      if (!snapshot.exists()) {
        set({ publicRooms: [] });
        return;
      }

      const rooms: PublicRoomInfo[] = [];
      snapshot.forEach((child) => {
        rooms.push({ id: child.key!, ...child.val() });
        return undefined;
      });

      rooms.reverse();
      set({ publicRooms: rooms });
    } catch (err: any) {
      set({ error: err.message || "Failed to fetch rooms" });
    }
  },

  cleanup: () => {
    set({
      currentRoom: null,
      roomId: null,
      mySlot: null,
      isHost: false,
      error: null,
      loading: false,
      publicRooms: [],
    });
  },
}));
