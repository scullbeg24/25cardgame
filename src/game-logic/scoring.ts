/**
 * Scoring logic for Irish card game "25"
 * Trick winner, points calculation, game end conditions
 */

import type { Card } from "./cards";
import type { Suit } from "./cards";
import { getWinningCardIndex } from "./cards";

export const POINTS_PER_TRICK = 5;
export const POINTS_TO_WIN_HAND = 25;
export const HANDS_TO_WIN_GAME = 5;

export interface TrickWithPlayers {
  cards: Card[];
  playerIndices: number[];
}

/**
 * Get the player index (0-3) who won the trick.
 * playOrder: order cards were played [player0, player1, player2, player3]
 */
export function getTrickWinner(
  trick: Card[],
  ledSuit: Suit,
  trumpSuit: Suit,
  firstPlayerIndex: number
): number {
  const winningCardIdx = getWinningCardIndex(trick, ledSuit, trumpSuit);
  return (firstPlayerIndex + winningCardIdx) % 4;
}

/**
 * Calculate points for a trick (always 5 in standard 25)
 */
export function calculateTrickPoints(_trick: Card[]): number {
  return POINTS_PER_TRICK;
}

/**
 * Get team for a player index. Team 1: 0,2 (North, South). Team 2: 1,3 (East, West).
 */
export function getTeamForPlayer(playerIndex: number): 1 | 2 {
  return (playerIndex % 2 === 0 ? 1 : 2) as 1 | 2;
}

/**
 * Add trick points to team scores. Returns updated scores.
 */
export function addTrickPoints(
  scores: { team1: number; team2: number },
  winningPlayerIndex: number,
  points: number = POINTS_PER_TRICK
): { team1: number; team2: number } {
  const team = getTeamForPlayer(winningPlayerIndex);
  return {
    team1: scores.team1 + (team === 1 ? points : 0),
    team2: scores.team2 + (team === 2 ? points : 0),
  };
}

/**
 * Check if a team has won the hand (reached 25 points)
 */
export function checkHandWinner(
  scores: { team1: number; team2: number }
): 1 | 2 | null {
  if (scores.team1 >= POINTS_TO_WIN_HAND) return 1;
  if (scores.team2 >= POINTS_TO_WIN_HAND) return 2;
  return null;
}

/**
 * Check if a team has won the game (5 hands)
 */
export function checkGameWinner(
  handsWon: { team1: number; team2: number }
): 1 | 2 | null {
  if (handsWon.team1 >= HANDS_TO_WIN_GAME) return 1;
  if (handsWon.team2 >= HANDS_TO_WIN_GAME) return 2;
  return null;
}
