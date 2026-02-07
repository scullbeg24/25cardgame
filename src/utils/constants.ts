/**
 * Game constants for Irish card game "25"
 */

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 10;

export type AIDifficulty = "easy" | "medium" | "hard";
export type ScoreMode = "team" | "individual";

/** Pool of Irish bot names in "First name + Initial" format */
const IRISH_NAMES: string[] = [
  "Sean O",
  "Aoife M",
  "Ciaran B",
  "Niamh K",
  "Padraig D",
  "Siobhan R",
  "Declan F",
  "Roisin C",
  "Colm T",
  "Maeve L",
  "Oisin H",
  "Sinead W",
  "Eamon G",
  "Caoimhe N",
  "Lorcan P",
  "Grainne S",
  "Fionn J",
  "Aisling E",
  "Cormac A",
  "Sorcha Q",
  "Darragh V",
  "Orla I",
];

/** Human player is always the last index */
export function getHumanPlayerIndex(numPlayers: number): number {
  return numPlayers - 1;
}

/** Generate unique random bot names from the Irish name pool */
export function generateBotNames(count: number): string[] {
  const shuffled = [...IRISH_NAMES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/** 4 players = team mode (classic), all others = individual */
export function getScoringMode(numPlayers: number): ScoreMode {
  return numPlayers === 4 ? "team" : "individual";
}
