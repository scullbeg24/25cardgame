/**
 * Game Presence Service
 * Tracks player connection status during active games
 */

import { firebaseDatabase, RTDB_PATHS } from '../config/firebase.config';

export class GamePresenceService {
  private gameId: string | null = null;
  private userId: string | null = null;
  private connectedRef: any = null;
  private presenceRef: any = null;

  /**
   * Start tracking presence for a specific game
   */
  start(gameId: string, userId: string) {
    if (!firebaseDatabase) return;
    this.gameId = gameId;
    this.userId = userId;

    this.presenceRef = firebaseDatabase.ref(
      `${RTDB_PATHS.GAMES}/${gameId}/players/${userId}/connected`
    );
    this.connectedRef = firebaseDatabase.ref('.info/connected');

    // Set up connection state listener
    this.connectedRef.on('value', (snapshot: any) => {
      if (snapshot.val() === true) {
        // We're connected
        this.presenceRef.set(true);

        // When we disconnect, update the status
        this.presenceRef.onDisconnect().set(false);
      }
    });
  }

  /**
   * Stop tracking presence
   */
  stop() {
    if (this.connectedRef) {
      this.connectedRef.off();
      this.connectedRef = null;
    }

    if (this.presenceRef) {
      // Set as disconnected before cleaning up
      this.presenceRef.set(false);
      this.presenceRef = null;
    }

    this.gameId = null;
    this.userId = null;
  }

  /**
   * Subscribe to a player's connection status in a game
   */
  static subscribeToPlayerConnection(
    gameId: string,
    userId: string,
    callback: (connected: boolean) => void
  ): () => void {
    if (!firebaseDatabase) return () => {};
    const ref = firebaseDatabase.ref(
      `${RTDB_PATHS.GAMES}/${gameId}/players/${userId}/connected`
    );

    const listener = ref.on('value', (snapshot: any) => {
      callback(snapshot.val() === true);
    });

    return () => {
      ref.off('value', listener);
    };
  }

  /**
   * Subscribe to all players' connection status in a game
   */
  static subscribeToAllPlayersConnection(
    gameId: string,
    callback: (players: Record<string, boolean>) => void
  ): () => void {
    if (!firebaseDatabase) return () => {};
    const ref = firebaseDatabase.ref(`${RTDB_PATHS.GAMES}/${gameId}/players`);

    const listener = ref.on('value', (snapshot: any) => {
      const players = snapshot.val();
      if (!players) {
        callback({});
        return;
      }

      const connectionStatus: Record<string, boolean> = {};
      Object.keys(players).forEach((userId) => {
        connectionStatus[userId] = players[userId].connected === true;
      });

      callback(connectionStatus);
    });

    return () => {
      ref.off('value', listener);
    };
  }

  /**
   * Handle player forfeit (mark game as finished)
   */
  static async forfeitGame(
    gameId: string,
    userId: string,
    reason: 'disconnect' | 'manual'
  ): Promise<void> {
    if (!firebaseDatabase) return;
    try {
      const gameRef = firebaseDatabase.ref(`${RTDB_PATHS.GAMES}/${gameId}`);
      
      // Get current game state
      const snapshot = await gameRef.once('value');
      const gameData = snapshot.val();
      
      if (!gameData) {
        throw new Error('Game not found');
      }

      // Find the forfeiting player's team
      const forfeitingPlayer = gameData.players[userId];
      if (!forfeitingPlayer) {
        throw new Error('Player not found in game');
      }

      const forfeitingTeam = forfeitingPlayer.teamId;
      const winningTeam = forfeitingTeam === 1 ? 2 : 1;

      // Update game state
      await gameRef.update({
        'state/gamePhase': 'gameOver',
        'state/handsWon': {
          team1: winningTeam === 1 ? 5 : 0,
          team2: winningTeam === 2 ? 5 : 0,
        },
        'metadata/forfeit': {
          userId,
          reason,
          timestamp: Date.now(),
        },
        'metadata/lastUpdated': Date.now(),
      });
    } catch (error) {
      console.error('Forfeit game error:', error);
      throw error;
    }
  }

  /**
   * Check if enough players are connected to continue
   */
  static async checkMinimumPlayers(gameId: string): Promise<boolean> {
    if (!firebaseDatabase) return false;
    try {
      const ref = firebaseDatabase.ref(`${RTDB_PATHS.GAMES}/${gameId}/players`);
      const snapshot = await ref.once('value');
      const players = snapshot.val();

      if (!players) {
        return false;
      }

      // Count connected players
      const connectedCount = Object.values(players).filter(
        (p: any) => p.connected === true
      ).length;

      // Need at least 2 players to continue
      return connectedCount >= 2;
    } catch (error) {
      console.error('Check minimum players error:', error);
      return false;
    }
  }
}

// Export a singleton instance
export const gamePresenceService = new GamePresenceService();
