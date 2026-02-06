/**
 * Rule validation for Irish card game "25"
 * isLegalPlay, canRenege, canRobPack
 */

import type { Card } from "./cards";
import type { Suit } from "./cards";
import { isTrump, isAlwaysTrump } from "./cards";

export interface RuleOptions {
  /** Allow robbing with 5♥ instead of Ace of trump (variation) */
  allowRobWithFiveHearts?: boolean;
  /** Enable reneging privilege for top 3 trumps */
  allowRenege?: boolean;
}

const DEFAULT_OPTIONS: RuleOptions = {
  allowRobWithFiveHearts: false,
  allowRenege: true,
};

/** Top 3 trumps: 5♥, Jack of trump, A♥ - these have reneging privilege */
function isTopThreeTrump(card: Card, trumpSuit: Suit): boolean {
  if (card.suit === "hearts" && card.rank === "5") return true;
  if (card.suit === "hearts" && card.rank === "A") return true;
  if (card.suit === trumpSuit && card.rank === "J") return true;
  return false;
}

/** Check if hand contains ONLY the top 3 trumps (no other cards) */
export function hasOnlyTopThreeTrumps(hand: Card[], trumpSuit: Suit): boolean {
  if (hand.length === 0) return false;
  return hand.every((c) => isTopThreeTrump(c, trumpSuit));
}

/** Check if player can renege (not play trump) when non-trump was led */
export function canRenege(
  hand: Card[],
  trumpSuit: Suit,
  _ledSuit: Suit,
  options: RuleOptions = {}
): boolean {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  if (!opts.allowRenege) return false;
  return hasOnlyTopThreeTrumps(hand, trumpSuit);
}

/** Check if dealer can rob the pack */
export function canRobPack(
  hand: Card[],
  trumpCard: Card,
  options: RuleOptions = {}
): boolean {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const trumpSuit = trumpCard.suit;

  const hasAceOfTrump = hand.some(
    (c) => c.suit === trumpSuit && c.rank === "A"
  );
  if (hasAceOfTrump) return true;

  if (opts.allowRobWithFiveHearts && trumpSuit === "hearts") {
    return hand.some((c) => c.suit === "hearts" && c.rank === "5");
  }

  return false;
}

/**
 * Check if the turned-up trump card is an Ace (dealer must take it).
 */
export function isTrumpCardAce(trumpCard: Card): boolean {
  return trumpCard.rank === "A";
}

/**
 * Check if a player can "rob the Ace" - take the turned-up trump card.
 * A player with the Ace of trumps may take the trump card on their turn to play their first card.
 * @param hand - Player's hand
 * @param trumpCard - The turned-up trump card
 * @param options - Rule options
 * @returns Whether the player can rob
 */
export function canRobAce(
  hand: Card[],
  trumpCard: Card,
  options: RuleOptions = {}
): boolean {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const trumpSuit = trumpCard.suit;

  // Player must have the Ace of trumps to rob
  const hasAceOfTrump = hand.some(
    (c) => c.suit === trumpSuit && c.rank === "A"
  );
  
  if (hasAceOfTrump) return true;

  if (opts.allowRobWithFiveHearts && trumpSuit === "hearts") {
    return hand.some((c) => c.suit === "hearts" && c.rank === "5");
  }

  return false;
}

/**
 * Find all players who can rob the Ace, in play order starting from the player after dealer.
 * @param hands - Array of player hands (index 0-3)
 * @param trumpCard - The turned-up trump card
 * @param dealer - Dealer's player index
 * @param options - Rule options
 * @returns Array of player indices who can rob, in order of priority
 */
export function findPlayersWhoCanRob(
  hands: Card[][],
  trumpCard: Card,
  dealer: number,
  options: RuleOptions = {}
): number[] {
  const canRobList: number[] = [];
  
  // If trump card is an Ace, only the dealer can take it (and must)
  if (isTrumpCardAce(trumpCard)) {
    return [dealer]; // Dealer must take the Ace
  }

  // Check each player starting from player after dealer
  for (let i = 1; i <= 4; i++) {
    const playerIndex = (dealer + i) % 4;
    if (canRobAce(hands[playerIndex], trumpCard, options)) {
      canRobList.push(playerIndex);
    }
  }

  return canRobList;
}

export interface PlayValidation {
  valid: boolean;
  error?: string;
}

/**
 * Validate if a card can be played.
 * @param card - The card to play
 * @param hand - Player's current hand (must include the card)
 * @param currentTrick - Cards played so far this trick (in order)
 * @param trumpSuit - Current trump suit
 * @param options - Rule variations
 */
export function isLegalPlay(
  card: Card,
  hand: Card[],
  currentTrick: Card[],
  trumpSuit: Suit,
  options: RuleOptions = {}
): PlayValidation {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Card must be in hand
  const cardInHand = hand.some(
    (c) => c.suit === card.suit && c.rank === card.rank
  );
  if (!cardInHand) {
    return { valid: false, error: "Card is not in your hand" };
  }

  // Leading - any card is legal
  if (currentTrick.length === 0) {
    return { valid: true };
  }

  const ledCard = currentTrick[0];
  const effectiveLedSuit: Suit = isTrump(ledCard, trumpSuit)
    ? trumpSuit
    : ledCard.suit;

  // Following suit: trump was led
  if (isTrump(ledCard, trumpSuit)) {
    const hasTrump = hand.some((c) => isTrump(c, trumpSuit));
    if (hasTrump && !isTrump(card, trumpSuit)) {
      return { valid: false, error: "You must play trump when trump was led" };
    }
    return { valid: true };
  }

  // Following suit: non-trump was led
  const hasLedSuit = hand.some(
    (c) => c.suit === effectiveLedSuit && !isAlwaysTrump(c)
  );
  // 5♥ and A♥ are always trump - they don't "follow" a non-trump lead
  const hasLedSuitIncludingAlwaysTrump = hand.some((c) => {
    if (isAlwaysTrump(c)) return false;
    return c.suit === effectiveLedSuit;
  });

  if (hasLedSuitIncludingAlwaysTrump) {
    // Must follow suit OR play trump
    // Playing trump is always allowed
    if (isTrump(card, trumpSuit)) {
      return { valid: true };
    }
    // Must follow suit if not playing trump
    if (card.suit !== effectiveLedSuit) {
      return { valid: false, error: "You must follow the led suit or play trump" };
    }
    return { valid: true };
  }

  // Cannot follow suit - may play any card (including trump)
  // Exception: reneging - if holding ONLY top 3 trumps, can play any of them
  return { valid: true };
}

/**
 * Get all legal plays for a player.
 */
export function getValidMoves(
  hand: Card[],
  currentTrick: Card[],
  trumpSuit: Suit,
  options: RuleOptions = {}
): Card[] {
  return hand.filter((card) => {
    const result = isLegalPlay(card, hand, currentTrick, trumpSuit, options);
    return result.valid;
  });
}
