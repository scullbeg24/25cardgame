/**
 * Online Game Store — Host-authoritative multiplayer engine.
 *
 * Host device:
 *   - Runs game logic locally using game-logic functions
 *   - Writes authoritative game state to RTDB at `games/{roomId}`
 *   - Listens for actions at `games/{roomId}/actions` and processes them
 *
 * Client devices:
 *   - Subscribe to `games/{roomId}` for game state
 *   - Write actions to `games/{roomId}/actions/{pushId}`
 *   - Never run game logic directly
 */

import { create } from "zustand";
import {
  firebaseAuth,
  firebaseDatabase,
  RTDB_PATHS,
} from "../config/firebase.config";
import { useRoomStore } from "./roomStore";
import type { Card, Suit } from "../game-logic/cards";
import { dealCardsForN, dealFromPackForN, getTrumpSuitFromCard } from "../game-logic/deck";
import {
  getValidMoves,
  isLegalPlay,
  findPlayersWhoCanRob,
  isTrumpCardAce,
  type RuleOptions,
} from "../game-logic/rules";
import {
  getTrickWinner,
  addTrickPointsIndividual,
  checkIndividualWinner,
  createIndividualScores,
  POINTS_PER_TRICK,
} from "../game-logic/scoring";
import type { TrickCard } from "./gameStore";

// ─── Types ───────────────────────────────────────────────────────

export type OnlineGamePhase =
  | "waiting"
  | "dealing"
  | "robbing"
  | "playing"
  | "trickComplete"
  | "handComplete"
  | "gameOver";

export interface OnlineGameState {
  phase: OnlineGamePhase;
  dealer: number;
  currentPlayer: number;
  trumpSuit: Suit;
  trumpCard: Card | null;
  currentTrick: TrickCard[];
  ledSuit: Suit | null;
  firstPlayerThisTrick: number;
  scores: number[];            // Individual scores, one per player
  hands: Card[][];             // Each player's hand (host stores all)
  pack: Card[];
  robberIndex: number;
  playersWhoCanRob: number[];
  robbed: boolean;
  trumpCardIsAce: boolean;
  playerNames: string[];
  handNumber: number;
  numPlayers: number;
  targetScore: number;
  ruleOptions: RuleOptions;
  updatedAt: number;
}

/** Action submitted by a client to the host */
export interface GameAction {
  type: "playCard" | "rob" | "declineRob";
  playerId: string;          // Firebase UID
  playerSlot: number;        // Slot index
  card?: Card;               // For playCard and rob
  timestamp: number;
}

// ─── Store Interface ─────────────────────────────────────────────

interface OnlineGameStore {
  // State
  gameState: OnlineGameState | null;
  roomId: string | null;
  mySlot: number | null;
  isHost: boolean;
  validMoves: Card[];
  error: string | null;
  isMyTurn: boolean;

  // Host actions
  initAsHost: (
    roomId: string,
    playerNames: string[],
    mySlot: number,
    numPlayers: number,
    targetScore: number,
    ruleOptions?: RuleOptions,
  ) => void;

  // Client actions
  initAsClient: (roomId: string, mySlot: number) => void;

  // Player actions (both host and client use these)
  submitPlayCard: (card: Card) => Promise<void>;
  submitRob: (cardToDiscard: Card) => Promise<void>;
  submitDeclineRob: () => Promise<void>;

  // Host-only game progression
  completeTrick: () => void;
  completeHand: () => void;

  // Computed
  recalcValidMoves: () => void;

  // Cleanup
  cleanup: () => void;
}

// ─── RTDB Serialization Helpers ──────────────────────────────────

/**
 * Strip undefined values for RTDB (it doesn't accept undefined).
 * Convert Card[][] to Record<string, Card[]> for storage.
 */
function serializeGameState(state: OnlineGameState): Record<string, any> {
  return {
    phase: state.phase,
    dealer: state.dealer,
    currentPlayer: state.currentPlayer,
    trumpSuit: state.trumpSuit,
    trumpCard: state.trumpCard,
    currentTrick: state.currentTrick.length > 0 ? state.currentTrick : null,
    ledSuit: state.ledSuit ?? null,
    firstPlayerThisTrick: state.firstPlayerThisTrick,
    scores: state.scores,
    hands: state.hands.reduce((acc, hand, i) => {
      acc[String(i)] = hand;
      return acc;
    }, {} as Record<string, Card[]>),
    pack: state.pack.length > 0 ? state.pack : null,
    robberIndex: state.robberIndex,
    playersWhoCanRob: state.playersWhoCanRob.length > 0 ? state.playersWhoCanRob : null,
    robbed: state.robbed,
    trumpCardIsAce: state.trumpCardIsAce,
    playerNames: state.playerNames,
    handNumber: state.handNumber,
    numPlayers: state.numPlayers,
    targetScore: state.targetScore,
    ruleOptions: state.ruleOptions ?? null,
    updatedAt: Date.now(),
  };
}

function deserializeGameState(data: Record<string, any>): OnlineGameState {
  const numPlayers = data.numPlayers ?? 4;

  // Convert hands from Record<string, Card[]> back to Card[][]
  const hands: Card[][] = [];
  if (data.hands) {
    for (let i = 0; i < numPlayers; i++) {
      hands.push(data.hands[String(i)] ?? []);
    }
  }

  return {
    phase: data.phase ?? "waiting",
    dealer: data.dealer ?? 0,
    currentPlayer: data.currentPlayer ?? 0,
    trumpSuit: data.trumpSuit ?? "hearts",
    trumpCard: data.trumpCard ?? null,
    currentTrick: data.currentTrick ?? [],
    ledSuit: data.ledSuit ?? null,
    firstPlayerThisTrick: data.firstPlayerThisTrick ?? 0,
    scores: data.scores ?? createIndividualScores(numPlayers),
    hands,
    pack: data.pack ?? [],
    robberIndex: data.robberIndex ?? -1,
    playersWhoCanRob: data.playersWhoCanRob ?? [],
    robbed: data.robbed ?? false,
    trumpCardIsAce: data.trumpCardIsAce ?? false,
    playerNames: data.playerNames ?? [],
    handNumber: data.handNumber ?? 1,
    numPlayers,
    targetScore: data.targetScore ?? 25,
    ruleOptions: data.ruleOptions ?? {},
    updatedAt: data.updatedAt ?? 0,
  };
}

/**
 * Mark the room as "finished" and clean up public room index.
 * Called by host when game phase becomes "gameOver".
 */
function _markRoomFinished(roomId: string) {
  const db = firebaseDatabase;
  if (!db) return;

  db.ref(`${RTDB_PATHS.GAME_ROOMS}/${roomId}/status`).set("finished");
  db.ref(`publicRooms/${roomId}`).remove();
}

// ─── Unsub tracking ──────────────────────────────────────────────

let _gameStateUnsub: (() => void) | null = null;
let _actionsUnsub: (() => void) | null = null;

// ─── Store ───────────────────────────────────────────────────────

export const useOnlineGameStore = create<OnlineGameStore>((set, get) => ({
  gameState: null,
  roomId: null,
  mySlot: null,
  isHost: false,
  validMoves: [],
  error: null,
  isMyTurn: false,

  // ─── HOST: Initialize and deal first hand ───────────────────
  initAsHost: (roomId, playerNames, mySlot, numPlayers, targetScore, ruleOptions = {}) => {
    const db = firebaseDatabase;
    if (!db) return;

    // Clean up previous subscriptions
    get().cleanup();

    // Deal initial hand
    const { hands, trumpCard, pack } = dealCardsForN(numPlayers);
    const trumpSuit = getTrumpSuitFromCard(trumpCard);
    const dealer = Math.floor(Math.random() * numPlayers);
    const firstPlayer = (dealer + 1) % numPlayers;

    const trumpIsAce = isTrumpCardAce(trumpCard);
    const eligibleRobbers = findPlayersWhoCanRob(hands, trumpCard, dealer, ruleOptions, numPlayers);
    const hasRobbers = eligibleRobbers.length > 0;

    const gameState: OnlineGameState = {
      phase: hasRobbers ? "robbing" : "playing",
      dealer,
      currentPlayer: firstPlayer,
      trumpSuit,
      trumpCard,
      currentTrick: [],
      ledSuit: null,
      firstPlayerThisTrick: firstPlayer,
      scores: createIndividualScores(numPlayers),
      hands,
      pack,
      robberIndex: hasRobbers ? eligibleRobbers[0] : -1,
      playersWhoCanRob: eligibleRobbers,
      robbed: false,
      trumpCardIsAce: trumpIsAce,
      playerNames,
      handNumber: 1,
      numPlayers,
      targetScore,
      ruleOptions,
      updatedAt: Date.now(),
    };

    // Write to RTDB
    db.ref(`${RTDB_PATHS.GAMES}/${roomId}`).set(serializeGameState(gameState));

    // Calculate valid moves for the current player (if it's us)
    const validMoves =
      !hasRobbers && firstPlayer === mySlot
        ? getValidMoves(hands[mySlot], [], trumpSuit, ruleOptions)
        : [];

    set({
      gameState,
      roomId,
      mySlot,
      isHost: true,
      validMoves,
      error: null,
      isMyTurn: firstPlayer === mySlot,
    });

    // Subscribe to game state (host also reads to stay in sync)
    _subscribeToGameState(roomId, mySlot, true);

    // Host listens for actions from clients
    _listenForActions(roomId);
  },

  // ─── CLIENT: Subscribe to game state from RTDB ──────────────
  initAsClient: (roomId, mySlot) => {
    get().cleanup();

    set({
      gameState: null,
      roomId,
      mySlot,
      isHost: false,
      validMoves: [],
      error: null,
      isMyTurn: false,
    });

    _subscribeToGameState(roomId, mySlot, false);
  },

  // ─── PLAYER: Submit a card play ─────────────────────────────
  submitPlayCard: async (card) => {
    const { roomId, mySlot, isHost, gameState } = get();
    if (!roomId || mySlot === null || !gameState) return;

    if (isHost) {
      // Host processes immediately
      _hostProcessPlayCard(mySlot, card);
    } else {
      // Client submits action to RTDB
      const db = firebaseDatabase;
      const uid = firebaseAuth?.currentUser?.uid;
      if (!db || !uid) return;

      await db.ref(`${RTDB_PATHS.GAMES}/${roomId}/actions`).push({
        type: "playCard",
        playerId: uid,
        playerSlot: mySlot,
        card,
        timestamp: Date.now(),
      });
    }
  },

  // ─── PLAYER: Submit rob ─────────────────────────────────────
  submitRob: async (cardToDiscard) => {
    const { roomId, mySlot, isHost, gameState } = get();
    if (!roomId || mySlot === null || !gameState) return;

    if (isHost) {
      _hostProcessRob(mySlot, cardToDiscard);
    } else {
      const db = firebaseDatabase;
      const uid = firebaseAuth?.currentUser?.uid;
      if (!db || !uid) return;

      await db.ref(`${RTDB_PATHS.GAMES}/${roomId}/actions`).push({
        type: "rob",
        playerId: uid,
        playerSlot: mySlot,
        card: cardToDiscard,
        timestamp: Date.now(),
      });
    }
  },

  // ─── PLAYER: Submit decline rob ─────────────────────────────
  submitDeclineRob: async () => {
    const { roomId, mySlot, isHost, gameState } = get();
    if (!roomId || mySlot === null || !gameState) return;

    if (isHost) {
      _hostProcessDeclineRob(mySlot);
    } else {
      const db = firebaseDatabase;
      const uid = firebaseAuth?.currentUser?.uid;
      if (!db || !uid) return;

      await db.ref(`${RTDB_PATHS.GAMES}/${roomId}/actions`).push({
        type: "declineRob",
        playerId: uid,
        playerSlot: mySlot,
        timestamp: Date.now(),
      });
    }
  },

  // ─── HOST: Complete a trick ─────────────────────────────────
  completeTrick: () => {
    const { gameState, roomId, isHost } = get();
    if (!gameState || !roomId || !isHost) return;
    if (gameState.phase !== "trickComplete") return;

    const db = firebaseDatabase;
    if (!db) return;

    const {
      currentTrick,
      ledSuit,
      trumpSuit,
      firstPlayerThisTrick,
      scores,
      hands,
      pack,
      numPlayers,
      targetScore,
      ruleOptions,
    } = gameState;

    if (!ledSuit || currentTrick.length !== numPlayers) return;

    const trickCards = currentTrick.map((t) => t.card);
    const winner = getTrickWinner(trickCards, ledSuit, trumpSuit, firstPlayerThisTrick, numPlayers);
    const newScores = addTrickPointsIndividual(scores, winner, POINTS_PER_TRICK);

    const allCardsPlayed = hands.every((h) => h.length === 0);
    const individualWinner = checkIndividualWinner(newScores, targetScore);

    if (allCardsPlayed && individualWinner === null) {
      // Try to deal from pack
      const dealResult = dealFromPackForN(pack, numPlayers);
      if (dealResult) {
        const newState: OnlineGameState = {
          ...gameState,
          currentTrick: [],
          ledSuit: null,
          currentPlayer: winner,
          firstPlayerThisTrick: winner,
          scores: newScores,
          pack: dealResult.remainingPack,
          hands: dealResult.hands,
          phase: "playing",
          updatedAt: Date.now(),
        };
        db.ref(`${RTDB_PATHS.GAMES}/${roomId}`).set(serializeGameState(newState));
        set({ gameState: newState });
        get().recalcValidMoves();
        return;
      }
      // Pack exhausted - highest score wins
      let maxScore = -1;
      let fallbackWinner = 0;
      for (let i = 0; i < numPlayers; i++) {
        if (newScores[i] > maxScore) {
          maxScore = newScores[i];
          fallbackWinner = i;
        }
      }
      // Mark game over
      const newState: OnlineGameState = {
        ...gameState,
        currentTrick: [],
        ledSuit: null,
        scores: newScores,
        phase: "gameOver",
        currentPlayer: fallbackWinner,
        updatedAt: Date.now(),
      };
      db.ref(`${RTDB_PATHS.GAMES}/${roomId}`).set(serializeGameState(newState));
      set({ gameState: newState });
      _markRoomFinished(roomId);
      return;
    }

    const nextPhase = individualWinner !== null
      ? "gameOver"
      : allCardsPlayed
        ? "handComplete"
        : "playing";

    const newState: OnlineGameState = {
      ...gameState,
      currentTrick: [],
      ledSuit: null,
      currentPlayer: winner,
      firstPlayerThisTrick: winner,
      scores: newScores,
      phase: nextPhase,
      updatedAt: Date.now(),
    };

    db.ref(`${RTDB_PATHS.GAMES}/${roomId}`).set(serializeGameState(newState));
    set({ gameState: newState });
    if (nextPhase === "gameOver") {
      _markRoomFinished(roomId);
    }
    get().recalcValidMoves();
  },

  // ─── HOST: Complete hand and deal new one ───────────────────
  completeHand: () => {
    const { gameState, roomId, isHost } = get();
    if (!gameState || !roomId || !isHost) return;

    const db = firebaseDatabase;
    if (!db) return;

    const {
      numPlayers,
      targetScore,
      ruleOptions,
      playerNames,
      handNumber,
      scores,
    } = gameState;

    // Check if someone won
    const winner = checkIndividualWinner(scores, targetScore);
    if (winner !== null) {
      const newState: OnlineGameState = {
        ...gameState,
        phase: "gameOver",
        updatedAt: Date.now(),
      };
      db.ref(`${RTDB_PATHS.GAMES}/${roomId}`).set(serializeGameState(newState));
      set({ gameState: newState });
      _markRoomFinished(roomId);
      return;
    }

    // Deal new hand
    const newDealer = (gameState.dealer + 1) % numPlayers;
    const { hands, trumpCard, pack } = dealCardsForN(numPlayers);
    const trumpSuit = getTrumpSuitFromCard(trumpCard);
    const firstPlayer = (newDealer + 1) % numPlayers;

    const trumpIsAce = isTrumpCardAce(trumpCard);
    const eligibleRobbers = findPlayersWhoCanRob(hands, trumpCard, newDealer, ruleOptions, numPlayers);
    const hasRobbers = eligibleRobbers.length > 0;

    const newState: OnlineGameState = {
      phase: hasRobbers ? "robbing" : "playing",
      dealer: newDealer,
      currentPlayer: firstPlayer,
      trumpSuit,
      trumpCard,
      currentTrick: [],
      ledSuit: null,
      firstPlayerThisTrick: firstPlayer,
      scores, // Keep accumulated scores
      hands,
      pack,
      robberIndex: hasRobbers ? eligibleRobbers[0] : -1,
      playersWhoCanRob: eligibleRobbers,
      robbed: false,
      trumpCardIsAce: trumpIsAce,
      playerNames,
      handNumber: handNumber + 1,
      numPlayers,
      targetScore,
      ruleOptions,
      updatedAt: Date.now(),
    };

    db.ref(`${RTDB_PATHS.GAMES}/${roomId}`).set(serializeGameState(newState));
    set({ gameState: newState });
    get().recalcValidMoves();
  },

  // ─── Recalculate valid moves for the current human player ───
  recalcValidMoves: () => {
    const { gameState, mySlot } = get();
    if (!gameState || mySlot === null) {
      set({ validMoves: [], isMyTurn: false });
      return;
    }

    const isMyTurn = gameState.currentPlayer === mySlot && gameState.phase === "playing";
    if (!isMyTurn) {
      set({ validMoves: [], isMyTurn: false });
      return;
    }

    const myHand = gameState.hands[mySlot] ?? [];
    const trickCards = gameState.currentTrick.map((t) => t.card);
    const validMoves = getValidMoves(myHand, trickCards, gameState.trumpSuit, gameState.ruleOptions);
    set({ validMoves, isMyTurn: true });
  },

  // ─── Cleanup ────────────────────────────────────────────────
  cleanup: () => {
    if (_gameStateUnsub) {
      _gameStateUnsub();
      _gameStateUnsub = null;
    }
    if (_actionsUnsub) {
      _actionsUnsub();
      _actionsUnsub = null;
    }
    set({
      gameState: null,
      roomId: null,
      mySlot: null,
      isHost: false,
      validMoves: [],
      error: null,
      isMyTurn: false,
    });
  },
}));

// ─── Internal: Subscribe to game state ───────────────────────────

function _subscribeToGameState(roomId: string, mySlot: number, isHost: boolean) {
  const db = firebaseDatabase;
  if (!db) return;

  // Clean up existing
  if (_gameStateUnsub) _gameStateUnsub();

  const ref = db.ref(`${RTDB_PATHS.GAMES}/${roomId}`);

  const listener = ref.on("value", (snapshot) => {
    if (!snapshot.exists()) return;

    const raw = snapshot.val();
    // Don't overwrite actions sub-node
    const { actions, ...stateData } = raw;
    const gameState = deserializeGameState(stateData);

    const store = useOnlineGameStore.getState();

    // For clients, always update from RTDB
    // For host, only update if it came from our own write (or initial)
    if (!isHost || !store.gameState) {
      useOnlineGameStore.setState({ gameState });
      useOnlineGameStore.getState().recalcValidMoves();
    }
  });

  _gameStateUnsub = () => ref.off("value", listener);
}

// ─── Internal: Host listens for client actions ───────────────────

function _listenForActions(roomId: string) {
  const db = firebaseDatabase;
  if (!db) return;

  if (_actionsUnsub) _actionsUnsub();

  const ref = db.ref(`${RTDB_PATHS.GAMES}/${roomId}/actions`);

  const listener = ref.on("child_added", (snapshot) => {
    const action = snapshot.val() as GameAction;
    if (!action) return;

    // Process the action
    switch (action.type) {
      case "playCard":
        if (action.card) {
          _hostProcessPlayCard(action.playerSlot, action.card);
        }
        break;
      case "rob":
        if (action.card) {
          _hostProcessRob(action.playerSlot, action.card);
        }
        break;
      case "declineRob":
        _hostProcessDeclineRob(action.playerSlot);
        break;
    }

    // Remove processed action
    snapshot.ref.remove();
  });

  _actionsUnsub = () => ref.off("child_added", listener);
}

// ─── Internal: Host processes a playCard action ──────────────────

function _hostProcessPlayCard(playerSlot: number, card: Card) {
  const store = useOnlineGameStore.getState();
  const { gameState, roomId } = store;
  if (!gameState || !roomId) return;

  const db = firebaseDatabase;
  if (!db) return;

  if (gameState.phase !== "playing") return;
  if (playerSlot !== gameState.currentPlayer) return;

  const hand = gameState.hands[playerSlot];
  const trickCards = gameState.currentTrick.map((t) => t.card);

  // Validate the play
  const validation = isLegalPlay(
    card,
    hand,
    trickCards,
    gameState.trumpSuit,
    gameState.ruleOptions
  );

  if (!validation.valid) {
    // Invalid play — ignore silently (client should prevent this)
    return;
  }

  // Remove card from hand
  const newHand = hand.filter(
    (c) => !(c.suit === card.suit && c.rank === card.rank)
  );
  const newHands = gameState.hands.map((h, i) =>
    i === playerSlot ? newHand : h
  );

  const trickCard: TrickCard = { card, playerIndex: playerSlot };
  const newTrick = [...gameState.currentTrick, trickCard];
  const effectiveLedSuit = gameState.ledSuit ?? card.suit;
  const nextPlayer = (playerSlot + 1) % gameState.numPlayers;

  const trickFull = newTrick.length === gameState.numPlayers;

  const newState: OnlineGameState = {
    ...gameState,
    hands: newHands,
    currentTrick: newTrick,
    ledSuit: effectiveLedSuit,
    currentPlayer: nextPlayer,
    phase: trickFull ? "trickComplete" : "playing",
    updatedAt: Date.now(),
  };

  // Write to RTDB
  db.ref(`${RTDB_PATHS.GAMES}/${roomId}`).set(serializeGameState(newState));
  useOnlineGameStore.setState({ gameState: newState });
  useOnlineGameStore.getState().recalcValidMoves();
}

// ─── Internal: Host processes a rob action ───────────────────────

function _hostProcessRob(playerSlot: number, cardToDiscard: Card) {
  const store = useOnlineGameStore.getState();
  const { gameState, roomId } = store;
  if (!gameState || !roomId) return;

  const db = firebaseDatabase;
  if (!db) return;

  if (gameState.phase !== "robbing") return;
  if (playerSlot !== gameState.robberIndex) return;

  const hand = [...gameState.hands[playerSlot]];
  const trumpCard = gameState.trumpCard;
  if (!trumpCard) return;

  const discardIdx = hand.findIndex(
    (c) => c.suit === cardToDiscard.suit && c.rank === cardToDiscard.rank
  );
  if (discardIdx === -1) return;

  // Replace discarded card with trump card
  hand[discardIdx] = trumpCard;
  const newPack = [...gameState.pack, cardToDiscard];
  const newHands = gameState.hands.map((h, i) =>
    i === playerSlot ? hand : h
  );

  const newState: OnlineGameState = {
    ...gameState,
    hands: newHands,
    pack: newPack,
    phase: "playing",
    robbed: true,
    robberIndex: -1,
    playersWhoCanRob: [],
    updatedAt: Date.now(),
  };

  db.ref(`${RTDB_PATHS.GAMES}/${roomId}`).set(serializeGameState(newState));
  useOnlineGameStore.setState({ gameState: newState });
  useOnlineGameStore.getState().recalcValidMoves();
}

// ─── Internal: Host processes a declineRob action ────────────────

function _hostProcessDeclineRob(playerSlot: number) {
  const store = useOnlineGameStore.getState();
  const { gameState, roomId } = store;
  if (!gameState || !roomId) return;

  const db = firebaseDatabase;
  if (!db) return;

  if (gameState.phase !== "robbing") return;
  if (playerSlot !== gameState.robberIndex) return;

  // Can't decline if trump card is an Ace (dealer must take)
  if (gameState.trumpCardIsAce) return;

  const { playersWhoCanRob, robberIndex } = gameState;
  const currentIndex = playersWhoCanRob.indexOf(robberIndex);
  const nextRobber =
    currentIndex + 1 < playersWhoCanRob.length
      ? playersWhoCanRob[currentIndex + 1]
      : -1;

  const newState: OnlineGameState = {
    ...gameState,
    robberIndex: nextRobber,
    phase: nextRobber === -1 ? "playing" : "robbing",
    playersWhoCanRob: nextRobber === -1 ? [] : playersWhoCanRob,
    updatedAt: Date.now(),
  };

  db.ref(`${RTDB_PATHS.GAMES}/${roomId}`).set(serializeGameState(newState));
  useOnlineGameStore.setState({ gameState: newState });
  useOnlineGameStore.getState().recalcValidMoves();
}
