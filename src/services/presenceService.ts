/**
 * Presence Service
 * Tracks user online/offline status using Firebase Realtime Database
 * 
 * TEMPORARILY DISABLED - Database permissions not configured
 */

export class PresenceService {
  start(userId: string) {
    // Disabled - database permissions not configured
    console.log('[Presence] Disabled - skipping start for:', userId);
  }

  stop() {
    // Disabled - database permissions not configured
    console.log('[Presence] Disabled - skipping stop');
  }

  static async getOnlineStatus(userId: string): Promise<boolean> {
    return false;
  }

  static subscribeToOnlineStatus(
    userId: string,
    callback: (isOnline: boolean) => void
  ): () => void {
    return () => {};
  }

  static subscribeToMultipleUsers(
    userIds: string[],
    callback: (userId: string, isOnline: boolean) => void
  ): () => void {
    return () => {};
  }
}

// Export a singleton instance
export const presenceService = new PresenceService();
