/**
 * Shared types for flexible player count and team system.
 * Supports 2-9 players with 2 teams, 3 teams, or free-for-all.
 */

import type { AIDifficulty } from "../utils/constants";

/** How players are grouped into teams */
export type TeamMode = "two-teams" | "three-teams" | "ffa";

/** Scores keyed by team ID (0-indexed) */
export type TeamScores = Record<number, number>;

/** Hands won keyed by team ID (0-indexed) */
export type TeamHandsWon = Record<number, number>;

/** Assignment of players to teams */
export interface TeamAssignment {
  teamMode: TeamMode;
  /** Map from playerIndex to teamId (0-indexed) */
  playerTeams: number[];
  /** Number of distinct teams */
  teamCount: number;
}

/** Configuration for a new game */
export interface GameConfig {
  playerCount: number;
  teamMode: TeamMode;
  humanPlayerIndex: number;
  aiDifficulty: AIDifficulty;
}

/**
 * Create team assignments for a given configuration.
 * - "two-teams": alternating (0,1,0,1,...) for even split
 * - "three-teams": round-robin (0,1,2,0,1,2,...)
 * - "ffa": each player is their own team (0,1,2,3,...)
 */
export function createTeamAssignment(
  playerCount: number,
  teamMode: TeamMode
): TeamAssignment {
  const playerTeams: number[] = [];
  let teamCount: number;

  switch (teamMode) {
    case "two-teams":
      teamCount = 2;
      for (let i = 0; i < playerCount; i++) {
        playerTeams.push(i % 2);
      }
      break;
    case "three-teams":
      teamCount = 3;
      for (let i = 0; i < playerCount; i++) {
        playerTeams.push(i % 3);
      }
      break;
    case "ffa":
      teamCount = playerCount;
      for (let i = 0; i < playerCount; i++) {
        playerTeams.push(i);
      }
      break;
  }

  return { teamMode, playerTeams, teamCount };
}

/** Create initial scores object (all zeros) for all teams */
export function createInitialScores(teamCount: number): TeamScores {
  const scores: TeamScores = {};
  for (let i = 0; i < teamCount; i++) {
    scores[i] = 0;
  }
  return scores;
}

/** Create initial hands-won object (all zeros) for all teams */
export function createInitialHandsWon(teamCount: number): TeamHandsWon {
  const hw: TeamHandsWon = {};
  for (let i = 0; i < teamCount; i++) {
    hw[i] = 0;
  }
  return hw;
}
