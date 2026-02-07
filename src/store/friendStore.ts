/**
 * Friend Store
 * Manages friend relationships and friend requests using Firebase Realtime Database
 */

import { create } from 'zustand';
import { firebaseDatabase, RTDB_PATHS } from '../config/firebase.config';
import type { UserProfile } from './authStore';

export interface Friendship {
  id: string;
  users: string[]; // Array of 2 user IDs (sorted)
  status: 'pending' | 'accepted' | 'blocked';
  initiatedBy: string;
  createdAt: Date;
  acceptedAt?: Date;
}

export interface FriendProfile extends UserProfile {
  friendshipId: string;
  isOnline?: boolean;
}

interface FriendState {
  friends: FriendProfile[];
  pendingRequests: Array<{ friendship: Friendship; profile: UserProfile }>;
  sentRequests: Array<{ friendship: Friendship; profile: UserProfile }>;
  isLoading: boolean;
  error: string | null;
}

interface FriendActions {
  loadFriends: (userId: string) => Promise<void>;
  loadPendingRequests: (userId: string) => Promise<void>;
  sendRequest: (fromUserId: string, toUserId: string) => Promise<void>;
  acceptRequest: (friendshipId: string) => Promise<void>;
  declineRequest: (friendshipId: string) => Promise<void>;
  removeFriend: (friendshipId: string) => Promise<void>;
  searchUsers: (query: string, currentUserId: string) => Promise<UserProfile[]>;
  subscribeFriends: (userId: string) => () => void;
}

type FriendStore = FriendState & FriendActions;

export const useFriendStore = create<FriendStore>((set, get) => ({
  // State
  friends: [],
  pendingRequests: [],
  sentRequests: [],
  isLoading: false,
  error: null,

  // Actions
  loadFriends: async (userId: string) => {
    try {
      if (!firebaseDatabase) {
        set({ friends: [], isLoading: false });
        return;
      }

      set({ isLoading: true, error: null });

      // Query friendships where user is involved and status is accepted
      const snapshot = await firebaseDatabase
        .ref(RTDB_PATHS.FRIENDSHIPS)
        .orderByChild(`users/${userId}`)
        .equalTo(true)
        .once('value');

      const friendProfiles: FriendProfile[] = [];

      if (snapshot.exists()) {
        const friendships = snapshot.val();

        for (const [friendshipId, friendshipData] of Object.entries(friendships) as [string, any][]) {
          if (friendshipData.status !== 'accepted') continue;

          // Find the other user's ID
          const userIds = Object.keys(friendshipData.users || {});
          const friendId = userIds.find((id: string) => id !== userId);

          if (friendId) {
            // Get friend's profile
            const userSnapshot = await firebaseDatabase
              .ref(`${RTDB_PATHS.USERS}/${friendId}`)
              .once('value');

            if (userSnapshot.exists()) {
              const userData = userSnapshot.val();
              friendProfiles.push({
                uid: userData.uid || friendId,
                username: userData.username || '',
                email: userData.email || '',
                displayName: userData.displayName || userData.username || 'Player',
                photoURL: userData.photoURL,
                createdAt: userData.createdAt ? new Date(userData.createdAt) : new Date(),
                lastOnline: userData.lastOnline ? new Date(userData.lastOnline) : new Date(),
                stats: userData.stats || { gamesPlayed: 0, gamesWon: 0, winRate: 0 },
                friendshipId,
              });
            }
          }
        }
      }

      set({ friends: friendProfiles, isLoading: false });
    } catch (error: any) {
      console.error('Load friends error:', error);
      set({ friends: [], error: error.message, isLoading: false });
    }
  },

  loadPendingRequests: async (userId: string) => {
    try {
      if (!firebaseDatabase) {
        set({ pendingRequests: [], sentRequests: [], isLoading: false });
        return;
      }

      set({ isLoading: true, error: null });

      const snapshot = await firebaseDatabase
        .ref(RTDB_PATHS.FRIENDSHIPS)
        .orderByChild(`users/${userId}`)
        .equalTo(true)
        .once('value');

      const pending: Array<{ friendship: Friendship; profile: UserProfile }> = [];
      const sent: Array<{ friendship: Friendship; profile: UserProfile }> = [];

      if (snapshot.exists()) {
        const friendships = snapshot.val();

        for (const [friendshipId, friendshipData] of Object.entries(friendships) as [string, any][]) {
          if (friendshipData.status !== 'pending') continue;

          const friendship: Friendship = {
            id: friendshipId,
            users: Object.keys(friendshipData.users || {}),
            status: friendshipData.status,
            initiatedBy: friendshipData.initiatedBy,
            createdAt: friendshipData.createdAt ? new Date(friendshipData.createdAt) : new Date(),
            acceptedAt: friendshipData.acceptedAt ? new Date(friendshipData.acceptedAt) : undefined,
          };

          const otherUserId = friendship.users.find((id: string) => id !== userId);

          if (otherUserId) {
            const userSnapshot = await firebaseDatabase
              .ref(`${RTDB_PATHS.USERS}/${otherUserId}`)
              .once('value');

            if (userSnapshot.exists()) {
              const userData = userSnapshot.val();
              const profile: UserProfile = {
                uid: userData.uid || otherUserId,
                username: userData.username || '',
                email: userData.email || '',
                displayName: userData.displayName || userData.username || 'Player',
                photoURL: userData.photoURL,
                createdAt: userData.createdAt ? new Date(userData.createdAt) : new Date(),
                lastOnline: userData.lastOnline ? new Date(userData.lastOnline) : new Date(),
                stats: userData.stats || { gamesPlayed: 0, gamesWon: 0, winRate: 0 },
              };

              if (friendshipData.initiatedBy === otherUserId) {
                pending.push({ friendship, profile });
              } else {
                sent.push({ friendship, profile });
              }
            }
          }
        }
      }

      set({ pendingRequests: pending, sentRequests: sent, isLoading: false });
    } catch (error: any) {
      console.error('Load pending requests error:', error);
      set({ pendingRequests: [], sentRequests: [], error: error.message, isLoading: false });
    }
  },

  sendRequest: async (fromUserId: string, toUserId: string) => {
    try {
      if (!firebaseDatabase) {
        throw new Error('Database not configured');
      }

      set({ isLoading: true, error: null });

      // Create friendship entry with both user IDs as keys for querying
      const friendshipRef = firebaseDatabase.ref(RTDB_PATHS.FRIENDSHIPS).push();
      await friendshipRef.set({
        users: {
          [fromUserId]: true,
          [toUserId]: true,
        },
        status: 'pending',
        initiatedBy: fromUserId,
        createdAt: new Date().toISOString(),
      });

      set({ isLoading: false });
    } catch (error: any) {
      console.error('Send friend request error:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  acceptRequest: async (friendshipId: string) => {
    try {
      if (!firebaseDatabase) {
        throw new Error('Database not configured');
      }

      set({ isLoading: true, error: null });

      await firebaseDatabase
        .ref(`${RTDB_PATHS.FRIENDSHIPS}/${friendshipId}`)
        .update({
          status: 'accepted',
          acceptedAt: new Date().toISOString(),
        });

      set({ isLoading: false });
    } catch (error: any) {
      console.error('Accept request error:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  declineRequest: async (friendshipId: string) => {
    try {
      if (!firebaseDatabase) {
        throw new Error('Database not configured');
      }

      set({ isLoading: true, error: null });

      await firebaseDatabase
        .ref(`${RTDB_PATHS.FRIENDSHIPS}/${friendshipId}`)
        .remove();

      set({ isLoading: false });
    } catch (error: any) {
      console.error('Decline request error:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  removeFriend: async (friendshipId: string) => {
    try {
      if (!firebaseDatabase) {
        throw new Error('Database not configured');
      }

      set({ isLoading: true, error: null });

      await firebaseDatabase
        .ref(`${RTDB_PATHS.FRIENDSHIPS}/${friendshipId}`)
        .remove();

      set({ isLoading: false });
    } catch (error: any) {
      console.error('Remove friend error:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  searchUsers: async (query: string, currentUserId: string) => {
    try {
      if (!query.trim() || !firebaseDatabase) {
        return [];
      }

      const searchQuery = query.toLowerCase().trim();

      // Search users by username prefix
      const snapshot = await firebaseDatabase
        .ref(RTDB_PATHS.USERS)
        .orderByChild('username')
        .startAt(searchQuery)
        .endAt(searchQuery + '\uf8ff')
        .limitToFirst(10)
        .once('value');

      const users: UserProfile[] = [];

      if (snapshot.exists()) {
        snapshot.forEach((child) => {
          const userData = child.val();

          // Skip current user
          if (userData.uid === currentUserId || child.key === currentUserId) {
            return;
          }

          users.push({
            uid: userData.uid || child.key!,
            username: userData.username || '',
            email: userData.email || '',
            displayName: userData.displayName || userData.username || 'Player',
            photoURL: userData.photoURL,
            createdAt: userData.createdAt ? new Date(userData.createdAt) : new Date(),
            lastOnline: userData.lastOnline ? new Date(userData.lastOnline) : new Date(),
            stats: userData.stats || { gamesPlayed: 0, gamesWon: 0, winRate: 0 },
          });
        });
      }

      return users;
    } catch (error: any) {
      console.error('Search users error:', error);
      throw error;
    }
  },

  subscribeFriends: (userId: string) => {
    if (!firebaseDatabase) {
      return () => {};
    }

    // Real-time listener for friendships
    const ref = firebaseDatabase
      .ref(RTDB_PATHS.FRIENDSHIPS)
      .orderByChild(`users/${userId}`)
      .equalTo(true);

    const callback = ref.on('value', () => {
      // Reload friends when changes occur
      get().loadFriends(userId);
      get().loadPendingRequests(userId);
    });

    return () => ref.off('value', callback);
  },
}));
