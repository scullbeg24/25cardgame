import { View, Text, LayoutChangeEvent } from "react-native";
import { useState } from "react";
import Card from "./Card";
import PlayerInfoCard, { getPlayerColor } from "./PlayerInfoCard";
import type { Card as CardType } from "../game-logic/cards";
import type { TrickCard } from "../store/gameStore";
import { colors, shadows } from "../theme";
import type { ScoreMode } from "../utils/constants";

interface PlayerData {
  name: string;
  score: number;
  tricksWon: number;
  teamIndex?: number;
}

interface GameTableProps {
  currentTrick: TrickCard[];
  playerNames: string[];
  currentPlayer: number;
  trumpSuit: string;
  trumpCard?: CardType | null;
  lastTrickWinner?: number | null;
  leadPlayer: number;
  dealer?: number;
  playerScores?: PlayerData[];
  playerCardCounts?: number[];
  numPlayers: number;
  scoringMode: ScoreMode;
  robbedByPlayer?: number;
}

const getTeamIndex = (playerIndex: number, scoringMode: ScoreMode): number => {
  if (scoringMode === "team") return playerIndex % 2 === 0 ? 0 : 1;
  return playerIndex;
};

const getPlayerCard = (currentTrick: TrickCard[], playerIndex: number): TrickCard | undefined => {
  return currentTrick.find(tc => tc.playerIndex === playerIndex);
};

// Small card base: 70x98
const CARD_W = 70;
const CARD_H = 98;

interface SeatInfo {
  x: number;
  y: number;
  side: "left" | "top" | "right";
}

/**
 * Distribute N-1 opponents around 3 sides of the table (left, top, right).
 * Human is NOT placed — their card goes at the bottom center separately.
 *
 * Distribution: walk clockwise from bottom-left corner:
 *   left side (bottom→top) → top (left→right) → right side (top→bottom)
 */
function getOpponentSeats(
  opponents: number,
  w: number,
  h: number,
): SeatInfo[] {
  if (opponents === 0) return [];

  const inX = 6;
  const inY = 8;
  const left = inX;
  const right = w - inX;
  const top = inY;
  const bottom = h - inY;
  const usableH = bottom - top;
  const usableW = right - left;

  // Perimeter of 3 sides: left + top + right
  const perim = usableH + usableW + usableH;
  const step = perim / (opponents + 1); // +1 for spacing from corners

  const seats: SeatInfo[] = [];

  for (let i = 0; i < opponents; i++) {
    const d = step * (i + 1); // start at step, not 0 (avoid exact corner)
    let x: number, y: number;
    let side: SeatInfo["side"];

    if (d <= usableH) {
      // Left side: bottom → top
      x = left;
      y = bottom - d;
      side = "left";
    } else if (d <= usableH + usableW) {
      // Top: left → right
      const along = d - usableH;
      x = left + along;
      y = top;
      side = "top";
    } else {
      // Right side: top → bottom
      const along = d - usableH - usableW;
      x = right;
      y = top + along;
      side = "right";
    }

    seats.push({ x, y, side });
  }

  return seats;
}

/**
 * Compute badge and card positions for an opponent seat.
 * Badge sits on the edge. Card peeks out BELOW the badge (inward toward center),
 * partially overlapping — compact and clean.
 */
function getOpponentLayout(
  seat: SeatInfo,
  badgeW: number,
  badgeH: number,
  cardScale: number,
  tableW: number,
  tableH: number,
) {
  const sCW = CARD_W * cardScale;
  const sCH = CARD_H * cardScale;
  // Card overlaps badge by a bit — peeks out from under it
  const overlap = badgeH * 0.3;

  let bx: number, by: number, cx: number, cy: number;

  switch (seat.side) {
    case "top":
      // Badge at top, card below it (partially under)
      bx = seat.x - badgeW / 2;
      by = seat.y;
      cx = seat.x - sCW / 2;
      cy = by + badgeH - overlap;
      break;
    case "left":
      // Badge at left, card to its right (partially under)
      bx = seat.x;
      by = seat.y - badgeH / 2;
      cx = bx + badgeW - overlap;
      cy = seat.y - sCH / 2;
      break;
    case "right":
      // Badge at right, card to its left (partially under)
      bx = seat.x - badgeW;
      by = seat.y - badgeH / 2;
      cx = bx - sCW + overlap;
      cy = seat.y - sCH / 2;
      break;
  }

  // Clamp within table
  bx = Math.max(2, Math.min(bx, tableW - badgeW - 2));
  by = Math.max(2, Math.min(by, tableH - badgeH - 2));
  cx = Math.max(2, Math.min(cx, tableW - sCW - 2));
  cy = Math.max(2, Math.min(cy, tableH - sCH - 2));

  return { badgeX: bx, badgeY: by, cardX: cx, cardY: cy, scaledCW: sCW, scaledCH: sCH };
}

export default function GameTable({
  currentTrick,
  playerNames,
  currentPlayer,
  lastTrickWinner,
  leadPlayer,
  dealer = 0,
  playerScores = [],
  numPlayers,
  scoringMode,
  robbedByPlayer = -1,
}: GameTableProps) {
  const [tableSize, setTableSize] = useState<{ w: number; h: number } | null>(null);
  const humanIndex = numPlayers - 1;

  // Scaling tiers
  let badgeScale: number, cardScale: number;
  if (numPlayers <= 4) {
    badgeScale = 1.0; cardScale = 0.55;
  } else if (numPlayers <= 6) {
    badgeScale = 0.9; cardScale = 0.50;
  } else if (numPlayers <= 8) {
    badgeScale = 0.82; cardScale = 0.45;
  } else {
    badgeScale = 0.75; cardScale = 0.42;
  }

  const badgeW = 110 * badgeScale;
  const badgeH = 28 * badgeScale;

  const handleLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setTableSize({ w: width, h: height });
    }
  };

  // Build ordered list of opponent indices (clockwise from human's left)
  const opponentIndices: number[] = [];
  for (let i = 1; i < numPlayers; i++) {
    opponentIndices.push((humanIndex + i) % numPlayers);
  }

  return (
    <View style={{ flex: 1, margin: 8 }}>
      {/* Table outer edge — wood with gold accent */}
      <View
        style={{
          flex: 1,
          borderRadius: 20,
          padding: 4,
          backgroundColor: colors.table.wood,
          ...shadows.table,
          borderWidth: 2,
          borderColor: colors.gold.dark,
        }}
      >
        {/* Table felt surface */}
        <View
          style={{
            flex: 1,
            borderRadius: 16,
            backgroundColor: colors.table.felt,
            borderWidth: 2,
            borderColor: colors.table.feltDark,
            overflow: "hidden",
          }}
          onLayout={handleLayout}
        >
          {tableSize && (() => {
            const { w, h } = tableSize;
            const opponentSeats = getOpponentSeats(opponentIndices.length, w, h);

            return (
              <>
                {/* Opponent seats: badge on edge, card peeking out beneath */}
                {opponentIndices.map((playerIdx, seatIdx) => {
                  const seat = opponentSeats[seatIdx];
                  if (!seat) return null;

                  const teamIndex = getTeamIndex(playerIdx, scoringMode);
                  const playedCard = getPlayerCard(currentTrick, playerIdx);
                  const isWinner = lastTrickWinner === playerIdx;
                  const layout = getOpponentLayout(seat, badgeW, badgeH, cardScale, w, h);
                  const playerColor = getPlayerColor(playerIdx, scoringMode === "team" ? teamIndex : undefined);

                  const playerData = playerScores[playerIdx] || {
                    name: playerNames[playerIdx] || `Player ${playerIdx + 1}`,
                    score: 0,
                    tricksWon: 0,
                  };

                  return (
                    <View key={playerIdx}>
                      {/* Card slot — rendered FIRST so badge sits ON TOP */}
                      <View
                        style={{
                          position: "absolute",
                          left: layout.cardX,
                          top: layout.cardY,
                          width: layout.scaledCW,
                          height: layout.scaledCH,
                          zIndex: isWinner ? 8 : 5,
                        }}
                      >
                        {playedCard ? (
                          <View
                            style={{
                              transform: [{ scale: isWinner ? 1.06 : 1 }],
                              borderWidth: isWinner ? 2 : 0,
                              borderColor: isWinner ? colors.gold.primary : "transparent",
                              borderRadius: 6,
                              overflow: "hidden",
                            }}
                          >
                            <Card card={playedCard.card} faceUp size="small" />
                          </View>
                        ) : (
                          <View
                            style={{
                              width: layout.scaledCW,
                              height: layout.scaledCH,
                              borderRadius: 5,
                              borderWidth: 1,
                              borderColor: playerColor.primary + "25",
                              borderStyle: "dashed",
                              backgroundColor: "rgba(0,0,0,0.04)",
                            }}
                          />
                        )}
                      </View>

                      {/* Player badge — ON TOP of card */}
                      <View
                        style={{
                          position: "absolute",
                          left: layout.badgeX,
                          top: layout.badgeY,
                          transform: [{ scale: badgeScale }],
                          zIndex: 10,
                        }}
                      >
                        <PlayerInfoCard
                          name={playerData.name}
                          score={playerData.score}
                          tricksWon={playerData.tricksWon}
                          isCurrentPlayer={currentPlayer === playerIdx}
                          isYou={false}
                          teamIndex={teamIndex}
                          position={seat.side === "left" ? "left" : seat.side === "right" ? "right" : "top"}
                          isLeader={leadPlayer === playerIdx}
                          isDealer={dealer === playerIdx}
                          isRobber={robbedByPlayer === playerIdx}
                        />
                      </View>
                    </View>
                  );
                })}

                {/* Human's played card — centered at bottom of table */}
                {(() => {
                  const humanCard = getPlayerCard(currentTrick, humanIndex);
                  const isHumanWinner = lastTrickWinner === humanIndex;
                  const humanCardScale = cardScale;
                  const sCW = CARD_W * humanCardScale;
                  const sCH = CARD_H * humanCardScale;

                  return (
                    <View
                      style={{
                        position: "absolute",
                        left: w / 2 - sCW / 2,
                        bottom: 8,
                        width: sCW,
                        height: sCH,
                        zIndex: isHumanWinner ? 8 : 5,
                      }}
                    >
                      {humanCard ? (
                        <View
                          style={{
                            transform: [{ scale: isHumanWinner ? 1.06 : 1 }],
                            borderWidth: isHumanWinner ? 2 : 0,
                            borderColor: isHumanWinner ? colors.gold.primary : "transparent",
                            borderRadius: 6,
                            overflow: "hidden",
                          }}
                        >
                          <Card card={humanCard.card} faceUp size="small" />
                        </View>
                      ) : (
                        <View
                          style={{
                            width: sCW,
                            height: sCH,
                            borderRadius: 5,
                            borderWidth: 1,
                            borderColor: colors.gold.primary + "25",
                            borderStyle: "dashed",
                            backgroundColor: "rgba(0,0,0,0.04)",
                          }}
                        />
                      )}
                    </View>
                  );
                })()}
              </>
            );
          })()}
        </View>
      </View>
    </View>
  );
}
