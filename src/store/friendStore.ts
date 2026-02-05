/**
 * Friend Store
 * Manages friend relationships and friend requests using Firestore
 */

import { create } from 'zustand';
import { firebaseFirestore, COLLECTIONS } from '../config/firebase.config';
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
      set({ isLoading: true, error: null });

      // Query friendships where user is involved and status is accepted
      const friendshipsSnapshot = await firebaseFirestore
        .collection(COLLECTIONS.FRIENDSHIPS)
        .where('users', 'array-contains', userId)
        .where('status', '==', 'accepted')
        .get();

      const friendProfiles: FriendProfile[] = [];

      for (const doc of friendshipsSnapshot.docs) {
        const friendshipData = doc.data();
        const friendId = friendshipData.users.find((id: string) => id !== userId);

        if (friendId) {
          // Get friend's profile
          const userDoc = await firebaseFirestore
            .collection(COLLECTIONS.USERS)
            .doc(friendId)
            .get();

          if (userDoc.exists) {
            const userData = userDoc.data()!;
            friendProfiles.push({
              uid: userData.uid,
              username: userData.username,
              email: userData.email,
              displayName: userData.displayName,
              photoURL: userData.photoURL,
              createdAt: userData.createdAt?.toDate() || new Date(),
              lastOnline: userData.lastOnline?.toDate() || new Date(),
              stats: userData.stats || { gamesPlayed: 0, gamesWon: 0, winRate: 0 },
              friendshipId: doc.id,
            });
          }
        }
      }

      set({ friends: friendProfiles, isLoading: false });
    } catch (error: any) {
      console.error('Load friends error:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  loadPendingRequests: async (userId: string) => {
    try {
      set({ isLoading: true, error: null });

      // Get incoming pending requests (initiated by others)
      const incomingSnapshot = await firebaseFirestore
        .collection(COLLECTIONS.FRIENDSHIPS)
        .where('users', 'array-contains', userId)
        .where('status', '==', 'pending')
        .get();

      const pending: Array<{ friendship: Friendship; profile: UserProfile }> = [];
      const sent: Array<{ friendship: Friendship; profile: UserProfile }> = [];

      for (const doc of incomingSnapshot.docs) {
        const friendshipData = doc.data();
        const friendship: Friendship = {
          id: doc.id,
          users: friendshipData.users,
          status: friendshipData.status,
          initiatedBy: friendshipData.initiatedBy,
          createdAt: friendshipData.createdAt?.toDate() || new Date(),
          acceptedAt: friendshipData.acceptedAt?.toDate(),
        };

        const otherUserId = friendshipData.users.find((id: string) => id !== userId);
        
        if (otherUserId) {
          const userDoc = await firebaseFirestore
            .collection(COLLECTIONS.USERS)
            .doc(otherUserId)
            .get();

          if (userDoc.exists) {
            const userData = userDoc.data()!;
            const profile: UserProfile = {
              uid: userData.uid,
              username: userData.username,
              email: userData.email,
              displayName: userData.displayName,
              photoURL: userData.photoURL,
              createdAt: userData.createdAt?.toDate() || new Date(),
              lastOnline: userData.lastOnline?.toDate() || new Date(),
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

      set({ pendingRequests: pending, sentRequests: sent, isLoading: false });
    } catch (error: any) {
      console.error('Load pending requests error:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  sendRequest: async (fromUserId: string, toUserId: string) => {
    try {
      set({ isLoading: true, error: null });

      // Check if friendship already exists
      const users = [fromUserId, toUserId].sort();
      const existingSnapshot = await firebaseFirestore
        .collection(COLLECTIONS.FRIENDSHIPS)
        .where('users', '==', users)
        .get();

      if (!existingSnapshot.empty) {
        throw new Error('Friend request already exists');
      }

      // Create friendship document
      await firebaseFirestore.collection(COLLECTIONS.FRIENDSHIPS).add({
        users,
        status: 'pending',
        initiatedBy: fromUserId,
        createdAt: new Date(),
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
      set({ isLoading: true, error: null });

      await firebaseFirestore
        .collection(COLLECTIONS.FRIENDSHIPS)
        .doc(friendshipId)
        .update({
          status: 'accepted',
          acceptedAt: new Date(),
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
      set({ isLoading: true, error: null });

      await firebaseFirestore
        .collection(COLLECTIONS.FRIENDSHIPS)
        .doc(friendshipId)
        .delete();

      set({ isLoading: false });
    } catch (error: any) {
      console.error('Decline request error:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  removeFriend: async (friendshipId: string) => {
    try {
      set({ isLoading: true, error: null });

      await firebaseFirestore
        .collection(COLLECTIONS.FRIENDSHIPS)
        .doc(friendshipId)
        .delete();

      set({ isLoading: false });
    } catch (error: any) {
      console.error('Remove friend error:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  searchUsers: async (query: string, currentUserId: string) => {
    try {
      if (!query.trim()) {
        return [];
      }

      const searchQuery = query.toLowerCase().trim();

      // Search by username (exact match or starts with)
      const usersSnapshot = await firebaseFirestore
        .collection(COLLECTIONS.USERS)
        .where('username', '>=', searchQuery)
        .where('username', '<=', searchQuery + '\uf8ff')
        .limit(10)
        .get();

      const users: UserProfile[] = [];

      for (const doc of usersSnapshot.docs) {
        const userData = doc.data();
        
        // Skip current user
        if (userData.uid === currentUserId) {
          continue;
        }

        users.push({
          uid: userData.uid,
          username: userData.username,
          email: userData.email,
          displayName: userData.displayName,
          photoURL: userData.photoURL,
          createdAt: userData.createdAt?.toDate() || new Date(),
          lastOnline: userData.lastOnline?.toDate() || new Date(),
          stats: userData.stats || { gamesPlayed: 0, gamesWon: 0, winRate: 0 },
        });
      }

      return users;
    } catch (error: any) {
      console.error('Search users error:', error);
      throw error;
    }
  },

  subscribeFriends: (userId: string) => {
    // Real-time listener for friends
    const unsubscribe = firebaseFirestore
      .collection(COLLECTIONS.FRIENDSHIPS)
      .where('users', 'array-contains', userId)
      .onSnapshot(
        (snapshot) => {
          // Reload friends when changes occur
          get().loadFriends(userId);
          get().loadPendingRequests(userId);
        },
        (error) => {
          console.error('Friends subscription error:', error);
        }
      );

    return unsubscribe;
  },
}));
