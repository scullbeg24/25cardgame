/**
 * Card types and trump hierarchy for Irish card game "25"
 * Based on docs/25-card-game-rules.md
 */

export type Suit = "hearts" | "diamonds" | "clubs" | "spades";

export type Rank =
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "J"
  | "Q"
  | "K"
  | "A";

export interface Card {
  suit: Suit;
  rank: Rank;
}

/** Red suits: hearts, diamonds. Black suits: clubs, spades */
export const RED_SUITS: Suit[] = ["hearts", "diamonds"];
export const BLACK_SUITS: Suit[] = ["clubs", "spades"];

export function isRedSuit(suit: Suit): boolean {
  return RED_SUITS.includes(suit);
}

export function isBlackSuit(suit: Suit): boolean {
  return BLACK_SUITS.includes(suit);
}

/** 5♥ and A♥ are ALWAYS trump regardless of trump suit */
export function isAlwaysTrump(card: Card): boolean {
  return card.suit === "hearts" && (card.rank === "5" || card.rank === "A");
}

/** Check if card is in trump suit (including 5♥ and A♥ which are always trump) */
export function isTrump(card: Card, trumpSuit: Suit): boolean {
  return card.suit === trumpSuit || isAlwaysTrump(card);
}

/**
 * Get the trump rank for comparison (higher = wins).
 * 5♥ = highest, J of trump = 2nd, A♥ = 3rd, A of trump = 4th, then K, Q, then numerals.
 * Red suits: numerals descend (10 high, 2 low). Black suits: numerals ascend (2 low, 10 high).
 */
export function getTrumpRank(card: Card, trumpSuit: Suit): number {
  // 5♥ is always highest
  if (card.suit === "hearts" && card.rank === "5") return 1000;

  // Jack of trump is 2nd
  if (card.suit === trumpSuit && card.rank === "J") return 900;

  // A♥ is always 3rd
  if (card.suit === "hearts" && card.rank === "A") return 800;

  // Ace of trump (when not hearts) is 4th
  if (card.suit === trumpSuit && card.rank === "A") return 700;

  // King, Queen of trump
  if (card.suit === trumpSuit && card.rank === "K") return 600;
  if (card.suit === trumpSuit && card.rank === "Q") return 500;

  // Non-face trump cards
  const faceRanks: Rank[] = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
  const numeralRanks: Rank[] = ["2", "3", "4", "5", "6", "7", "8", "9", "10"];
  if (card.suit === trumpSuit && numeralRanks.includes(card.rank)) {
    const idx = numeralRanks.indexOf(card.rank);
    if (isBlackSuit(trumpSuit)) {
      // Black: 2=lowest (0), 10=highest (8)
      return 100 + idx;
    } else {
      // Red: 10=highest, 2=lowest - reverse
      return 100 + (8 - idx);
    }
  }

  return 0;
}

/**
 * Get non-trump rank for led suit comparison (higher = wins).
 * Hearts (when not trump): 5 and A are always trump, so not in this suit.
 * Standard order: K, Q, J, then numerals. Clubs/Spades: A,2,3,4,6,7,8,9,10 after J.
 */
export function getNonTrumpRank(card: Card, ledSuit: Suit): number {
  // 5♥ and A♥ are always trump - they wouldn't be played as non-trump in led suit
  if (isAlwaysTrump(card)) return 0;

  if (card.suit !== ledSuit) return 0;

  const faceOrder: Record<Rank, number> = {
    K: 100,
    Q: 90,
    J: 80,
    A: 70,
    "10": 60,
    "9": 50,
    "8": 40,
    "7": 30,
    "6": 20,
    "5": 15,
    "4": 12,
    "3": 10,
    "2": 5,
  };

  // Clubs and Spades: K,Q,J,A,2,3,4,6,7,8,9,10 (A after J, then ascending numerals)
  if (isBlackSuit(ledSuit)) {
    const blackOrder: Record<Rank, number> = {
      K: 100,
      Q: 90,
      J: 80,
      A: 75,
      "10": 10,
      "9": 9,
      "8": 8,
      "7": 7,
      "6": 6,
      "5": 0, // 5 not in clubs/spades when led (would be trump if hearts)
      "4": 4,
      "3": 3,
      "2": 2,
    };
    return blackOrder[card.rank] ?? 0;
  }

  // Hearts and Diamonds (when led as non-trump): K,Q,J,10,9,8,7,6,4,3,2
  // Note: 5 and A of hearts are always trump
  return faceOrder[card.rank] ?? 0;
}

/**
 * Compare two cards when one or both are trump. Returns positive if cardA wins, negative if cardB wins, 0 if equal.
 */
export function compareTrumpCards(
  cardA: Card,
  cardB: Card,
  trumpSuit: Suit
): number {
  const aIsTrump = isTrump(cardA, trumpSuit);
  const bIsTrump = isTrump(cardB, trumpSuit);

  if (aIsTrump && !bIsTrump) return 1;
  if (!aIsTrump && bIsTrump) return -1;
  if (!aIsTrump && !bIsTrump) return 0; // Neither trump - compare as led suit elsewhere

  return getTrumpRank(cardA, trumpSuit) - getTrumpRank(cardB, trumpSuit);
}

/**
 * Compare two cards of the same led suit (non-trump). Returns positive if cardA wins, negative if cardB wins.
 */
export function compareLedSuitCards(
  cardA: Card,
  cardB: Card,
  ledSuit: Suit
): number {
  return getNonTrumpRank(cardA, ledSuit) - getNonTrumpRank(cardB, ledSuit);
}

/**
 * Determine which card wins in a trick. Cards are in play order.
 * Returns the index (0-3) of the winning card.
 */
export function getWinningCardIndex(
  trick: Card[],
  ledSuit: Suit,
  trumpSuit: Suit
): number {
  let winnerIdx = 0;
  let highestTrumpRank = 0;
  let hasTrump = false;

  for (let i = 0; i < trick.length; i++) {
    const card = trick[i];
    if (isTrump(card, trumpSuit)) {
      const rank = getTrumpRank(card, trumpSuit);
      if (rank > highestTrumpRank) {
        highestTrumpRank = rank;
        winnerIdx = i;
        hasTrump = true;
      }
    } else if (!hasTrump && card.suit === ledSuit) {
      const rank = getNonTrumpRank(card, ledSuit);
      const currentRank = getNonTrumpRank(trick[winnerIdx], ledSuit);
      if (rank > currentRank) {
        winnerIdx = i;
      }
    }
  }

  return winnerIdx;
}

/** Create a standard 52-card deck */
export function createDeck(): Card[] {
  const suits: Suit[] = ["hearts", "diamonds", "clubs", "spades"];
  const ranks: Rank[] = [
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "J",
    "Q",
    "K",
    "A",
  ];

  const deck: Card[] = [];
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({ suit, rank });
    }
  }
  return deck;
}

/** Card id for React keys and comparison */
export function cardId(card: Card): string {
  return `${card.suit}-${card.rank}`;
}
