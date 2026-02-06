/**
 * Game state management for Irish card game "25"
 */

import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

const GAME_STORAGE_KEY = "@25cardgame/game";
import type { Card } from "../game-logic/cards";
import type { Suit } from "../game-logic/cards";
import { dealCards, dealFromPack, getTrumpSuitFromCard } from "../game-logic/deck";
import {
  getValidMoves,
  canRobPack,
  isLegalPlay,
  findPlayersWhoCanRob,
  isTrumpCardAce,
  type RuleOptions,
} from "../game-logic/rules";
import {
  getTrickWinner,
  addTrickPoints,
  checkHandWinner,
  checkGameWinner,
  POINTS_PER_TRICK,
} from "../game-logic/scoring";
import type { AIDifficulty } from "../utils/constants";

export type GamePhase =
  | "setup"
  | "dealing"
  | "robbing"
  | "playing"
  | "trickComplete"
  | "handComplete"
  | "gameOver";

export interface Player {
  id: number;
  name: string;
  hand: Card[];
  teamId: 1 | 2;
  isAI: boolean;
  difficulty?: AIDifficulty;
}

export interface TrickCard {
  card: Card;
  playerIndex: number;
}

export interface GameState {
  players: Player[];
  trumpSuit: Suit;
  trumpCard: Card | null;
  currentTrick: TrickCard[];
  ledSuit: Suit | null;
  currentPlayer: number;
  dealer: number;
  firstPlayerThisTrick: number;
  scores: { team1: number; team2: number };
  handsWon: { team1: number; team2: number };
  pack: Card[];
  gamePhase: GamePhase;
  validMoves: Card[];
  robbed: boolean;
  ruleOptions: RuleOptions;
  /** Index of player currently being offered to rob (-1 if none) */
  robberIndex: number;
  /** List of players who can rob, in priority order */
  playersWhoCanRob: number[];
  /** Whether the trump card is an Ace (forces dealer to take it) */
  trumpCardIsAce: boolean;
}

const initialScores = () => ({ team1: 0, team2: 0 });
const initialHandsWon = () => ({ team1: 0, team2: 0 });

const createPlayer = (
  id: number,
  name: string,
  hand: Card[],
  isAI: boolean,
  difficulty?: AIDifficulty
): Player => ({
  id,
  name,
  hand,
  teamId: (id % 2 === 0 ? 1 : 2) as 1 | 2,
  isAI,
  difficulty,
});

interface GameStore extends GameState {
  initializeGame: (
    playerName: string,
    aiDifficulty: AIDifficulty,
    ruleOptions?: RuleOptions
  ) => void;
  dealNewHand: () => void;
  offerRobPack: () => void;
  robPack: (cardToDiscard: Card) => void;
  declineRob: () => void;
  /** Skip robbing and pass to the next eligible player (or start playing) */
  skipRob: () => void;
  playCard: (playerId: number, card: Card) => { success: boolean; error?: string } | void;
  completeTrick: () => void;
  completeHand: () => void;
  resetGame: () => void;
  calculateValidMoves: (playerId: number) => void;
  setRuleOptions: (options: Partial<RuleOptions>) => void;
  saveGame: () => Promise<void>;
  loadGame: () => Promise<boolean>;
  hasSavedGame: () => Promise<boolean>;
}

const initialState: GameState = {
  players: [],
  trumpSuit: "hearts",
  trumpCard: null,
  currentTrick: [],
  ledSuit: null,
  currentPlayer: 0,
  dealer: 0,
  firstPlayerThisTrick: 0,
  scores: initialScores(),
  handsWon: initialHandsWon(),
  pack: [],
  gamePhase: "setup",
  validMoves: [],
  robbed: false,
  ruleOptions: {},
  robberIndex: -1,
  playersWhoCanRob: [],
  trumpCardIsAce: false,
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,

  initializeGame: (playerName, aiDifficulty, ruleOptions = {}) => {
    AsyncStorage.removeItem(GAME_STORAGE_KEY);
    const names = ["North", "East", playerName, "West"];
    const players: Player[] = names.map((name, i) =>
      createPlayer(i, name, [], i !== 2, i !== 2 ? aiDifficulty : undefined)
    );
    const dealer = Math.floor(Math.random() * 4);
    set({
      players,
      dealer,
      gamePhase: "setup",
      scores: initialScores(),
      handsWon: initialHandsWon(),
      ruleOptions,
    });
    get().dealNewHand();
  },

  dealNewHand: () => {
    const { players, dealer, ruleOptions } = get();
    const { hands, trumpCard, pack } = dealCards();
    const trumpSuit = getTrumpSuitFromCard(trumpCard);

    const updatedPlayers = players.map((p, i) => ({
      ...p,
      hand: hands[i],
    }));

    const firstPlayer = (dealer + 1) % 4;
    
    // Check if trump card is an Ace (dealer must take it)
    const trumpIsAce = isTrumpCardAce(trumpCard);
    
    // Find all players who can rob the Ace
    const eligibleRobbers = findPlayersWhoCanRob(hands, trumpCard, dealer, ruleOptions);
    
    // Determine if we enter robbing phase
    const hasEligibleRobbers = eligibleRobbers.length > 0;
    const firstRobber = hasEligibleRobbers ? eligibleRobbers[0] : -1;

    set({
      players: updatedPlayers,
      trumpSuit,
      trumpCard,
      pack,
      currentTrick: [],
      ledSuit: null,
      currentPlayer: firstPlayer,
      firstPlayerThisTrick: firstPlayer,
      gamePhase: hasEligibleRobbers ? "robbing" : "playing",
      validMoves: [],
      robbed: false,
      trumpCardIsAce: trumpIsAce,
      playersWhoCanRob: eligibleRobbers,
      robberIndex: firstRobber,
    });

    if (!hasEligibleRobbers) {
      get().calculateValidMoves(firstPlayer);
    }
  },

  offerRobPack: () => {
    set({ gamePhase: "robbing" });
  },

  robPack: (cardToDiscard) => {
    const { players, robberIndex, trumpCard, pack } = get();
    if (!trumpCard || robberIndex === -1) return;

    const robberHand = [...players[robberIndex].hand];
    const discardIdx = robberHand.findIndex(
      (c) => c.suit === cardToDiscard.suit && c.rank === cardToDiscard.rank
    );
    if (discardIdx === -1) return;

    // Replace the discarded card with the trump card
    robberHand[discardIdx] = trumpCard;
    const newPack = [...pack, cardToDiscard];

    const updatedPlayers = players.map((p, i) =>
      i === robberIndex ? { ...p, hand: robberHand } : p
    );

    set({
      players: updatedPlayers,
      pack: newPack,
      gamePhase: "playing",
      robbed: true,
      robberIndex: -1,
      playersWhoCanRob: [],
    });

    get().calculateValidMoves(get().currentPlayer);
  },

  declineRob: () => {
    // Move to the next eligible robber or start playing
    const { playersWhoCanRob, robberIndex, trumpCardIsAce } = get();
    
    // If trump card is an Ace, dealer cannot decline - they must take it
    if (trumpCardIsAce) {
      // Force the dealer to take it - they shouldn't be able to decline
      // This is a safeguard; the UI should prevent this
      return;
    }
    
    // Find next eligible robber
    const currentIndex = playersWhoCanRob.indexOf(robberIndex);
    const nextRobberIndex = currentIndex + 1 < playersWhoCanRob.length
      ? playersWhoCanRob[currentIndex + 1]
      : -1;
    
    if (nextRobberIndex === -1) {
      // No more eligible robbers, start playing
      set({
        gamePhase: "playing",
        robberIndex: -1,
        playersWhoCanRob: [],
      });
      get().calculateValidMoves(get().currentPlayer);
    } else {
      // Move to next eligible robber
      set({ robberIndex: nextRobberIndex });
    }
  },

  skipRob: () => {
    // Same as declineRob but can be used by AI
    get().declineRob();
  },

  playCard: (playerId, card) => {
    const {
      players,
      currentPlayer,
      currentTrick,
      trumpSuit,
      ledSuit,
      gamePhase,
      ruleOptions,
    } = get();

    if (gamePhase !== "playing") return { success: false, error: "Not your turn" };
    if (playerId !== currentPlayer) return { success: false, error: "Not your turn" };

    const player = players[playerId];
    const hand = player.hand;
    const validation = isLegalPlay(
      card,
      hand,
      currentTrick.map((t) => t.card),
      trumpSuit,
      ruleOptions
    );

    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const newHand = hand.filter(
      (c) => !(c.suit === card.suit && c.rank === card.rank)
    );
    const trickCard: TrickCard = { card, playerIndex: playerId };
    const newTrick = [...currentTrick, trickCard];

    const updatedPlayers = players.map((p) =>
      p.id === playerId ? { ...p, hand: newHand } : p
    );

    const effectiveLedSuit = ledSuit ?? card.suit;
    const nextPlayer = (playerId + 1) % 4;

    set({
      players: updatedPlayers,
      currentTrick: newTrick,
      ledSuit: effectiveLedSuit,
      currentPlayer: nextPlayer,
      validMoves: [],
    });

    if (newTrick.length === 4) {
      set({ gamePhase: "trickComplete" });
    } else {
      get().calculateValidMoves(nextPlayer);
    }
    get().saveGame();
  },

  completeTrick: () => {
    const {
      currentTrick,
      ledSuit,
      trumpSuit,
      firstPlayerThisTrick,
      scores,
      players,
      pack,
    } = get();

    if (!ledSuit || currentTrick.length !== 4) return;

    const trickCards = currentTrick.map((t) => t.card);
    const winner = getTrickWinner(
      trickCards,
      ledSuit,
      trumpSuit,
      firstPlayerThisTrick
    );
    const newScores = addTrickPoints(scores, winner, POINTS_PER_TRICK);

    const newHandsWon = { ...get().handsWon };
    const allCardsPlayed = players.every((p) => p.hand.length === 0);
    const handWinner = checkHandWinner(newScores);

    // Hand only ends when a team reaches 25. Otherwise deal more cards and continue.
    if (allCardsPlayed) {
      if (handWinner) {
        newHandsWon[`team${handWinner}` as keyof typeof newHandsWon] += 1;
      } else {
        const dealResult = dealFromPack(pack);
        if (dealResult) {
          const updatedPlayers = players.map((p, i) => ({
            ...p,
            hand: dealResult.hands[i],
          }));
          set({
            currentTrick: [],
            ledSuit: null,
            currentPlayer: winner,
            firstPlayerThisTrick: winner,
            scores: newScores,
            pack: dealResult.remainingPack,
            players: updatedPlayers,
            gamePhase: "playing",
          });
          get().calculateValidMoves(winner);
          return;
        }
        // Pack exhausted - team with more points wins (fallback)
        if (newScores.team1 > newScores.team2) newHandsWon.team1 += 1;
        else if (newScores.team2 > newScores.team1) newHandsWon.team2 += 1;
      }
    }

    const gameWinner = checkGameWinner(newHandsWon);

    set({
      currentTrick: [],
      ledSuit: null,
      currentPlayer: winner,
      firstPlayerThisTrick: winner,
      scores: newScores,
      handsWon: newHandsWon,
      gamePhase: gameWinner
        ? "gameOver"
        : allCardsPlayed
        ? "handComplete"
        : "playing",
    });

    if (gameWinner || allCardsPlayed) return;

    get().calculateValidMoves(winner);
  },

  completeHand: () => {
    const { handsWon } = get();
    const gameWinner = checkGameWinner(handsWon);
    if (gameWinner) {
      set({ gamePhase: "gameOver" });
      AsyncStorage.removeItem(GAME_STORAGE_KEY);
      return;
    }

    const newDealer = (get().dealer + 1) % 4;
    set({ dealer: newDealer, scores: initialScores() });
    get().dealNewHand();
  },

  resetGame: () => {
    set({
      ...initialState,
      dealer: Math.floor(Math.random() * 4),
    });
    AsyncStorage.removeItem(GAME_STORAGE_KEY);
  },

  calculateValidMoves: (playerId) => {
    const { players, currentTrick, trumpSuit, ruleOptions } = get();
    const player = players[playerId];
    if (!player) return;

    const trickCards = currentTrick.map((t) => t.card);
    const validMoves = getValidMoves(
      player.hand,
      trickCards,
      trumpSuit,
      ruleOptions
    );

    set({ validMoves });
  },

  setRuleOptions: (options) => {
    set((s) => ({
      ruleOptions: { ...s.ruleOptions, ...options },
    }));
  },

  saveGame: async () => {
    try {
      const state = get();
      if (state.gamePhase === "setup" || state.gamePhase === "gameOver") return;
      await AsyncStorage.setItem(GAME_STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  },

  loadGame: async () => {
    try {
      const raw = await AsyncStorage.getItem(GAME_STORAGE_KEY);
      if (!raw) return false;
      const parsed = JSON.parse(raw) as GameState;
      set(parsed);
      return true;
    } catch {
      return false;
    }
  },

  hasSavedGame: async () => {
    try {
      const raw = await AsyncStorage.getItem(GAME_STORAGE_KEY);
      return !!raw;
    } catch {
      return false;
    }
  },
}));
