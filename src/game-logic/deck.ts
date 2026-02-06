/**
 * Deck operations for Irish card game "25"
 * Fisher-Yates shuffle, deal cards to players, trump reveal
 */

import type { Card } from "./cards";
import { createDeck } from "./cards";
import { CARDS_PER_PLAYER } from "../utils/constants";

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
 * Deal 5 cards to each player.
 * Next card is turned face-up for trump. Remainder forms the pack.
 */
export function dealCards(playerCount: number = 4): DealResult {
  const deck = shuffleDeck([...createDeck()]);
  const cardsToDeal = playerCount * CARDS_PER_PLAYER;

  const hands: Card[][] = Array.from({ length: playerCount }, () => []);
  for (let i = 0; i < cardsToDeal; i++) {
    hands[i % playerCount].push(deck[i]);
  }

  const trumpCard = deck[cardsToDeal];
  const pack = deck.slice(cardsToDeal + 1);

  return { hands, trumpCard, pack };
}

/** Get trump suit from the face-up card */
export function getTrumpSuitFromCard(card: Card): Card["suit"] {
  return card.suit;
}

/**
 * Deal 5 more cards to each player from the pack.
 * Used when all tricks are played but no team has reached 25 points.
 * Returns new hands and remaining pack, or null if pack is too small.
 */
export function dealFromPack(
  pack: Card[],
  playerCount: number = 4
): { hands: Card[][]; remainingPack: Card[] } | null {
  const cardsNeeded = playerCount * CARDS_PER_PLAYER;
  if (pack.length < cardsNeeded) return null;
  const toDeal = pack.slice(0, cardsNeeded);
  const remainingPack = pack.slice(cardsNeeded);
  const hands: Card[][] = Array.from({ length: playerCount }, () => []);
  for (let i = 0; i < cardsNeeded; i++) {
    hands[i % playerCount].push(toDeal[i]);
  }
  return { hands, remainingPack };
}
