/**
 * Authentication Store
 * Manages user authentication state using Firebase Auth
 */

import { create } from 'zustand';
import { firebaseAuth, firebaseDatabase, RTDB_PATHS } from '../config/firebase.config';
import type { FirebaseAuthTypes } from '@react-native-firebase/auth';

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
  loadUserProfile: (uid: string, authUser?: FirebaseAuthTypes.User) => Promise<void>;
  initialize: () => () => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>((set, get) => ({
  // State
  user: null,
  userProfile: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,

  // Actions
  signUp: async (email: string, password: string, username: string) => {
    try {
      if (!firebaseAuth) {
        throw new Error('Firebase Auth not configured');
      }

      set({ isLoading: true, error: null });

      console.log('[Auth] SIMPLE AUTH ONLY - Creating user:', email);
      
      // ONLY CREATE AUTH USER - NO DATABASE AT ALL
      const userCredential = await firebaseAuth.createUserWithEmailAndPassword(
        email,
        password
      );

      const user = userCredential.user;
      console.log('[Auth] SUCCESS! User created:', user.uid);

      // Update display name
      await user.updateProfile({
        displayName: username,
      });

      // Create MINIMAL user profile - NO DATABASE
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

      console.log('[Auth] REGISTRATION COMPLETE - NO DATABASE USED');

      set({
        user,
        userProfile,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      console.error('[Auth] Registration failed:', error);
      set({
        error: error.message || 'Failed to sign up',
        isLoading: false,
      });
      throw error;
    }
  },

  signIn: async (email: string, password: string) => {
    try {
      if (!firebaseAuth) {
        throw new Error('Firebase Auth not configured');
      }

      set({ isLoading: true, error: null });

      const userCredential = await firebaseAuth.signInWithEmailAndPassword(
        email,
        password
      );

      const user = userCredential.user;

      // Load user profile (with fallback)
      await get().loadUserProfile(user.uid, user);

      // Update last online (optional - may fail if database not set up)
      if (firebaseDatabase) {
        try {
          await firebaseDatabase
            .ref(`${RTDB_PATHS.USERS}/${user.uid}`)
            .update({
              lastOnline: new Date().toISOString(),
            });
        } catch (dbError) {
          console.warn('[Auth] Could not update lastOnline:', dbError);
        }
      }

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
      if (!firebaseAuth) {
        throw new Error('Firebase not configured');
      }

      set({ isLoading: true, error: null });

      // Update last online before signing out (optional)
      const { user } = get();
      if (user && firebaseDatabase) {
        try {
          await firebaseDatabase
            .ref(`${RTDB_PATHS.USERS}/${user.uid}`)
            .update({
              lastOnline: new Date().toISOString(),
            });
        } catch (dbError) {
          console.warn('[Auth] Could not update lastOnline:', dbError);
        }
      }

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

      if (!firebaseDatabase) {
        throw new Error('Firebase not configured');
      }

      set({ isLoading: true, error: null });

      // Update Firebase Auth profile if displayName is changing
      if (updates.displayName && updates.displayName !== user.displayName) {
        await user.updateProfile({
          displayName: updates.displayName,
        });
      }

      // Update Realtime Database profile
      await firebaseDatabase
        .ref(`${RTDB_PATHS.USERS}/${user.uid}`)
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
      if (!firebaseAuth) {
        throw new Error('Firebase not configured');
      }

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

  loadUserProfile: async (uid: string, authUser?: FirebaseAuthTypes.User) => {
    try {
      if (firebaseDatabase) {
        try {
          const snapshot = await Promise.race([
            firebaseDatabase.ref(`${RTDB_PATHS.USERS}/${uid}`).once('value'),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('timeout')), 3000)
            ),
          ]) as any;

          if (snapshot?.exists?.()) {
            const data = snapshot.val();
            const userProfile: UserProfile = {
              uid: data.uid,
              username: data.username,
              email: data.email,
              displayName: data.displayName,
              photoURL: data.photoURL,
              createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
              lastOnline: data.lastOnline ? new Date(data.lastOnline) : new Date(),
              stats: data.stats || {
                gamesPlayed: 0,
                gamesWon: 0,
                winRate: 0,
              },
            };
            set({ userProfile });
            return;
          }
        } catch (dbError) {
          console.warn('[Auth] Could not load profile from database:', dbError);
        }
      }

      // Fallback: create minimal profile from Auth user
      if (authUser) {
        const userProfile: UserProfile = {
          uid: authUser.uid,
          username: (authUser.displayName || authUser.email || 'user').toLowerCase(),
          email: authUser.email || '',
          displayName: authUser.displayName || 'User',
          photoURL: authUser.photoURL ?? undefined,
          createdAt: new Date(),
          lastOnline: new Date(),
          stats: { gamesPlayed: 0, gamesWon: 0, winRate: 0 },
        };
        set({ userProfile });
      }
    } catch (error) {
      console.error('Load user profile error:', error);
    }
  },

  initialize: () => {
    // Check if Firebase is configured
    if (!firebaseAuth) {
      console.warn('Firebase not configured, skipping auth initialization');
      set({ isLoading: false, isAuthenticated: false });
      return () => {};
    }

    // Listen for auth state changes
    const unsubscribe = firebaseAuth.onAuthStateChanged((user) => {
      try {
        if (user) {
          get().loadUserProfile(user.uid, user);
          // presenceService.start(user.uid); // Disabled - database permission issues
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          set({
            user: null,
            userProfile: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      } catch (error) {
        console.error('[Auth] State change error:', error);
        set({ isLoading: false });
      }
    });

    return unsubscribe;
  },
}));
