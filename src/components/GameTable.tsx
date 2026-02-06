import { View, Text, LayoutChangeEvent } from "react-native";
import { useState } from "react";
import Card from "./Card";
import PlayerInfoCard from "./PlayerInfoCard";
import type { Card as CardType } from "../game-logic/cards";
import type { TrickCard } from "../store/gameStore";
import { colors, shadows } from "../theme";

interface PlayerData {
  name: string;
  score: number;
  tricksWon: number;
  teamIndex?: 0 | 1;
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
  numPlayers?: number;
}

const CARD_W = 70;
const CARD_H = 98;

const getTeamIndex = (playerIndex: number): 0 | 1 => {
  return (playerIndex % 2 === 0 ? 0 : 1) as 0 | 1;
};

const getPlayerCard = (
  currentTrick: TrickCard[],
  playerIndex: number
): TrickCard | undefined => {
  return currentTrick.find((tc) => tc.playerIndex === playerIndex);
};

/**
 * Distribute N opponents across 3 sides: left, top, right.
 * Matching user's drawing: ~37.5% left, ~25% top, ~37.5% right.
 */
function distributeSeats(numOpponents: number): {
  left: number;
  top: number;
  right: number;
} {
  if (numOpponents <= 0) return { left: 0, top: 0, right: 0 };
  if (numOpponents === 1) return { left: 0, top: 1, right: 0 };
  if (numOpponents === 2) return { left: 1, top: 0, right: 1 };
  if (numOpponents === 3) return { left: 1, top: 1, right: 1 };

  const top = Math.max(1, Math.round(numOpponents * 0.25));
  const sides = numOpponents - top;
  const left = Math.ceil(sides / 2);
  const right = Math.floor(sides / 2);
  return { left, top, right };
}

interface SeatPosition {
  x: number;
  y: number;
  side: "left" | "top" | "right";
}

/**
 * Compute absolute positions for all opponent seats given table dimensions.
 * Left/right seats are evenly spaced vertically.
 * Top seats are centered horizontally.
 */
function computeSeatPositions(
  dist: { left: number; top: number; right: number },
  w: number,
  h: number,
  seatW: number,
  seatH: number
): SeatPosition[] {
  const seats: SeatPosition[] = [];
  const insetX = 6;
  const insetY = 6;

  // Left column: evenly spaced vertically
  for (let i = 0; i < dist.left; i++) {
    const step = h / (dist.left + 1);
    seats.push({
      x: insetX,
      y: step * (i + 1) - seatH / 2,
      side: "left",
    });
  }

  // Top row: centered horizontally
  if (dist.top > 0) {
    const gap = 8;
    const totalW = dist.top * seatW + (dist.top - 1) * gap;
    const startX = (w - totalW) / 2;
    for (let i = 0; i < dist.top; i++) {
      seats.push({
        x: startX + i * (seatW + gap),
        y: insetY,
        side: "top",
      });
    }
  }

  // Right column: evenly spaced vertically
  for (let i = 0; i < dist.right; i++) {
    const step = h / (dist.right + 1);
    seats.push({
      x: w - insetX - seatW,
      y: step * (i + 1) - seatH / 2,
      side: "right",
    });
  }

  return seats;
}

export default function GameTable({
  currentTrick,
  playerNames,
  currentPlayer,
  lastTrickWinner,
  leadPlayer,
  dealer = 0,
  playerScores = [],
  numPlayers = 4,
}: GameTableProps) {
  const [tableSize, setTableSize] = useState<{
    w: number;
    h: number;
  } | null>(null);

  const humanIndex = numPlayers - 1;

  // Badge scaling for high player counts; cards always render at native small size
  let badgeScale: number;
  if (numPlayers <= 4) {
    badgeScale = 1.0;
  } else if (numPlayers <= 6) {
    badgeScale = 0.9;
  } else if (numPlayers <= 8) {
    badgeScale = 0.85;
  } else {
    badgeScale = 0.78;
  }

  // Seat unit: badge + card stacked vertically (card at native small size)
  const badgeH = 30 * badgeScale;
  const seatW = CARD_W + 4; // card width + small padding
  const seatH = badgeH + 4 + CARD_H; // badge + gap + card

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

  const numOpponents = opponentIndices.length;
  const dist = distributeSeats(numOpponents);

  // Map opponent indices to sides: first `left` go left, next `top` go top, last `right` go right
  const leftOpponents = opponentIndices.slice(0, dist.left);
  const topOpponents = opponentIndices.slice(
    dist.left,
    dist.left + dist.top
  );
  const rightOpponents = opponentIndices.slice(dist.left + dist.top);

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
          {tableSize &&
            (() => {
              const { w, h } = tableSize;
              const seats = computeSeatPositions(dist, w, h, seatW, seatH);

              // Map seats back to ordered opponent list
              // seats order: left(0..L-1), top(L..L+T-1), right(L+T..end)
              const allOpponentsOrdered = [
                ...leftOpponents,
                ...topOpponents,
                ...rightOpponents,
              ];

              return (
                <>
                  {/* Opponent seats */}
                  {allOpponentsOrdered.map((playerIdx, seatIdx) => {
                    const seat = seats[seatIdx];
                    if (!seat) return null;

                    const teamIndex = getTeamIndex(playerIdx);
                    const playedCard = getPlayerCard(currentTrick, playerIdx);
                    const isWinner = lastTrickWinner === playerIdx;
                    const teamColor =
                      teamIndex === 0
                        ? colors.teams.team1
                        : colors.teams.team2;

                    const playerData = playerScores[playerIdx] || {
                      name:
                        playerNames[playerIdx] || `Player ${playerIdx + 1}`,
                      score: 0,
                      tricksWon: 0,
                    };

                    return (
                      <View
                        key={playerIdx}
                        style={{
                          position: "absolute",
                          left: seat.x,
                          top: seat.y,
                          width: seatW,
                          alignItems: "center",
                        }}
                      >
                        {/* Badge on top */}
                        <View
                          style={{
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
                            position={
                              seat.side === "left"
                                ? "left"
                                : seat.side === "right"
                                  ? "right"
                                  : "top"
                            }
                            isLeader={leadPlayer === playerIdx}
                            isDealer={dealer === playerIdx}
                          />
                        </View>

                        {/* Card below badge */}
                        <View style={{ marginTop: 4, zIndex: isWinner ? 8 : 5 }}>
                          {playedCard ? (
                            <View
                              style={{
                                borderWidth: isWinner ? 2 : 0,
                                borderColor: isWinner
                                  ? colors.gold.primary
                                  : "transparent",
                                borderRadius: 8,
                              }}
                            >
                              <Card
                                card={playedCard.card}
                                faceUp
                                size="small"
                              />
                            </View>
                          ) : (
                            <View
                              style={{
                                width: CARD_W,
                                height: CARD_H,
                                borderRadius: 8,
                                borderWidth: 1,
                                borderColor: teamColor.primary + "25",
                                borderStyle: "dashed",
                                backgroundColor: "rgba(0,0,0,0.04)",
                              }}
                            />
                          )}
                        </View>
                      </View>
                    );
                  })}

                  {/* Human's played card — centered at bottom */}
                  {(() => {
                    const humanCard = getPlayerCard(
                      currentTrick,
                      humanIndex
                    );
                    const isHumanWinner = lastTrickWinner === humanIndex;

                    return (
                      <View
                        style={{
                          position: "absolute",
                          left: w / 2 - CARD_W / 2,
                          bottom: 8,
                          zIndex: isHumanWinner ? 8 : 5,
                        }}
                      >
                        {humanCard ? (
                          <View
                            style={{
                              borderWidth: isHumanWinner ? 2 : 0,
                              borderColor: isHumanWinner
                                ? colors.gold.primary
                                : "transparent",
                              borderRadius: 8,
                            }}
                          >
                            <Card
                              card={humanCard.card}
                              faceUp
                              size="small"
                            />
                          </View>
                        ) : (
                          <View
                            style={{
                              width: CARD_W,
                              height: CARD_H,
                              borderRadius: 8,
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
