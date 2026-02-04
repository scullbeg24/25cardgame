/**
 * Trump hierarchy - re-exports from cards.ts
 * 5♥ always highest, J of trump 2nd, A♥ 3rd, A of trump 4th, etc.
 */

export {
  isTrump,
  isAlwaysTrump,
  getTrumpRank,
  getNonTrumpRank,
  compareTrumpCards,
  compareLedSuitCards,
  getWinningCardIndex,
} from "./cards";
