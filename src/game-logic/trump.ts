/**
 * Trump hierarchy - re-exports from cards.ts
 * 5 of trump suit highest, J of trump 2nd, A♥ 3rd (when not hearts), A of trump 4th, etc.
 * 5♥ only has special value when hearts are trump.
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
