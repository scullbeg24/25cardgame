/**
 * Presence Service — Tracks player online/offline status using RTDB.
 *
 * Uses Firebase RTDB `.info/connected` with `onDisconnect()` for
 * automatic cleanup when a device loses connection.
 *
 * Writes to: `presence/{roomId}/{uid}`
 * Format: { online: boolean, lastSeen: number }
 */

import {
  firebaseAuth,
  firebaseDatabase,
  RTDB_PATHS,
} from "../config/firebase.config";

export interface PlayerPresence {
  online: boolean;
  lastSeen: number;
}

let _currentRoomId: string | null = null;
let _connectedUnsub: (() => void) | null = null;
let _presenceUnsub: (() => void) | null = null;

/**
 * Start tracking presence for the current user in a room.
 * Sets `online: true` on connect, `online: false` on disconnect.
 */
export function startPresence(roomId: string): () => void {
  const db = firebaseDatabase;
  const uid = firebaseAuth?.currentUser?.uid;
  if (!db || !uid) return () => {};

  // Clean up any previous presence
  stopPresence();
  _currentRoomId = roomId;

  const presenceRef = db.ref(`${RTDB_PATHS.PRESENCE}/${roomId}/${uid}`);
  const connectedRef = db.ref(".info/connected");

  const listener = connectedRef.on("value", (snapshot) => {
    if (snapshot.val() === true) {
      // We're connected
      presenceRef.set({ online: true, lastSeen: Date.now() });

      // When we disconnect, mark offline
      presenceRef.onDisconnect().set({
        online: false,
        lastSeen: Date.now(),
      });
    }
  });

  _connectedUnsub = () => connectedRef.off("value", listener);

  return () => stopPresence();
}

/**
 * Stop tracking presence. Marks user as offline.
 */
export function stopPresence(): void {
  const db = firebaseDatabase;
  const uid = firebaseAuth?.currentUser?.uid;

  if (_connectedUnsub) {
    _connectedUnsub();
    _connectedUnsub = null;
  }

  if (db && uid && _currentRoomId) {
    const presenceRef = db.ref(
      `${RTDB_PATHS.PRESENCE}/${_currentRoomId}/${uid}`
    );
    presenceRef.set({ online: false, lastSeen: Date.now() });
    presenceRef.onDisconnect().cancel();
  }

  _currentRoomId = null;
}

/**
 * Subscribe to presence changes for all players in a room.
 * Returns an unsubscribe function.
 */
export function subscribeToPresence(
  roomId: string,
  onUpdate: (presence: Record<string, PlayerPresence>) => void
): () => void {
  const db = firebaseDatabase;
  if (!db) return () => {};

  if (_presenceUnsub) {
    _presenceUnsub();
    _presenceUnsub = null;
  }

  const ref = db.ref(`${RTDB_PATHS.PRESENCE}/${roomId}`);

  const listener = ref.on("value", (snapshot) => {
    if (!snapshot.exists()) {
      onUpdate({});
      return;
    }
    onUpdate(snapshot.val() as Record<string, PlayerPresence>);
  });

  _presenceUnsub = () => ref.off("value", listener);
  return () => {
    if (_presenceUnsub) {
      _presenceUnsub();
      _presenceUnsub = null;
    }
  };
}

/**
 * Clean up all presence data for a room (host should call on room delete).
 */
export async function cleanupRoomPresence(roomId: string): Promise<void> {
  const db = firebaseDatabase;
  if (!db) return;
  await db.ref(`${RTDB_PATHS.PRESENCE}/${roomId}`).remove();
}

// ─── Legacy API (for backward compat with authStore) ────────────

export class PresenceService {
  start(userId: string) {
    console.log("[Presence] start:", userId);
  }
  stop() {
    stopPresence();
  }
  static async getOnlineStatus(_userId: string): Promise<boolean> {
    return false;
  }
  static subscribeToOnlineStatus(
    _userId: string,
    _callback: (isOnline: boolean) => void
  ): () => void {
    return () => {};
  }
  static subscribeToMultipleUsers(
    _userIds: string[],
    _callback: (userId: string, isOnline: boolean) => void
  ): () => void {
    return () => {};
  }
}

export const presenceService = new PresenceService();
