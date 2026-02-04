/**
 * Game Log Store - Tracks all game events for display
 */

import { create } from "zustand";
import type { Card, Suit } from "../game-logic/cards";

export type GameLogEventType =
  | "game_start"
  | "hand_start"
  | "deal"
  | "card_played"
  | "trick_won"
  | "hand_won"
  | "game_won"
  | "rob_offered"
  | "rob_accepted"
  | "rob_declined"
  | "trump_revealed"
  | "invalid_play"
  | "info";

export interface GameLogEntry {
  id: string;
  type: GameLogEventType;
  message: string;
  timestamp: number;
  playerName?: string;
  card?: Card;
  trumpSuit?: Suit;
  points?: number;
  teamId?: 1 | 2;
}

interface GameLogState {
  logs: GameLogEntry[];
  maxLogs: number;
}

interface GameLogStore extends GameLogState {
  addLog: (entry: Omit<GameLogEntry, "id" | "timestamp">) => void;
  clearLogs: () => void;
  
  // Convenience methods for common log types
  logGameStart: (playerName: string) => void;
  logHandStart: (handNumber: number, dealerName: string) => void;
  logTrumpRevealed: (trumpCard: Card) => void;
  logCardPlayed: (playerName: string, card: Card) => void;
  logTrickWon: (playerName: string, points: number) => void;
  logHandWon: (teamId: 1 | 2, score: number) => void;
  logGameWon: (teamId: 1 | 2) => void;
  logRobOffered: (playerName: string, trumpCard: Card) => void;
  logRobAccepted: (playerName: string, trumpCard: Card) => void;
  logRobDeclined: (playerName: string) => void;
  logInvalidPlay: (playerName: string, reason: string) => void;
  logInfo: (message: string) => void;
}

const SUIT_SYMBOLS: Record<Suit, string> = {
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
  spades: "♠",
};

const formatCard = (card: Card): string => {
  return `${card.rank}${SUIT_SYMBOLS[card.suit]}`;
};

const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const useGameLogStore = create<GameLogStore>((set, get) => ({
  logs: [],
  maxLogs: 100,

  addLog: (entry) => {
    const newEntry: GameLogEntry = {
      ...entry,
      id: generateId(),
      timestamp: Date.now(),
    };

    set((state) => {
      const newLogs = [newEntry, ...state.logs];
      // Keep only the most recent logs
      if (newLogs.length > state.maxLogs) {
        newLogs.pop();
      }
      return { logs: newLogs };
    });
  },

  clearLogs: () => {
    set({ logs: [] });
  },

  logGameStart: (playerName) => {
    get().addLog({
      type: "game_start",
      message: `Game started! Welcome, ${playerName}. First to 5 hands wins!`,
      playerName,
    });
  },

  logHandStart: (handNumber, dealerName) => {
    get().addLog({
      type: "hand_start",
      message: `Hand ${handNumber} begins. ${dealerName} is dealing.`,
      playerName: dealerName,
    });
  },

  logTrumpRevealed: (trumpCard) => {
    get().addLog({
      type: "trump_revealed",
      message: `Trump card revealed: ${formatCard(trumpCard)}. ${trumpCard.suit.charAt(0).toUpperCase() + trumpCard.suit.slice(1)} are trumps!`,
      card: trumpCard,
      trumpSuit: trumpCard.suit,
    });
  },

  logCardPlayed: (playerName, card) => {
    get().addLog({
      type: "card_played",
      message: `${playerName} played ${formatCard(card)}`,
      playerName,
      card,
    });
  },

  logTrickWon: (playerName, points) => {
    get().addLog({
      type: "trick_won",
      message: `${playerName} wins the trick! (+${points} points)`,
      playerName,
      points,
    });
  },

  logHandWon: (teamId, score) => {
    const teamName = teamId === 1 ? "Team 1 (You & North)" : "Team 2 (East & West)";
    get().addLog({
      type: "hand_won",
      message: `${teamName} wins the hand with ${score} points!`,
      teamId,
      points: score,
    });
  },

  logGameWon: (teamId) => {
    const teamName = teamId === 1 ? "Team 1 (You & North)" : "Team 2 (East & West)";
    get().addLog({
      type: "game_won",
      message: `🏆 ${teamName} wins the game!`,
      teamId,
    });
  },

  logRobOffered: (playerName, trumpCard) => {
    get().addLog({
      type: "rob_offered",
      message: `${playerName} can rob the ${formatCard(trumpCard)}!`,
      playerName,
      card: trumpCard,
    });
  },

  logRobAccepted: (playerName, trumpCard) => {
    get().addLog({
      type: "rob_accepted",
      message: `${playerName} robbed the ${formatCard(trumpCard)}!`,
      playerName,
      card: trumpCard,
    });
  },

  logRobDeclined: (playerName) => {
    get().addLog({
      type: "rob_declined",
      message: `${playerName} declined to rob.`,
      playerName,
    });
  },

  logInvalidPlay: (playerName, reason) => {
    get().addLog({
      type: "invalid_play",
      message: `${playerName}: ${reason}`,
      playerName,
    });
  },

  logInfo: (message) => {
    get().addLog({
      type: "info",
      message,
    });
  },
}));
