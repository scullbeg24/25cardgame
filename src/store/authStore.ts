/**
 * Authentication Store
 * Manages user authentication state using Firebase Auth
 */

import { create } from 'zustand';
import { firebaseAuth, firebaseFirestore, COLLECTIONS } from '../config/firebase.config';
import type { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { presenceService } from '../services/presenceService';

export interface UserProfile {
  uid: string;
  username: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: Date;
  lastOnline: Date;
  stats: {
    gamesPlayed: number;
    gamesWon: number;
    winRate: number;
  };
}

interface AuthState {
  user: FirebaseAuthTypes.User | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

interface AuthActions {
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  setUser: (user: FirebaseAuthTypes.User | null) => void;
  loadUserProfile: (uid: string) => Promise<void>;
  initialize: () => () => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>((set, get) => ({
  // State
  user: null,
  userProfile: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,

  // Actions
  signUp: async (email: string, password: string, username: string) => {
    try {
      set({ isLoading: true, error: null });

      // Check if username is already taken
      const usernameQuery = await firebaseFirestore
        .collection(COLLECTIONS.USERS)
        .where('username', '==', username.toLowerCase())
        .get();

      if (!usernameQuery.empty) {
        throw new Error('Username is already taken');
      }

      // Create Firebase Auth user
      const userCredential = await firebaseAuth.createUserWithEmailAndPassword(
        email,
        password
      );

      const user = userCredential.user;

      // Update display name
      await user.updateProfile({
        displayName: username,
      });

      // Create user profile in Firestore
      const userProfile: UserProfile = {
        uid: user.uid,
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        displayName: username,
        photoURL: undefined,
        createdAt: new Date(),
        lastOnline: new Date(),
        stats: {
          gamesPlayed: 0,
          gamesWon: 0,
          winRate: 0,
        },
      };

      await firebaseFirestore
        .collection(COLLECTIONS.USERS)
        .doc(user.uid)
        .set(userProfile);

      set({
        user,
        userProfile,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      console.error('Sign up error:', error);
      set({
        error: error.message || 'Failed to sign up',
        isLoading: false,
      });
      throw error;
    }
  },

  signIn: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null });

      const userCredential = await firebaseAuth.signInWithEmailAndPassword(
        email,
        password
      );

      const user = userCredential.user;

      // Load user profile
      await get().loadUserProfile(user.uid);

      // Update last online
      await firebaseFirestore
        .collection(COLLECTIONS.USERS)
        .doc(user.uid)
        .update({
          lastOnline: new Date(),
        });

      // Start presence tracking
      presenceService.start(user.uid);

      set({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      console.error('Sign in error:', error);
      set({
        error: error.message || 'Failed to sign in',
        isLoading: false,
      });
      throw error;
    }
  },

  signOut: async () => {
    try {
      set({ isLoading: true, error: null });

      // Update last online before signing out
      const { user } = get();
      if (user) {
        await firebaseFirestore
          .collection(COLLECTIONS.USERS)
          .doc(user.uid)
          .update({
            lastOnline: new Date(),
          });
      }

      // Stop presence tracking
      presenceService.stop();

      await firebaseAuth.signOut();

      set({
        user: null,
        userProfile: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (error: any) {
      console.error('Sign out error:', error);
      set({
        error: error.message || 'Failed to sign out',
        isLoading: false,
      });
      throw error;
    }
  },

  updateProfile: async (updates: Partial<UserProfile>) => {
    try {
      const { user, userProfile } = get();
      if (!user || !userProfile) {
        throw new Error('No user logged in');
      }

      set({ isLoading: true, error: null });

      // Update Firebase Auth profile if displayName is changing
      if (updates.displayName && updates.displayName !== user.displayName) {
        await user.updateProfile({
          displayName: updates.displayName,
        });
      }

      // Update Firestore profile
      await firebaseFirestore
        .collection(COLLECTIONS.USERS)
        .doc(user.uid)
        .update(updates);

      // Update local state
      set({
        userProfile: {
          ...userProfile,
          ...updates,
        },
        isLoading: false,
      });
    } catch (error: any) {
      console.error('Update profile error:', error);
      set({
        error: error.message || 'Failed to update profile',
        isLoading: false,
      });
      throw error;
    }
  },

  resetPassword: async (email: string) => {
    try {
      set({ isLoading: true, error: null });
      await firebaseAuth.sendPasswordResetEmail(email);
      set({ isLoading: false });
    } catch (error: any) {
      console.error('Reset password error:', error);
      set({
        error: error.message || 'Failed to send reset email',
        isLoading: false,
      });
      throw error;
    }
  },

  setUser: (user: FirebaseAuthTypes.User | null) => {
    set({
      user,
      isAuthenticated: !!user,
    });
  },

  loadUserProfile: async (uid: string) => {
    try {
      const doc = await firebaseFirestore
        .collection(COLLECTIONS.USERS)
        .doc(uid)
        .get();

      if (doc.exists) {
        const data = doc.data();
        const userProfile: UserProfile = {
          uid: data!.uid,
          username: data!.username,
          email: data!.email,
          displayName: data!.displayName,
          photoURL: data!.photoURL,
          createdAt: data!.createdAt?.toDate() || new Date(),
          lastOnline: data!.lastOnline?.toDate() || new Date(),
          stats: data!.stats || {
            gamesPlayed: 0,
            gamesWon: 0,
            winRate: 0,
          },
        };

        set({ userProfile });
      }
    } catch (error) {
      console.error('Load user profile error:', error);
    }
  },

  initialize: () => {
    // Listen for auth state changes
    const unsubscribe = firebaseAuth.onAuthStateChanged(async (user) => {
      if (user) {
        // User is signed in
        await get().loadUserProfile(user.uid);
        
        // Start presence tracking
        presenceService.start(user.uid);
        
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        // User is signed out
        presenceService.stop();
        
        set({
          user: null,
          userProfile: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    });

    // Return unsubscribe function for cleanup
    return unsubscribe;
  },
}));
