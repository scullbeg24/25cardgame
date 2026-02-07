/**
 * Scoring logic for Irish card game "25"
 * Trick winner, points calculation, game end conditions
 *
 * Supports both team-based (local) and individual (online) scoring.
 */

import type { Card } from "./cards";
import type { Suit } from "./cards";
import { getWinningCardIndex } from "./cards";
import type { TeamScores, TeamHandsWon } from "./types";

export const POINTS_PER_TRICK = 5;
export const POINTS_TO_WIN_HAND = 25;
export const HANDS_TO_WIN_GAME = 5;

export interface TrickWithPlayers {
  cards: Card[];
  playerIndices: number[];
}

/**
 * Get the player index who won the trick.
 */
export function getTrickWinner(
  trick: Card[],
  ledSuit: Suit,
  trumpSuit: Suit,
  firstPlayerIndex: number,
  playerCount: number = 4
): number {
  const winningCardIdx = getWinningCardIndex(trick, ledSuit, trumpSuit);
  return (firstPlayerIndex + winningCardIdx) % playerCount;
}

/**
 * Calculate points for a trick (always 5 in standard 25)
 */
export function calculateTrickPoints(_trick: Card[]): number {
  return POINTS_PER_TRICK;
}

/**
 * Get team for a player index using the team assignment array.
 */
export function getTeamForPlayer(
  playerIndex: number,
  playerTeams: number[]
): number {
  return playerTeams[playerIndex] ?? 0;
}

/**
 * Add trick points to team scores. Returns updated scores.
 */
export function addTrickPoints(
  scores: TeamScores,
  winningPlayerIndex: number,
  playerTeams: number[],
  points: number = POINTS_PER_TRICK
): TeamScores {
  const teamId = getTeamForPlayer(winningPlayerIndex, playerTeams);
  return {
    ...scores,
    [teamId]: (scores[teamId] ?? 0) + points,
  };
}

/**
 * Check if a team has won the hand (reached 25 points).
 * Returns the winning team ID or null.
 */
export function checkHandWinner(
  scores: TeamScores,
  teamCount: number
): number | null {
  for (let t = 0; t < teamCount; t++) {
    if ((scores[t] ?? 0) >= POINTS_TO_WIN_HAND) return t;
  }
  return null;
}

/**
 * Check if a team has won the game (5 hands).
 * Returns the winning team ID or null.
 */
export function checkGameWinner(
  handsWon: TeamHandsWon,
  teamCount: number
): number | null {
  for (let t = 0; t < teamCount; t++) {
    if ((handsWon[t] ?? 0) >= HANDS_TO_WIN_GAME) return t;
  }
  return null;
}

// ─── Individual Scoring (for online multiplayer, no teams) ─────────────

/**
 * Add trick points to individual scores array.
 * Returns a new array with the winner's score incremented.
 */
export function addTrickPointsIndividual(
  scores: number[],
  winnerIndex: number,
  points: number = POINTS_PER_TRICK
): number[] {
  return scores.map((s, i) => (i === winnerIndex ? s + points : s));
}

/**
 * Check if any individual player has reached the target score.
 * Returns the player index who won, or null.
 * If multiple players exceed target simultaneously, highest score wins.
 */
export function checkIndividualWinner(
  scores: number[],
  targetScore: number = POINTS_TO_WIN_HAND
): number | null {
  let maxScore = -1;
  let winner: number | null = null;

  for (let i = 0; i < scores.length; i++) {
    if (scores[i] >= targetScore && scores[i] > maxScore) {
      maxScore = scores[i];
      winner = i;
    }
  }

  return winner;
}

/**
 * Create initial individual scores array for N players (all zeros).
 */
export function createIndividualScores(numPlayers: number): number[] {
  return new Array(numPlayers).fill(0);
}
