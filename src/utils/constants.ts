/**
 * Game constants for Irish card game "25"
 */

export const PLAYER_NAMES = ["North", "East", "South", "West"] as const;
/** @deprecated Use humanPlayerIndex from game state instead */
export const HUMAN_PLAYER_INDEX = 2; // South - bottom of screen

export type AIDifficulty = "easy" | "medium" | "hard";

// Player count limits
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 9;
export const CARDS_PER_PLAYER = 5;

// Pool of Irish AI names (up to 8 AI opponents)
export const AI_NAMES = [
  "Seamus", "Aoife", "Padraig", "Siobhan",
  "Cormac", "Niamh", "Declan", "Roisin",
] as const;
