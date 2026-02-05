/**
 * Presence Service
 * Tracks user online/offline status using Firebase Realtime Database
 */

import { AppState, AppStateStatus } from 'react-native';
import { firebaseDatabase, firebaseFirestore, RTDB_PATHS, COLLECTIONS } from '../config/firebase.config';

export class PresenceService {
  private userId: string | null = null;
  private presenceRef: any = null;
  private connectedRef: any = null;
  private appStateSubscription: any = null;

  /**
   * Initialize presence tracking for a user
   */
  start(userId: string) {
    this.userId = userId;
    this.presenceRef = firebaseDatabase.ref(`${RTDB_PATHS.PRESENCE}/${userId}`);
    this.connectedRef = firebaseDatabase.ref('.info/connected');

    // Set up connection state listener
    this.connectedRef.on('value', (snapshot: any) => {
      if (snapshot.val() === true) {
        // We're connected (or reconnected)
        this.setOnline();

        // When we disconnect, update the status
        this.presenceRef.onDisconnect().update({
          online: false,
          lastSeen: firebaseDatabase.ServerValue.TIMESTAMP,
        });
      }
    });

    // Listen for app state changes (foreground/background)
    this.appStateSubscription = AppState.addEventListener(
      'change',
      this.handleAppStateChange
    );

    // Set initial online status
    this.setOnline();
  }

  /**
   * Stop presence tracking
   */
  stop() {
    if (this.connectedRef) {
      this.connectedRef.off();
      this.connectedRef = null;
    }

    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }

    if (this.presenceRef && this.userId) {
      this.setOffline();
      this.presenceRef = null;
    }

    this.userId = null;
  }

  /**
   * Set user as online
   */
  private setOnline() {
    if (!this.presenceRef) return;

    this.presenceRef.update({
      online: true,
      lastSeen: firebaseDatabase.ServerValue.TIMESTAMP,
    });

    // Also update Firestore for persistent last online
    if (this.userId) {
      firebaseFirestore
        .collection(COLLECTIONS.USERS)
        .doc(this.userId)
        .update({
          lastOnline: new Date(),
        })
        .catch((error) => {
          console.error('Failed to update Firestore last online:', error);
        });
    }
  }

  /**
   * Set user as offline
   */
  private setOffline() {
    if (!this.presenceRef) return;

    this.presenceRef.update({
      online: false,
      lastSeen: firebaseDatabase.ServerValue.TIMESTAMP,
    });
  }

  /**
   * Handle app state changes (foreground/background)
   */
  private handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (nextAppState === 'active') {
      // App came to foreground
      this.setOnline();
    } else if (nextAppState === 'background' || nextAppState === 'inactive') {
      // App went to background
      this.setOffline();
    }
  };

  /**
   * Get online status for a specific user
   */
  static async getOnlineStatus(userId: string): Promise<boolean> {
    try {
      const snapshot = await firebaseDatabase
        .ref(`${RTDB_PATHS.PRESENCE}/${userId}`)
        .once('value');
      
      return snapshot.val()?.online || false;
    } catch (error) {
      console.error('Failed to get online status:', error);
      return false;
    }
  }

  /**
   * Subscribe to online status changes for a user
   */
  static subscribeToOnlineStatus(
    userId: string,
    callback: (isOnline: boolean) => void
  ): () => void {
    const ref = firebaseDatabase.ref(`${RTDB_PATHS.PRESENCE}/${userId}`);
    
    const listener = ref.on('value', (snapshot: any) => {
      callback(snapshot.val()?.online || false);
    });

    // Return unsubscribe function
    return () => {
      ref.off('value', listener);
    };
  }

  /**
   * Subscribe to online status for multiple users
   */
  static subscribeToMultipleUsers(
    userIds: string[],
    callback: (userId: string, isOnline: boolean) => void
  ): () => void {
    const unsubscribers: Array<() => void> = [];

    userIds.forEach((userId) => {
      const unsubscribe = PresenceService.subscribeToOnlineStatus(userId, (isOnline) => {
        callback(userId, isOnline);
      });
      unsubscribers.push(unsubscribe);
    });

    // Return function to unsubscribe from all
    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }
}

// Export a singleton instance
export const presenceService = new PresenceService();
