/**
 * Scoring logic for Irish card game "25"
 * Trick winner, points calculation, game end conditions
 * Supports both team mode (4 players) and individual mode (2-3, 5-10 players)
 */

import type { Card } from "./cards";
import type { Suit } from "./cards";
import { getWinningCardIndex } from "./cards";
import type { ScoreMode } from "../utils/constants";
import { getScoringMode } from "../utils/constants";

export const POINTS_PER_TRICK = 5;
export const POINTS_TO_WIN_HAND = 25;
export const HANDS_TO_WIN_GAME = 5;

export interface TrickWithPlayers {
  cards: Card[];
  playerIndices: number[];
}

/** Unified scores type supporting both team and individual modes */
export interface Scores {
  mode: ScoreMode;
  /** Team mode scores (only used when mode === "team") */
  team1: number;
  team2: number;
  /** Individual mode scores indexed by player index */
  individual: number[];
}

/** Unified hands-won type supporting both team and individual modes */
export interface HandsWon {
  mode: ScoreMode;
  /** Team mode hands won (only used when mode === "team") */
  team1: number;
  team2: number;
  /** Individual mode hands won indexed by player index */
  individual: number[];
}

/** Create initial scores for a given player count */
export function createInitialScores(numPlayers: number): Scores {
  const mode = getScoringMode(numPlayers);
  return {
    mode,
    team1: 0,
    team2: 0,
    individual: Array(numPlayers).fill(0),
  };
}

/** Create initial hands-won tracker for a given player count */
export function createInitialHandsWon(numPlayers: number): HandsWon {
  const mode = getScoringMode(numPlayers);
  return {
    mode,
    team1: 0,
    team2: 0,
    individual: Array(numPlayers).fill(0),
  };
}

/**
 * Get the player index who won the trick.
 */
export function getTrickWinner(
  trick: Card[],
  ledSuit: Suit,
  trumpSuit: Suit,
  firstPlayerIndex: number,
  numPlayers: number = 4
): number {
  const winningCardIdx = getWinningCardIndex(trick, ledSuit, trumpSuit);
  return (firstPlayerIndex + winningCardIdx) % numPlayers;
}

/**
 * Calculate points for a trick (always 5 in standard 25)
 */
export function calculateTrickPoints(_trick: Card[]): number {
  return POINTS_PER_TRICK;
}

/**
 * Get team for a player index (only meaningful in team mode).
 * Team 1: even indices (0,2). Team 2: odd indices (1,3).
 */
export function getTeamForPlayer(playerIndex: number, mode: ScoreMode = "team"): 1 | 2 | null {
  if (mode === "individual") return null;
  return (playerIndex % 2 === 0 ? 1 : 2) as 1 | 2;
}

/**
 * Add trick points to scores. Returns updated scores.
 */
export function addTrickPoints(
  scores: Scores,
  winningPlayerIndex: number,
  points: number = POINTS_PER_TRICK
): Scores {
  if (scores.mode === "team") {
    const team = getTeamForPlayer(winningPlayerIndex, "team")!;
    return {
      ...scores,
      team1: scores.team1 + (team === 1 ? points : 0),
      team2: scores.team2 + (team === 2 ? points : 0),
    };
  } else {
    const newIndividual = [...scores.individual];
    newIndividual[winningPlayerIndex] += points;
    return { ...scores, individual: newIndividual };
  }
}

/**
 * Check if someone has won the hand (reached target points).
 * Returns: team number (1|2) in team mode, player index in individual mode, or null.
 */
export function checkHandWinner(
  scores: Scores,
  numPlayers: number = 4,
  targetScore: number = POINTS_TO_WIN_HAND
): number | null {
  if (scores.mode === "team") {
    if (scores.team1 >= targetScore) return 1;
    if (scores.team2 >= targetScore) return 2;
    return null;
  } else {
    for (let i = 0; i < numPlayers; i++) {
      if (scores.individual[i] >= targetScore) return i;
    }
    return null;
  }
}

/**
 * Check if someone has won the game (5 hands).
 * Returns: team number (1|2) in team mode, player index in individual mode, or null.
 */
export function checkGameWinner(
  handsWon: HandsWon,
  numPlayers: number = 4
): number | null {
  if (handsWon.mode === "team") {
    if (handsWon.team1 >= HANDS_TO_WIN_GAME) return 1;
    if (handsWon.team2 >= HANDS_TO_WIN_GAME) return 2;
    return null;
  } else {
    for (let i = 0; i < numPlayers; i++) {
      if (handsWon.individual[i] >= HANDS_TO_WIN_GAME) return i;
    }
    return null;
  }
}
