/**
 * Multiplayer Game Store
 * Manages online multiplayer game state synchronization via Firebase Realtime Database
 */

import { create } from 'zustand';
import { firebaseDatabase, RTDB_PATHS } from '../config/firebase.config';
import type { Card, Suit } from '../game-logic/cards';
import type { GamePhase, TrickCard } from './gameStore';
import type { RuleOptions } from '../game-logic/rules';
import type { GameRoom } from './roomStore';
import { dealCards, dealFromPack, getTrumpSuitFromCard } from '../game-logic/deck';
import { 
  isLegalPlay, 
  getValidMoves, 
  findPlayersWhoCanRob,
  isTrumpCardAce 
} from '../game-logic/rules';
import {
  getTrickWinner,
  addTrickPoints,
  checkHandWinner,
  checkGameWinner,
  createInitialScores,
  createInitialHandsWon,
  POINTS_PER_TRICK,
  type Scores,
  type HandsWon,
} from '../game-logic/scoring';

export interface MultiplayerGameState {
  gamePhase: GamePhase;
  currentPlayer: number;
  currentTrick: TrickCard[];
  ledSuit: Suit | null;
  trumpSuit: Suit;
  trumpCard: Card | null;
  scores: Scores;
  handsWon: HandsWon;
  dealer: number;
  firstPlayerThisTrick: number;
  robberIndex: number;
  playersWhoCanRob: number[];
  robbed: boolean;
  trumpCardIsAce: boolean;
  pack: Card[];
}

export interface MultiplayerPlayer {
  userId: string;
  hand: Card[];
  slot: number;
  teamId: 1 | 2;
  displayName: string;
  connected: boolean;
}

interface MultiplayerStoreState {
  gameId: string | null;
  isMultiplayer: boolean;
  myPlayerSlot: number;
  gameState: MultiplayerGameState | null;
  players: Record<string, MultiplayerPlayer>;
  myHand: Card[];
  validMoves: Card[];
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error';
  error: string | null;
}

interface MultiplayerStoreActions {
  initMultiplayerGame: (room: GameRoom, currentUserId: string) => Promise<void>;
  syncGameState: () => void;
  playCardOnline: (card: Card) => Promise<void>;
  robPackOnline: (cardToDiscard: Card) => Promise<void>;
  declineRobOnline: () => Promise<void>;
  handleTrickComplete: (gameId: string) => Promise<void>;
  subscribeToGame: (gameId: string, userId: string) => () => void;
  cleanup: () => void;
}

type MultiplayerStore = MultiplayerStoreState & MultiplayerStoreActions;

export const useMultiplayerGameStore = create<MultiplayerStore>((set, get) => ({
  // State
  gameId: null,
  isMultiplayer: false,
  myPlayerSlot: 0,
  gameState: null,
  players: {},
  myHand: [],
  validMoves: [],
  syncStatus: 'idle',
  error: null,

  // Actions
  initMultiplayerGame: async (room: GameRoom, currentUserId: string) => {
    try {
      set({ syncStatus: 'syncing', error: null });

      // Generate game ID
      const gameId = `game_${room.id}_${Date.now()}`;
      const gameRef = firebaseDatabase.ref(`${RTDB_PATHS.GAMES}/${gameId}`);

      // Find my player slot
      const myPlayer = room.players.find(p => p.userId === currentUserId);
      if (!myPlayer) {
        throw new Error('Player not found in room');
      }

      // Deal cards
      const dealResult = dealCards();
      const { hands, trumpCard, pack } = dealResult;
      const trumpSuit = getTrumpSuitFromCard(trumpCard);

      // Determine dealer (random for first game)
      const dealer = Math.floor(Math.random() * room.players.length);
      const firstPlayer = (dealer + 1) % room.players.length;

      // Check for robbing
      const playersWhoCanRob = findPlayersWhoCanRob(
        hands,
        trumpCard,
        dealer,
        room.ruleOptions,
        room.players.length
      );
      const trumpCardIsAce = isTrumpCardAce(trumpCard);

      // Initialize game state
      const initialGameState: MultiplayerGameState = {
        gamePhase: playersWhoCanRob.length > 0 ? 'robbing' : 'playing',
        currentPlayer: playersWhoCanRob.length > 0 ? playersWhoCanRob[0] : firstPlayer,
        currentTrick: [],
        ledSuit: null,
        trumpSuit,
        trumpCard,
        scores: createInitialScores(room.players.length),
        handsWon: createInitialHandsWon(room.players.length),
        dealer,
        firstPlayerThisTrick: firstPlayer,
        robberIndex: playersWhoCanRob.length > 0 ? playersWhoCanRob[0] : -1,
        playersWhoCanRob,
        robbed: false,
        trumpCardIsAce,
        pack,
      };

      // Create players data
      const players: Record<string, any> = {};
      room.players.forEach((player, index) => {
        players[player.userId] = {
          hand: hands[index],
          slot: index,
          teamId: player.teamId,
          displayName: player.displayName,
          connected: true,
        };
      });

      // Write to Firebase
      await gameRef.set({
        state: initialGameState,
        players,
        metadata: {
          roomId: room.id,
          createdAt: Date.now(),
          lastUpdated: Date.now(),
        },
      });

      // Set local state
      set({
        gameId,
        isMultiplayer: true,
        myPlayerSlot: myPlayer.slot,
        gameState: initialGameState,
        players,
        myHand: hands[myPlayer.slot],
        validMoves: [],
        syncStatus: 'synced',
      });

      // Subscribe to updates
      const unsubscribe = get().subscribeToGame(gameId, currentUserId);

      console.log('Multiplayer game initialized:', gameId);
    } catch (error: any) {
      console.error('Init multiplayer game error:', error);
      set({
        error: error.message || 'Failed to initialize game',
        syncStatus: 'error',
      });
      throw error;
    }
  },

  syncGameState: () => {
    const { gameState, myHand, myPlayerSlot } = get();
    
    if (!gameState) return;

    // Calculate valid moves for current player
    if (gameState.currentPlayer === myPlayerSlot && gameState.gamePhase === 'playing') {
      const trickCards = gameState.currentTrick.map((t: TrickCard) => t.card);
      const validMoves = getValidMoves(
        myHand,
        trickCards,
        gameState.trumpSuit
      );
      set({ validMoves });
    } else {
      set({ validMoves: [] });
    }
  },

  robPackOnline: async (cardToDiscard: Card) => {
    try {
      const { gameId, gameState, myPlayerSlot, myHand } = get();
      
      if (!gameId || !gameState) {
        throw new Error('No active game');
      }

      if (gameState.robberIndex !== myPlayerSlot) {
        throw new Error('Not your turn to rob');
      }

      set({ syncStatus: 'syncing' });

      // Remove discarded card and add trump card
      const newHand = myHand.filter(c => c.suit !== cardToDiscard.suit || c.rank !== cardToDiscard.rank);
      if (gameState.trumpCard) {
        newHand.push(gameState.trumpCard);
      }

      // Move to next robber or start playing
      const nextRobberIndex = gameState.playersWhoCanRob.findIndex(i => i === myPlayerSlot);
      const hasMoreRobbers = nextRobberIndex < gameState.playersWhoCanRob.length - 1;
      
      const newPhase = hasMoreRobbers ? 'robbing' : 'playing';
      const newRobberIndex = hasMoreRobbers ? gameState.playersWhoCanRob[nextRobberIndex + 1] : -1;
      const newCurrentPlayer = hasMoreRobbers ? newRobberIndex : (gameState.dealer + 1) % Object.keys(get().players).length;

      // Add discarded card to pack
      const pack = gameState.pack || [];
      const newPack = [...pack, cardToDiscard];

      // Update game state in Firebase
      const gameRef = firebaseDatabase.ref(`${RTDB_PATHS.GAMES}/${gameId}`);
      
      await gameRef.update({
        'state/robbed': true,
        'state/pack': newPack,
        'state/gamePhase': newPhase,
        'state/robberIndex': newRobberIndex,
        'state/currentPlayer': newCurrentPlayer,
        'metadata/lastUpdated': Date.now(),
      });

      // Update my hand in Firebase
      const myUserId = Object.keys(get().players).find(uid => get().players[uid].slot === myPlayerSlot);
      if (myUserId) {
        await gameRef.update({
          [`players/${myUserId}/hand`]: newHand,
        });
      }

      set({ myHand: newHand, syncStatus: 'synced' });
    } catch (error: any) {
      console.error('Rob pack online error:', error);
      set({
        error: error.message || 'Failed to rob pack',
        syncStatus: 'error',
      });
      throw error;
    }
  },

  declineRobOnline: async () => {
    try {
      const { gameId, gameState, myPlayerSlot } = get();
      
      if (!gameId || !gameState) {
        throw new Error('No active game');
      }

      if (gameState.robberIndex !== myPlayerSlot) {
        throw new Error('Not your turn to rob');
      }

      set({ syncStatus: 'syncing' });

      // Move to next robber or start playing
      const nextRobberIndex = gameState.playersWhoCanRob.findIndex(i => i === myPlayerSlot);
      const hasMoreRobbers = nextRobberIndex < gameState.playersWhoCanRob.length - 1;
      
      const newPhase = hasMoreRobbers ? 'robbing' : 'playing';
      const newRobberIndex = hasMoreRobbers ? gameState.playersWhoCanRob[nextRobberIndex + 1] : -1;
      const newCurrentPlayer = hasMoreRobbers ? newRobberIndex : (gameState.dealer + 1) % Object.keys(get().players).length;

      // Update game state in Firebase
      const gameRef = firebaseDatabase.ref(`${RTDB_PATHS.GAMES}/${gameId}`);
      
      await gameRef.update({
        'state/gamePhase': newPhase,
        'state/robberIndex': newRobberIndex,
        'state/currentPlayer': newCurrentPlayer,
        'metadata/lastUpdated': Date.now(),
      });

      set({ syncStatus: 'synced' });
    } catch (error: any) {
      console.error('Decline rob online error:', error);
      set({
        error: error.message || 'Failed to decline rob',
        syncStatus: 'error',
      });
      throw error;
    }
  },

  playCardOnline: async (card: Card) => {
    try {
      const { gameId, gameState, myPlayerSlot, myHand } = get();
      
      if (!gameId || !gameState) {
        throw new Error('No active game');
      }

      if (gameState.currentPlayer !== myPlayerSlot) {
        throw new Error('Not your turn');
      }

      // Validate move locally
      const trickCards = gameState.currentTrick.map((t: TrickCard) => t.card);
      const validation = isLegalPlay(card, myHand, trickCards, gameState.trumpSuit);
      if (!validation.valid) {
        throw new Error(validation.error || 'Illegal move');
      }

      set({ syncStatus: 'syncing' });

      // Remove card from hand
      const newHand = myHand.filter(c => c.suit !== card.suit || c.rank !== card.rank);

      // Add card to trick
      const newTrick: TrickCard[] = [
        ...gameState.currentTrick,
        { card, playerIndex: myPlayerSlot },
      ];

      // Determine led suit
      const newLedSuit = gameState.currentTrick.length === 0 ? card.suit : gameState.ledSuit;

      // Determine next player
      const nextPlayer = (myPlayerSlot + 1) % Object.keys(get().players).length;

      // Update game state in Firebase
      const gameRef = firebaseDatabase.ref(`${RTDB_PATHS.GAMES}/${gameId}`);
      
      await gameRef.update({
        'state/currentTrick': newTrick,
        'state/ledSuit': newLedSuit,
        'state/currentPlayer': nextPlayer,
        'metadata/lastUpdated': Date.now(),
      });

      // Update my hand in Firebase
      await gameRef.update({
        [`players/${get().players[Object.keys(get().players)[myPlayerSlot]].userId}/hand`]: newHand,
      });

      // Update local hand
      set({ myHand: newHand, syncStatus: 'synced' });

      // Check if trick is complete
      if (newTrick.length === Object.keys(get().players).length) {
        setTimeout(() => get().handleTrickComplete(gameId), 1500);
      }
    } catch (error: any) {
      console.error('Play card online error:', error);
      set({
        error: error.message || 'Failed to play card',
        syncStatus: 'error',
      });
      throw error;
    }
  },

  handleTrickComplete: async (gameId: string) => {
    const { gameState, players } = get();
    if (!gameState || !gameState.ledSuit) return;

    const trickCards = gameState.currentTrick.map((t: TrickCard) => t.card);
    const numPlayersInGame = Object.keys(players).length;
    const winnerIndex = getTrickWinner(
      trickCards,
      gameState.ledSuit!,
      gameState.trumpSuit,
      gameState.firstPlayerThisTrick,
      numPlayersInGame
    );

    const newScores = addTrickPoints(
      gameState.scores,
      winnerIndex,
      POINTS_PER_TRICK
    );

    const handComplete = Object.values(players).every((p: any) => p.hand.length === 0);

    if (handComplete) {
      const handWinner = checkHandWinner(newScores, numPlayersInGame);
      const newHandsWon: HandsWon = {
        ...gameState.handsWon,
        individual: [...gameState.handsWon.individual],
      };
      const pack = gameState.pack || [];

      if (handWinner !== null) {
        if (newHandsWon.mode === "team") {
          if (handWinner === 1) newHandsWon.team1++;
          else newHandsWon.team2++;
        } else {
          newHandsWon.individual[handWinner]++;
        }
      } else {
        // Nobody reached 25 - deal more cards from pack if possible
        const dealResult = dealFromPack(pack, numPlayersInGame);
        if (dealResult) {
          const updates: Record<string, any> = {
            'state/gamePhase': 'playing',
            'state/scores': newScores,
            'state/pack': dealResult.remainingPack,
            'state/currentTrick': [],
            'state/ledSuit': null,
            'state/firstPlayerThisTrick': winnerIndex,
            'state/currentPlayer': winnerIndex,
            'metadata/lastUpdated': Date.now(),
          };
          Object.entries(players).forEach(([uid, p]) => {
            updates[`players/${uid}/hand`] = dealResult.hands[(p as any).slot];
          });
          const gameRef = firebaseDatabase!.ref(`${RTDB_PATHS.GAMES}/${gameId}`);
          await gameRef.update(updates);
          return;
        }
        // Pack exhausted - highest scorer wins
        if (newScores.mode === "team") {
          if (newScores.team1 > newScores.team2) newHandsWon.team1++;
          else if (newScores.team2 > newScores.team1) newHandsWon.team2++;
        } else {
          let maxScore = 0;
          let maxIdx = 0;
          for (let i = 0; i < numPlayersInGame; i++) {
            if (newScores.individual[i] > maxScore) {
              maxScore = newScores.individual[i];
              maxIdx = i;
            }
          }
          if (maxScore > 0) newHandsWon.individual[maxIdx]++;
        }
      }

      // Check game winner
      const gameWinner = checkGameWinner(newHandsWon, numPlayersInGame);

      const gameRef = firebaseDatabase.ref(`${RTDB_PATHS.GAMES}/${gameId}`);
      await gameRef.update({
        'state/gamePhase': gameWinner ? 'gameOver' : 'handComplete',
        'state/scores': newScores,
        'state/handsWon': newHandsWon,
        'state/currentTrick': [],
        'state/ledSuit': null,
        'state/firstPlayerThisTrick': winnerIndex,
        'state/currentPlayer': winnerIndex,
        'metadata/lastUpdated': Date.now(),
      });
    } else {
      // Continue to next trick
      const gameRef = firebaseDatabase.ref(`${RTDB_PATHS.GAMES}/${gameId}`);
      await gameRef.update({
        'state/gamePhase': 'playing',
        'state/scores': newScores,
        'state/currentTrick': [],
        'state/ledSuit': null,
        'state/firstPlayerThisTrick': winnerIndex,
        'state/currentPlayer': winnerIndex,
        'metadata/lastUpdated': Date.now(),
      });
    }
  },

  subscribeToGame: (gameId: string, userId: string) => {
    const gameRef = firebaseDatabase.ref(`${RTDB_PATHS.GAMES}/${gameId}`);

    const listener = gameRef.on('value', (snapshot: any) => {
      const data = snapshot.val();
      
      if (!data) {
        console.log('Game data not found');
        return;
      }

      const { state, players } = data;
      
      // Find my player data
      const myPlayerData = players[userId];
      if (!myPlayerData) {
        console.error('My player data not found');
        return;
      }

      // Update local state
      set({
        gameState: state,
        players,
        myHand: myPlayerData.hand,
        syncStatus: 'synced',
      });

      // Recalculate valid moves
      get().syncGameState();
    });

    // Return unsubscribe function
    return () => {
      gameRef.off('value', listener);
    };
  },

  cleanup: () => {
    const { gameId } = get();
    if (gameId) {
      const gameRef = firebaseDatabase.ref(`${RTDB_PATHS.GAMES}/${gameId}`);
      gameRef.off();
    }

    set({
      gameId: null,
      isMultiplayer: false,
      myPlayerSlot: 0,
      gameState: null,
      players: {},
      myHand: [],
      validMoves: [],
      syncStatus: 'idle',
      error: null,
    });
  },
}));
