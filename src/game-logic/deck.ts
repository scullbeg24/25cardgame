/**
 * Deck operations for Irish card game "25"
 * Fisher-Yates shuffle, deal cards to variable players, trump reveal
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
 * Deal 5 cards to each player.
 * Next card is turned face-up for trump. Remainder forms the pack.
 * @param numPlayers - Number of players (2-10)
 */
export function dealCards(numPlayers: number = 4): DealResult {
  const deck = shuffleDeck([...createDeck()]);
  const cardsPerPlayer = 5;
  const totalCards = numPlayers * cardsPerPlayer;

  const hands: Card[][] = Array.from({ length: numPlayers }, () => []);
  for (let i = 0; i < totalCards; i++) {
    hands[i % numPlayers].push(deck[i]);
  }

  const trumpCard = deck[totalCards];
  const pack = deck.slice(totalCards + 1);

  return { hands, trumpCard, pack };
}

/** Get trump suit from the face-up card */
export function getTrumpSuitFromCard(card: Card): Card["suit"] {
  return card.suit;
}

/**
 * Deal 5 more cards to each player from the pack.
 * Used when all tricks are played but no one has reached 25 points.
 * Returns new hands and remaining pack. Requires enough cards in pack.
 * @param pack - Remaining cards in the pack
 * @param numPlayers - Number of players (2-10)
 */
export function dealFromPack(pack: Card[], numPlayers: number = 4): { hands: Card[][]; remainingPack: Card[] } | null {
  const needed = numPlayers * 5;
  if (pack.length < needed) return null;
  const toDeal = pack.slice(0, needed);
  const remainingPack = pack.slice(needed);
  const hands: Card[][] = Array.from({ length: numPlayers }, () => []);
  for (let i = 0; i < needed; i++) {
    hands[i % numPlayers].push(toDeal[i]);
  }
  return { hands, remainingPack };
}
