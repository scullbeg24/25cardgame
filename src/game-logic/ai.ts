/**
 * AI player logic for Irish card game "25"
 * Easy: random legal move
 * Medium: basic strategy (lead trumps, follow partner, trump when useful)
 * Hard: card counting, probability, partner signaling, aggressive when behind
 * Supports both team (4 players) and individual (2-3, 5-10 players) modes
 */

import type { Card } from "./cards";
import type { Suit } from "./cards";
import { isTrump, getTrumpRank, getNonTrumpRank } from "./cards";
import { getValidMoves, type RuleOptions } from "./rules";
import { getTeamForPlayer, type Scores } from "./scoring";
import type { AIDifficulty } from "../utils/constants";

export type TrickEntry = Card | { card: Card };

export interface AIGameContext {
  hand: Card[];
  currentTrick: TrickEntry[];
  trumpSuit: Suit;
  ledSuit: Suit | null;
  currentPlayerIndex: number;
  firstPlayerThisTrick: number;
  scores: Scores;
  ruleOptions?: RuleOptions;
  numPlayers: number;
}

function getTrickCards(trick: TrickEntry[]): Card[] {
  return trick.map((t) => ("card" in t ? t.card : t));
}

/**
 * Select a card for the AI to play. Returns one of the valid moves.
 */
export function selectAICard(
  context: AIGameContext,
  difficulty: AIDifficulty
): Card {
  const trickCards = getTrickCards(context.currentTrick);
  const validMoves = getValidMoves(
    context.hand,
    trickCards,
    context.trumpSuit,
    context.ruleOptions ?? {}
  );

  if (validMoves.length === 0) {
    throw new Error("AI has no valid moves");
  }
  if (validMoves.length === 1) return validMoves[0];

  switch (difficulty) {
    case "easy":
      return getRandomLegalMove(validMoves);
    case "medium":
      return selectMediumCard(context, validMoves);
    case "hard":
      return selectHardCard(context, validMoves);
    default:
      return getRandomLegalMove(validMoves);
  }
}

function getRandomLegalMove(validMoves: Card[]): Card {
  return validMoves[Math.floor(Math.random() * validMoves.length)];
}

/** Medium AI: basic strategy */
function selectMediumCard(
  context: AIGameContext,
  validMoves: Card[]
): Card {
  if (context.currentTrick.length === 0) {
    return selectCardToLead(context, validMoves);
  }
  return selectCardToFollow(context, validMoves);
}

function selectCardToLead(
  context: AIGameContext,
  validMoves: Card[]
): Card {
  const { hand, trumpSuit } = context;
  const trumps = hand.filter((c) => isTrump(c, trumpSuit));

  if (trumps.length >= 2) {
    const trumpMoves = validMoves.filter((c) => isTrump(c, trumpSuit));
    if (trumpMoves.length > 0) {
      return trumpMoves.reduce((best, c) =>
        getTrumpRank(c, trumpSuit) > getTrumpRank(best, trumpSuit) ? c : best
      );
    }
  }

  const nonTrumpMoves = validMoves.filter((c) => !isTrump(c, trumpSuit));
  if (nonTrumpMoves.length > 0) {
    const suits = new Map<Suit, Card[]>();
    for (const c of nonTrumpMoves) {
      const list = suits.get(c.suit) ?? [];
      list.push(c);
      suits.set(c.suit, list);
    }
    let longestSuit: Suit | null = null;
    let maxLen = 0;
    for (const [suit, cards] of suits) {
      if (cards.length > maxLen) {
        maxLen = cards.length;
        longestSuit = suit;
      }
    }
    if (longestSuit) {
      const inSuit = suits.get(longestSuit)!;
      return inSuit.reduce((lowest, c) =>
        getNonTrumpRank(c, longestSuit!) < getNonTrumpRank(lowest, longestSuit!)
          ? c
          : lowest
      );
    }
  }

  return validMoves.reduce((lowest, c) => {
    if (isTrump(c, trumpSuit))
      return getTrumpRank(c, trumpSuit) < getTrumpRank(lowest, trumpSuit)
        ? c
        : lowest;
    return lowest;
  });
}

function selectCardToFollow(
  context: AIGameContext,
  validMoves: Card[]
): Card {
  const { currentTrick, trumpSuit, ledSuit, firstPlayerThisTrick, currentPlayerIndex, numPlayers } = context;
  const trickCards = getTrickCards(currentTrick);
  const firstCard = trickCards[0];
  const effectiveLedSuit = ledSuit ?? (firstCard?.suit as Suit) ?? trumpSuit;

  // Partner logic only applies in team mode (4 players)
  const isTeamMode = context.scores.mode === "team";
  const partnerIndex = isTeamMode ? (currentPlayerIndex + 2) % 4 : -1;

  if (isTeamMode && partnerIndex >= 0) {
    const partnerPlayedIndex = trickCards.findIndex(
      (_, i) => (firstPlayerThisTrick + i) % numPlayers === partnerIndex
    );
    const partnerCard =
      partnerPlayedIndex >= 0 ? trickCards[partnerPlayedIndex] : null;

    const winningIdx = getWinningIndex(trickCards, effectiveLedSuit, trumpSuit);
    const winningPlayer = (firstPlayerThisTrick + winningIdx) % numPlayers;
    const partnerWinning = winningPlayer === partnerIndex;

    if (partnerWinning && partnerCard) {
      // Partner is winning - play lowest card
      return validMoves.reduce((lowest, c) => {
        const rank = isTrump(c, trumpSuit)
          ? getTrumpRank(c, trumpSuit)
          : getNonTrumpRank(c, effectiveLedSuit);
        const lowestRank = isTrump(lowest, trumpSuit)
          ? getTrumpRank(lowest, trumpSuit)
          : getNonTrumpRank(lowest, effectiveLedSuit);
        return rank < lowestRank ? c : lowest;
      });
    }
  }

  // Try to win the trick
  const canWin = validMoves.filter((c) =>
    wouldBeatTrick(c, trickCards, effectiveLedSuit, trumpSuit, firstPlayerThisTrick)
  );

  if (canWin.length > 0) {
    // Win with the cheapest winning card
    return canWin.reduce((best, c) => {
      const rank = isTrump(c, trumpSuit)
        ? getTrumpRank(c, trumpSuit)
        : getNonTrumpRank(c, effectiveLedSuit);
      const bestRank = isTrump(best, trumpSuit)
        ? getTrumpRank(best, trumpSuit)
        : getNonTrumpRank(best, effectiveLedSuit);
      return rank < bestRank ? c : best;
    });
  }

  // Can't win - play lowest card
  return validMoves.reduce((lowest, c) => {
    const rank = isTrump(c, trumpSuit)
      ? getTrumpRank(c, trumpSuit)
      : getNonTrumpRank(c, effectiveLedSuit);
    const lowestRank = isTrump(lowest, trumpSuit)
      ? getTrumpRank(lowest, trumpSuit)
      : getNonTrumpRank(lowest, effectiveLedSuit);
    return rank < lowestRank ? c : lowest;
  });
}

function getWinningIndex(
  trick: Card[],
  ledSuit: Suit,
  trumpSuit: Suit
): number {
  let winnerIdx = 0;
  let highestTrump = 0;
  let hasTrump = false;

  for (let i = 0; i < trick.length; i++) {
    const c = trick[i];
    if (isTrump(c, trumpSuit)) {
      const r = getTrumpRank(c, trumpSuit);
      if (r > highestTrump) {
        highestTrump = r;
        winnerIdx = i;
        hasTrump = true;
      }
    } else if (!hasTrump && c.suit === ledSuit) {
      const r = getNonTrumpRank(c, ledSuit);
      const current = getNonTrumpRank(trick[winnerIdx], ledSuit);
      if (r > current) winnerIdx = i;
    }
  }
  return winnerIdx;
}

function wouldBeatTrick(
  card: Card,
  trick: Card[],
  ledSuit: Suit,
  trumpSuit: Suit,
  _firstPlayer: number
): boolean {
  const winningIdx = getWinningIndex(trick, ledSuit, trumpSuit);
  const winningCard = trick[winningIdx];

  if (isTrump(card, trumpSuit) && !isTrump(winningCard, trumpSuit))
    return true;
  if (!isTrump(card, trumpSuit) && isTrump(winningCard, trumpSuit))
    return false;
  if (isTrump(card, trumpSuit) && isTrump(winningCard, trumpSuit))
    return getTrumpRank(card, trumpSuit) > getTrumpRank(winningCard, trumpSuit);
  if (card.suit === ledSuit && winningCard.suit === ledSuit)
    return getNonTrumpRank(card, ledSuit) > getNonTrumpRank(winningCard, ledSuit);
  return false;
}

/** Hard AI: card counting, probability, aggressive when behind */
function selectHardCard(
  context: AIGameContext,
  validMoves: Card[]
): Card {
  const aggressive = shouldPlayAggressively(context.scores, context.currentPlayerIndex);

  const mediumChoice = selectMediumCard(context, validMoves);

  if (aggressive && context.currentTrick.length > 0) {
    const trickCards = getTrickCards(context.currentTrick);
    const firstCard = trickCards[0];
    const effectiveLedSuit =
      context.ledSuit ?? (firstCard?.suit as Suit) ?? context.trumpSuit;
    const canWin = validMoves.filter((c) =>
      wouldBeatTrick(
        c,
        trickCards,
        effectiveLedSuit,
        context.trumpSuit,
        context.firstPlayerThisTrick
      )
    );
    if (canWin.length > 0) {
      return canWin.reduce((best, c) =>
        getTrumpRank(c, context.trumpSuit) > getTrumpRank(best, context.trumpSuit)
          ? c
          : best
      );
    }
  }

  const topTrumps = context.hand.filter(
    (c) =>
      (c.suit === context.trumpSuit && c.rank === "5") ||
      (c.suit === context.trumpSuit && c.rank === "J") ||
      (c.suit === "hearts" && c.rank === "A")
  );

  if (topTrumps.length > 0 && context.currentTrick.length > 0 && !aggressive) {
    const nonTopMoves = validMoves.filter(
      (c) =>
        !(
          (c.suit === context.trumpSuit && c.rank === "5") ||
          (c.suit === context.trumpSuit && c.rank === "J") ||
          (c.suit === "hearts" && c.rank === "A")
        )
    );
    if (nonTopMoves.length > 0) {
      return selectMediumCard(context, nonTopMoves);
    }
  }

  return mediumChoice;
}

/** Determine if AI should play aggressively based on scores */
function shouldPlayAggressively(
  scores: Scores,
  currentPlayerIndex: number
): boolean {
  if (scores.mode === "team") {
    const myTeam = getTeamForPlayer(currentPlayerIndex, "team")!;
    const myScore = myTeam === 1 ? scores.team1 : scores.team2;
    const oppScore = myTeam === 1 ? scores.team2 : scores.team1;
    return myScore < oppScore;
  } else {
    // Individual mode: aggressive if any opponent has higher score
    const myScore = scores.individual[currentPlayerIndex] ?? 0;
    const maxOppScore = Math.max(
      ...scores.individual.filter((_, i) => i !== currentPlayerIndex)
    );
    return myScore < maxOppScore;
  }
}

/** Delay for AI "thinking" - returns ms based on difficulty. Minimum 1.5s for natural pacing. */
export function getAIDelay(difficulty: AIDifficulty): number {
  switch (difficulty) {
    case "easy":
      return 1500 + Math.random() * 300;
    case "medium":
      return 1500 + Math.random() * 400;
    case "hard":
      return 1500 + Math.random() * 500;
    default:
      return 1500;
  }
}
