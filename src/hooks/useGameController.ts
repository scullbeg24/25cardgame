/**
 * useGameController — Unified game interface for local and online modes.
 *
 * Returns the same shape regardless of mode, so GameScreen doesn't need
 * to know which store is driving the game.
 *
 * - mode === "local":  reads from gameStore, calls gameStore actions
 * - mode === "online": reads from onlineGameStore, maps to same shape
 */

import { useMemo } from "react";
import { useGameStore, type GamePhase, type TrickCard, type Player } from "../store/gameStore";
import {
  useOnlineGameStore,
  type OnlineGamePhase,
} from "../store/onlineGameStore";
import type { Card, Suit } from "../game-logic/cards";
import type { RuleOptions } from "../game-logic/rules";

export interface GameControllerState {
  // Players
  players: Player[];
  numPlayers: number;
  humanPlayerIndex: number;

  // Game state
  trumpSuit: Suit;
  trumpCard: Card | null;
  currentTrick: TrickCard[];
  currentPlayer: number;
  dealer: number;
  firstPlayerThisTrick: number;
  gamePhase: GamePhase;
  validMoves: Card[];
  ruleOptions: RuleOptions;

  // Scoring — team-based for local, individual for online
  scores: { team1: number; team2: number };
  handsWon: { team1: number; team2: number };
  individualScores: number[];

  // Robbing
  robberIndex: number;
  playersWhoCanRob: number[];
  robbed: boolean;
  trumpCardIsAce: boolean;

  // Online-specific
  isMyTurn: boolean;
  isOnline: boolean;

  // Actions
  playCard: (playerId: number, card: Card) => { success: boolean; error?: string } | void;
  completeTrick: () => void;
  completeHand: () => void;
  robPack: (cardToDiscard: Card) => void;
  declineRob: () => void;
}

function mapOnlinePhase(phase: OnlineGamePhase): GamePhase {
  switch (phase) {
    case "waiting":
      return "setup";
    case "dealing":
      return "dealing";
    case "robbing":
      return "robbing";
    case "playing":
      return "playing";
    case "trickComplete":
      return "trickComplete";
    case "handComplete":
      return "handComplete";
    case "gameOver":
      return "gameOver";
    default:
      return "setup";
  }
}

export function useGameController(
  mode: "local" | "online"
): GameControllerState {
  // ─── Local mode ─────────────────────────────────────────────
  const localStore = useGameStore();

  // ─── Online mode ────────────────────────────────────────────
  const onlineStore = useOnlineGameStore();

  const result = useMemo((): GameControllerState => {
    if (mode === "online") {
      const gs = onlineStore.gameState;
      const mySlot = onlineStore.mySlot ?? 0;
      const numPlayers = gs?.numPlayers ?? 4;

      // Build Player[] from online game state
      const players: Player[] = [];
      for (let i = 0; i < numPlayers; i++) {
        players.push({
          id: i,
          name: gs?.playerNames[i] ?? `Player ${i + 1}`,
          hand: gs?.hands[i] ?? [],
          teamId: (i % 2 === 0 ? 1 : 2) as 1 | 2,
          isAI: false, // No AI in online mode
        });
      }

      // Convert individual scores to team scores (for UI compat)
      const individualScores = gs?.scores ?? [];
      const team1Score = individualScores.reduce(
        (sum, s, i) => (i % 2 === 0 ? sum + s : sum),
        0
      );
      const team2Score = individualScores.reduce(
        (sum, s, i) => (i % 2 !== 0 ? sum + s : sum),
        0
      );

      return {
        players,
        numPlayers,
        humanPlayerIndex: mySlot,

        trumpSuit: gs?.trumpSuit ?? "hearts",
        trumpCard: gs?.trumpCard ?? null,
        currentTrick: gs?.currentTrick ?? [],
        currentPlayer: gs?.currentPlayer ?? 0,
        dealer: gs?.dealer ?? 0,
        firstPlayerThisTrick: gs?.firstPlayerThisTrick ?? 0,
        gamePhase: mapOnlinePhase(gs?.phase ?? "waiting"),
        validMoves: onlineStore.validMoves,
        ruleOptions: gs?.ruleOptions ?? {},

        scores: { team1: team1Score, team2: team2Score },
        handsWon: { team1: 0, team2: 0 }, // Not tracked in individual mode
        individualScores,

        robberIndex: gs?.robberIndex ?? -1,
        playersWhoCanRob: gs?.playersWhoCanRob ?? [],
        robbed: gs?.robbed ?? false,
        trumpCardIsAce: gs?.trumpCardIsAce ?? false,

        isMyTurn: onlineStore.isMyTurn,
        isOnline: true,

        playCard: (_playerId: number, card: Card) => {
          onlineStore.submitPlayCard(card);
          return { success: true };
        },
        completeTrick: () => {
          if (onlineStore.isHost) {
            onlineStore.completeTrick();
          }
          // Clients don't call completeTrick — host does it
        },
        completeHand: () => {
          if (onlineStore.isHost) {
            onlineStore.completeHand();
          }
        },
        robPack: (cardToDiscard: Card) => {
          onlineStore.submitRob(cardToDiscard);
        },
        declineRob: () => {
          onlineStore.submitDeclineRob();
        },
      };
    }

    // ─── Local mode (existing gameStore) ────────────────────────
    return {
      players: localStore.players,
      numPlayers: localStore.players.length || 4,
      humanPlayerIndex: 2, // HUMAN_PLAYER_INDEX constant

      trumpSuit: localStore.trumpSuit,
      trumpCard: localStore.trumpCard,
      currentTrick: localStore.currentTrick,
      currentPlayer: localStore.currentPlayer,
      dealer: localStore.dealer,
      firstPlayerThisTrick: localStore.firstPlayerThisTrick,
      gamePhase: localStore.gamePhase,
      validMoves: localStore.validMoves,
      ruleOptions: localStore.ruleOptions,

      scores: localStore.scores,
      handsWon: localStore.handsWon,
      individualScores: [],

      robberIndex: localStore.robberIndex,
      playersWhoCanRob: localStore.playersWhoCanRob,
      robbed: localStore.robbed,
      trumpCardIsAce: localStore.trumpCardIsAce,

      isMyTurn: localStore.currentPlayer === 2 && localStore.gamePhase === "playing",
      isOnline: false,

      playCard: localStore.playCard,
      completeTrick: localStore.completeTrick,
      completeHand: localStore.completeHand,
      robPack: localStore.robPack,
      declineRob: localStore.declineRob,
    };
  }, [mode, localStore, onlineStore]);

  return result;
}
