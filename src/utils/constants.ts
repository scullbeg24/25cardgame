/**
 * Game constants for Irish card game "25"
 */

export const PLAYER_NAMES = ["North", "East", "South", "West"] as const;
export const HUMAN_PLAYER_INDEX = 2; // South - bottom of screen

export type AIDifficulty = "easy" | "medium" | "hard";
