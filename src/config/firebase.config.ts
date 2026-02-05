/**
 * Firebase Configuration
 * 
 * SETUP INSTRUCTIONS:
 * 1. Create a Firebase project at https://console.firebase.google.com
 * 2. Add an iOS app and download GoogleService-Info.plist to the project root
 * 3. Add an Android app and download google-services.json to the project root
 * 4. Enable Authentication with Email/Password in Firebase Console
 * 5. Create a Firestore Database in production mode
 * 6. Create a Realtime Database in locked mode
 * 7. Replace the config values below with your Firebase project credentials
 */

import { FirebaseApp } from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import database from '@react-native-firebase/database';

// Firebase automatically initializes using google-services.json (Android)
// and GoogleService-Info.plist (iOS) when using React Native Firebase

/**
 * Firebase Authentication instance
 */
export const firebaseAuth = auth();

/**
 * Firestore Database instance
 * Used for: User profiles, friend relationships, game rooms
 */
export const firebaseFirestore = firestore();

/**
 * Realtime Database instance
 * Used for: Live game state, player presence
 */
export const firebaseDatabase = database();

/**
 * Initialize Firebase services
 * Call this once when the app starts
 */
export const initializeFirebase = async () => {
  try {
    // Enable Firestore offline persistence
    await firebaseFirestore.settings({
      persistence: true,
    });

    console.log('Firebase initialized successfully');
  } catch (error) {
    console.error('Firebase initialization error:', error);
  }
};

// Firestore collection names
export const COLLECTIONS = {
  USERS: 'users',
  FRIENDSHIPS: 'friendships',
  GAME_ROOMS: 'gameRooms',
  NOTIFICATIONS: 'notifications',
} as const;

// Realtime Database paths
export const RTDB_PATHS = {
  GAMES: 'games',
  PRESENCE: 'presence',
} as const;
