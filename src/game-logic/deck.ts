/**
 * Deck operations for Irish card game "25"
 * Fisher-Yates shuffle, deal 5 cards to 4 players, trump reveal
 */

import type { Card } from "./cards";
import { createDeck } from "./cards";

/**
 * Fisher-Yates shuffle - mutates array in place, returns it
 */
export function shuffleDeck(deck: Card[]): Card[] {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export interface DealResult {
  hands: Card[][];
  trumpCard: Card;
  pack: Card[];
}

/**
 * Deal 5 cards to each of 4 players.
 * Next card is turned face-up for trump. Remainder forms the pack.
 */
export function dealCards(): DealResult {
  const deck = shuffleDeck([...createDeck()]);

  const hands: Card[][] = [[], [], [], []];
  for (let i = 0; i < 20; i++) {
    hands[i % 4].push(deck[i]);
  }

  const trumpCard = deck[20];
  const pack = deck.slice(21);

  return { hands, trumpCard, pack };
}

/** Get trump suit from the face-up card */
export function getTrumpSuitFromCard(card: Card): Card["suit"] {
  return card.suit;
}

/**
 * Deal 5 more cards to each player from the pack.
 * Used when all tricks are played but neither team has reached 25 points.
 * Returns new hands and remaining pack. Requires at least 20 cards in pack.
 */
export function dealFromPack(pack: Card[]): { hands: Card[][]; remainingPack: Card[] } | null {
  if (pack.length < 20) return null;
  const toDeal = pack.slice(0, 20);
  const remainingPack = pack.slice(20);
  const hands: Card[][] = [[], [], [], []];
  for (let i = 0; i < 20; i++) {
    hands[i % 4].push(toDeal[i]);
  }
  return { hands, remainingPack };
}
