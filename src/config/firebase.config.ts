/**
 * Firebase Configuration
 */

import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';

/**
 * Get Firebase Authentication instance (safe)
 */
export const getFirebaseAuth = () => {
  try {
    return auth();
  } catch (error) {
    console.warn('Firebase Auth not initialized:', error);
    return null;
  }
};

/**
 * Get Realtime Database instance (safe)
 */
export const getFirebaseDatabase = () => {
  try {
    return database();
  } catch (error) {
    console.warn('Firebase Database not initialized:', error);
    return null;
  }
};

// Firebase instances - may be null if not configured
export const firebaseAuth = getFirebaseAuth();
export const firebaseDatabase = getFirebaseDatabase();

/**
 * Initialize Firebase services
 */
export const initializeFirebase = async () => {
  console.log('[Firebase] Initialized');
};

// Realtime Database paths
export const RTDB_PATHS = {
  GAMES: 'games',
  PRESENCE: 'presence',
  USERS: 'users',
  FRIENDSHIPS: 'friendships',
  GAME_ROOMS: 'gameRooms',
  NOTIFICATIONS: 'notifications',
} as const;
