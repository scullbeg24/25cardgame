/**
 * Game state management for Irish card game "25"
 * Supports 2-10 players with team (4 players) or individual scoring
 */

import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

const GAME_STORAGE_KEY = "@25cardgame/game";
import type { Card } from "../game-logic/cards";
import type { Suit } from "../game-logic/cards";
import { dealCards, dealFromPack, getTrumpSuitFromCard } from "../game-logic/deck";
import {
  getValidMoves,
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
  createInitialScores,
  createInitialHandsWon,
  POINTS_PER_TRICK,
  type Scores,
  type HandsWon,
} from "../game-logic/scoring";
import type { AIDifficulty, ScoreMode } from "../utils/constants";
import { getHumanPlayerIndex, generateBotNames, getScoringMode } from "../utils/constants";

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
  teamId: 1 | 2 | null;
  isAI: boolean;
  difficulty?: AIDifficulty;
}

export interface TrickCard {
  card: Card;
  playerIndex: number;
}

export interface GameState {
  players: Player[];
  numPlayers: number;
  scoringMode: ScoreMode;
  trumpSuit: Suit;
  trumpCard: Card | null;
  currentTrick: TrickCard[];
  ledSuit: Suit | null;
  currentPlayer: number;
  dealer: number;
  firstPlayerThisTrick: number;
  scores: Scores;
  handsWon: HandsWon;
  pack: Card[];
  gamePhase: GamePhase;
  validMoves: Card[];
  robbed: boolean;
  /** Index of player who robbed this hand (-1 if none) */
  robbedByPlayer: number;
  ruleOptions: RuleOptions;
  /** Index of player currently being offered to rob (-1 if none) */
  robberIndex: number;
  /** List of players who can rob, in priority order */
  playersWhoCanRob: number[];
  /** Whether the trump card is an Ace (forces dealer to take it) */
  trumpCardIsAce: boolean;
  /** Target score to win a hand (25 or 45) */
  targetScore: number;
}

const createPlayer = (
  id: number,
  name: string,
  hand: Card[],
  isAI: boolean,
  scoringMode: ScoreMode,
  difficulty?: AIDifficulty
): Player => ({
  id,
  name,
  hand,
  teamId: scoringMode === "team" ? ((id % 2 === 0 ? 1 : 2) as 1 | 2) : null,
  isAI,
  difficulty,
});

interface GameStore extends GameState {
  initializeGame: (
    playerName: string,
    aiDifficulty: AIDifficulty,
    ruleOptions?: RuleOptions,
    numPlayers?: number,
    targetScore?: number
  ) => void;
  dealNewHand: () => void;
  offerRobPack: () => void;
  robPack: (cardToDiscard: Card) => void;
  declineRob: () => void;
  /** Skip robbing and pass to the next eligible player (or start playing) */
  skipRob: () => void;
  playCard: (playerId: number, card: Card) => { success: boolean; error?: string };
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
  numPlayers: 4,
  scoringMode: "team",
  trumpSuit: "hearts",
  trumpCard: null,
  currentTrick: [],
  ledSuit: null,
  currentPlayer: 0,
  dealer: 0,
  firstPlayerThisTrick: 0,
  scores: createInitialScores(4),
  handsWon: createInitialHandsWon(4),
  pack: [],
  gamePhase: "setup",
  validMoves: [],
  robbed: false,
  robbedByPlayer: -1,
  ruleOptions: {},
  robberIndex: -1,
  playersWhoCanRob: [],
  trumpCardIsAce: false,
  targetScore: 25,
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,

  initializeGame: (playerName, aiDifficulty, ruleOptions = {}, numPlayers = 4, targetScore = 25) => {
    AsyncStorage.removeItem(GAME_STORAGE_KEY);
    const humanIndex = getHumanPlayerIndex(numPlayers);
    const scoringMode = getScoringMode(numPlayers);
    const botNames = generateBotNames(numPlayers - 1);

    const players: Player[] = [];
    for (let i = 0; i < numPlayers; i++) {
      if (i === humanIndex) {
        players.push(createPlayer(i, playerName, [], false, scoringMode));
      } else {
        // Bot names are indexed 0..(numPlayers-2), human takes last slot
        const botIndex = i < humanIndex ? i : i;
        players.push(
          createPlayer(i, botNames[botIndex], [], true, scoringMode, aiDifficulty)
        );
      }
    }

    const dealer = Math.floor(Math.random() * numPlayers);
    set({
      players,
      numPlayers,
      scoringMode,
      dealer,
      gamePhase: "setup",
      scores: createInitialScores(numPlayers),
      handsWon: createInitialHandsWon(numPlayers),
      ruleOptions,
      robbedByPlayer: -1,
      targetScore,
    });
    get().dealNewHand();
  },

  dealNewHand: () => {
    const { players, dealer, ruleOptions, numPlayers } = get();
    const { hands, trumpCard, pack } = dealCards(numPlayers);
    const trumpSuit = getTrumpSuitFromCard(trumpCard);

    const updatedPlayers = players.map((p, i) => ({
      ...p,
      hand: hands[i],
    }));

    const firstPlayer = (dealer + 1) % numPlayers;

    // Check if trump card is an Ace (dealer must take it)
    const trumpIsAce = isTrumpCardAce(trumpCard);

    // Find all players who can rob the Ace
    const eligibleRobbers = findPlayersWhoCanRob(hands, trumpCard, dealer, ruleOptions, numPlayers);

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
      robbedByPlayer: -1,
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
      robbedByPlayer: robberIndex,
      robberIndex: -1,
      playersWhoCanRob: [],
    });

    get().calculateValidMoves(get().currentPlayer);
  },

  declineRob: () => {
    // Move to the next eligible robber or start playing
    const { players, playersWhoCanRob, robberIndex, trumpCardIsAce, trumpCard } = get();

    // If trump card is an Ace, dealer cannot decline - they must take it
    // Force-rob by discarding their weakest non-trump card
    if (trumpCardIsAce && trumpCard) {
      const dealerHand = players[robberIndex].hand;
      // Find the weakest card to discard (prefer non-trump, lowest value)
      const cardToDiscard = dealerHand.find(
        (c) => c.suit !== trumpCard.suit
      ) ?? dealerHand[0];

      get().robPack(cardToDiscard);
      return;
    }

    // Find next eligible robber
    const currentIndex = playersWhoCanRob.indexOf(robberIndex);
    if (currentIndex === -1) {
      // robberIndex not found in list - go straight to playing
      set({
        gamePhase: "playing",
        robberIndex: -1,
        playersWhoCanRob: [],
      });
      get().calculateValidMoves(get().currentPlayer);
      return;
    }

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
      numPlayers,
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

    const updatedPlayers = players.map((p, i) =>
      i === playerId ? { ...p, hand: newHand } : p
    );

    const effectiveLedSuit = ledSuit ?? card.suit;
    const nextPlayer = (playerId + 1) % numPlayers;

    set({
      players: updatedPlayers,
      currentTrick: newTrick,
      ledSuit: effectiveLedSuit,
      currentPlayer: nextPlayer,
      validMoves: [],
    });

    if (newTrick.length === numPlayers) {
      set({ gamePhase: "trickComplete" });
    } else {
      get().calculateValidMoves(nextPlayer);
    }
    get().saveGame();
    return { success: true };
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
      numPlayers,
      targetScore,
    } = get();

    if (!ledSuit || currentTrick.length !== numPlayers) return;

    const trickCards = currentTrick.map((t) => t.card);
    const winner = getTrickWinner(
      trickCards,
      ledSuit,
      trumpSuit,
      firstPlayerThisTrick,
      numPlayers
    );
    const newScores = addTrickPoints(scores, winner, POINTS_PER_TRICK);

    const handsWon = get().handsWon;
    const newHandsWon: HandsWon = {
      ...handsWon,
      individual: [...handsWon.individual],
    };
    const allCardsPlayed = players.every((p) => p.hand.length === 0);
    const handWinner = checkHandWinner(newScores, numPlayers, targetScore);

    // Hand only ends when someone reaches 25. Otherwise deal more cards and continue.
    if (allCardsPlayed) {
      if (handWinner !== null) {
        // Record the hand win
        if (newHandsWon.mode === "team") {
          if (handWinner === 1) newHandsWon.team1 += 1;
          else if (handWinner === 2) newHandsWon.team2 += 1;
        } else {
          newHandsWon.individual[handWinner] += 1;
        }
      } else {
        const dealResult = dealFromPack(pack, numPlayers);
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
        // Pack exhausted - player/team with more points wins (fallback)
        if (newScores.mode === "team") {
          if (newScores.team1 > newScores.team2) newHandsWon.team1 += 1;
          else if (newScores.team2 > newScores.team1) newHandsWon.team2 += 1;
        } else {
          // Individual: find player with highest score
          let maxScore = -1;
          let maxPlayer = -1;
          for (let i = 0; i < numPlayers; i++) {
            if (newScores.individual[i] > maxScore) {
              maxScore = newScores.individual[i];
              maxPlayer = i;
            }
          }
          if (maxPlayer >= 0) {
            newHandsWon.individual[maxPlayer] += 1;
          }
        }
      }
    }

    const gameWinner = checkGameWinner(newHandsWon, numPlayers);

    set({
      currentTrick: [],
      ledSuit: null,
      currentPlayer: winner,
      firstPlayerThisTrick: winner,
      scores: newScores,
      handsWon: newHandsWon,
      gamePhase: gameWinner !== null
        ? "gameOver"
        : allCardsPlayed
        ? "handComplete"
        : "playing",
    });

    if (gameWinner !== null || allCardsPlayed) return;

    get().calculateValidMoves(winner);
  },

  completeHand: () => {
    const { handsWon, numPlayers } = get();
    const gameWinner = checkGameWinner(handsWon, numPlayers);
    if (gameWinner !== null) {
      set({ gamePhase: "gameOver" });
      AsyncStorage.removeItem(GAME_STORAGE_KEY);
      return;
    }

    const newDealer = (get().dealer + 1) % numPlayers;
    set({ dealer: newDealer, scores: createInitialScores(numPlayers) });
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
      // Validate saved game has required fields (backwards compatibility)
      if (!parsed.numPlayers || !parsed.scores?.mode) {
        await AsyncStorage.removeItem(GAME_STORAGE_KEY);
        return false;
      }
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
