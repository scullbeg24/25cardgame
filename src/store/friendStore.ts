/**
 * Friend Store
 * Manages friend relationships and friend requests.
 *
 * NOTE: Previously built on Firestore which has been removed.
 * All methods are stubbed — friend features will be rebuilt on RTDB
 * in a future update.
 */

import { create } from "zustand";
import type { UserProfile } from "./authStore";

export interface Friendship {
  id: string;
  users: string[];
  status: "pending" | "accepted" | "blocked";
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

export const useFriendStore = create<FriendStore>((set, _get) => ({
  friends: [],
  pendingRequests: [],
  sentRequests: [],
  isLoading: false,
  error: null,

  loadFriends: async (_userId: string) => {
    // Stubbed — Firestore removed
    set({ friends: [], isLoading: false });
  },

  loadPendingRequests: async (_userId: string) => {
    set({ pendingRequests: [], sentRequests: [], isLoading: false });
  },

  sendRequest: async (_fromUserId: string, _toUserId: string) => {
    set({ error: "Friends feature is not yet available" });
    throw new Error("Friends feature is not yet available");
  },

  acceptRequest: async (_friendshipId: string) => {
    set({ error: "Friends feature is not yet available" });
    throw new Error("Friends feature is not yet available");
  },

  declineRequest: async (_friendshipId: string) => {
    set({ error: "Friends feature is not yet available" });
    throw new Error("Friends feature is not yet available");
  },

  removeFriend: async (_friendshipId: string) => {
    set({ error: "Friends feature is not yet available" });
    throw new Error("Friends feature is not yet available");
  },

  searchUsers: async (_query: string, _currentUserId: string) => {
    return [];
  },

  subscribeFriends: (_userId: string) => {
    return () => {};
  },
}));
