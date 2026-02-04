import { View, Text, type ViewStyle } from "react-native";
import Card from "./Card";
import PlayerInfoCard from "./PlayerInfoCard";
import type { Card as CardType } from "../game-logic/cards";
import type { TrickCard } from "../store/gameStore";
import { colors, shadows, borderRadius } from "../theme";

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
  playerCardCounts?: number[]; // Number of cards each player has
}

// Team index: 0 = your team (players 0, 2), 1 = opponent (players 1, 3)
const getTeamIndex = (playerIndex: number): 0 | 1 => {
  return playerIndex % 2 === 0 ? 0 : 1;
};

// Position styles for player info cards around the table
const positionStyles: Record<"top" | "left" | "right" | "bottom", ViewStyle> = {
  top: { top: 8, left: "50%", transform: [{ translateX: -60 }] },
  right: { right: 8, top: "50%", transform: [{ translateY: -45 }] },
  bottom: { bottom: 8, left: "50%", transform: [{ translateX: -60 }] },
  left: { left: 8, top: "50%", transform: [{ translateY: -45 }] },
};

// Position styles for face-down card stacks (placed near but offset from player info)
const cardStackPositions: Record<"top" | "left" | "right" | "bottom", ViewStyle> = {
  top: { top: 60, left: "50%", transform: [{ translateX: -25 }] },
  right: { right: 70, top: "50%", transform: [{ translateY: -25 }] },
  bottom: { bottom: 60, left: "50%", transform: [{ translateX: -25 }] },
  left: { left: 70, top: "50%", transform: [{ translateY: -25 }] },
};

// Component for face-down card stack representing a player's hand
function FaceDownCardStack({ cardCount, position }: { cardCount: number; position: "top" | "left" | "right" | "bottom" }) {
  if (cardCount === 0) return null;
  
  // Show stacked cards with slight offset to indicate multiple cards
  const isHorizontal = position === "left" || position === "right";
  
  return (
    <View style={{ flexDirection: isHorizontal ? "column" : "row" }}>
      {Array.from({ length: Math.min(cardCount, 5) }).map((_, index) => (
        <View
          key={index}
          style={[
            {
              width: 35,
              height: 50,
              backgroundColor: colors.card.back,
              borderRadius: 4,
              borderWidth: 1,
              borderColor: colors.gold.dark + "60",
              position: index === 0 ? "relative" : "absolute",
              zIndex: 5 - index,
            },
            index > 0 && (isHorizontal 
              ? { top: index * 3 } 
              : { left: index * 3 }
            ),
            shadows.card,
          ]}
        >
          {/* Card back design - simplified */}
          <View
            style={{
              flex: 1,
              margin: 2,
              backgroundColor: colors.card.back,
              borderRadius: 2,
              borderWidth: 1,
              borderColor: colors.gold.dark + "30",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <View 
              style={{ 
                width: 12, 
                height: 12, 
                transform: [{ rotate: "45deg" }],
                borderWidth: 1,
                borderColor: colors.gold.dark + "40",
              }} 
            />
          </View>
        </View>
      ))}
      {/* Card count badge */}
      <View
        style={{
          position: "absolute",
          bottom: isHorizontal ? -8 : -6,
          right: isHorizontal ? -6 : -8,
          backgroundColor: colors.background.primary,
          borderRadius: 8,
          width: 16,
          height: 16,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1,
          borderColor: colors.gold.dark,
          zIndex: 10,
        }}
      >
        <Text style={{ color: colors.gold.primary, fontSize: 9, fontWeight: "bold" }}>
          {cardCount}
        </Text>
      </View>
    </View>
  );
}

export default function GameTable({
  currentTrick,
  playerNames,
  currentPlayer,
  trumpSuit,
  trumpCard,
  lastTrickWinner,
  leadPlayer,
  dealer = 0,
  playerScores = [],
  playerCardCounts = [5, 5, 5, 5], // Default to 5 cards each
}: GameTableProps) {
  // Position definitions for 4 players
  const positions: Array<{ pos: "top" | "left" | "right" | "bottom"; idx: number }> = [
    { pos: "top", idx: 0 },
    { pos: "right", idx: 1 },
    { pos: "bottom", idx: 2 },
    { pos: "left", idx: 3 },
  ];

  return (
    <View className="flex-1 m-3 overflow-hidden">
      {/* Table outer edge - wood with gold accent */}
      <View 
        className="flex-1 rounded-[36px] p-2"
        style={{
          backgroundColor: colors.table.wood,
          ...shadows.table,
          borderWidth: 2,
          borderColor: colors.gold.dark,
        }}
      >
        {/* Table felt surface */}
        <View 
          className="flex-1 rounded-[28px] overflow-hidden"
          style={{
            backgroundColor: colors.table.felt,
            borderWidth: 3,
            borderColor: colors.table.feltDark,
          }}
        >
          {/* Subtle inner highlight */}
          <View 
            className="absolute inset-0"
            style={{
              borderWidth: 1,
              borderColor: colors.softUI.insetLight,
              borderRadius: 24,
            }}
          />
          
          {/* Center play area - trump card on left, played cards on right */}
          <View className="flex-1 flex-row justify-center items-center min-h-[180px]">
            {/* Trump Card Box */}
            {trumpCard && (
              <View
                style={{
                  alignItems: "center",
                  marginRight: 16,
                }}
              >
                <View
                  style={{
                    backgroundColor: "rgba(0,0,0,0.35)",
                    borderRadius: borderRadius.md,
                    padding: 6,
                    paddingTop: 4,
                    borderWidth: 1,
                    borderColor: colors.gold.dark + "60",
                    ...shadows.extruded.small,
                  }}
                >
                  <Text
                    style={{
                      color: colors.gold.primary,
                      fontSize: 9,
                      fontWeight: "600",
                      textAlign: "center",
                      marginBottom: 4,
                      letterSpacing: 1,
                      textTransform: "uppercase",
                    }}
                  >
                    Trump
                  </Text>
                  <Card card={trumpCard} faceUp size="small" />
                </View>
              </View>
            )}
            
            {/* Played Cards Area */}
            {currentTrick.length === 0 ? (
              <View className="items-center">
                <View 
                  className="w-20 h-20 rounded-full items-center justify-center"
                  style={{
                    backgroundColor: "rgba(0,0,0,0.2)",
                    borderWidth: 2,
                    borderColor: colors.gold.dark,
                    borderStyle: "dashed",
                  }}
                >
                  <Text style={{ color: colors.text.muted, fontSize: 12, textAlign: "center" }}>
                    Play a{"\n"}card
                  </Text>
                </View>
              </View>
            ) : (
              <View className="flex-row flex-wrap justify-center gap-2 p-3">
                {currentTrick.map((tc, i) => {
                  const teamIndex = getTeamIndex(tc.playerIndex);
                  const teamColor = teamIndex === 0 ? colors.teams.team1 : colors.teams.team2;
                  const isWinner = lastTrickWinner === tc.playerIndex;
                  
                  return (
                    <View 
                      key={i} 
                      className="items-center"
                      style={{
                        transform: [{ scale: isWinner ? 1.05 : 1 }],
                      }}
                    >
                      <Card card={tc.card} faceUp size="small" />
                      <View 
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginTop: 4,
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: 10,
                          backgroundColor: teamColor.bg,
                        }}
                      >
                        <View 
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: teamColor.primary,
                            marginRight: 4,
                          }}
                        />
                        <Text style={{ color: teamColor.light, fontSize: 10 }}>
                          {playerNames[tc.playerIndex]}
                        </Text>
                        {isWinner && (
                          <Text style={{ color: colors.gold.primary, fontSize: 10, marginLeft: 4 }}>★</Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* Player Info Cards positioned around the table */}
          {positions.map(({ pos, idx }) => {
            const isCurrent = currentPlayer === idx;
            const isYou = idx === 2; // South position is "You"
            const teamIndex = getTeamIndex(idx);
            const isLeader = leadPlayer === idx;
            const isDealer = dealer === idx;
            
            // Get player data
            const playerData = playerScores[idx] || {
              name: playerNames[idx] || `Player ${idx + 1}`,
              score: 0,
              tricksWon: 0,
            };

            return (
              <View
                key={idx}
                style={[
                  { position: "absolute" } as ViewStyle,
                  positionStyles[pos],
                ]}
              >
                <PlayerInfoCard
                  name={playerData.name}
                  score={playerData.score}
                  tricksWon={playerData.tricksWon}
                  isCurrentPlayer={isCurrent}
                  isYou={isYou}
                  teamIndex={teamIndex}
                  position={pos}
                  isLeader={isLeader}
                  isDealer={isDealer}
                />
              </View>
            );
          })}

          {/* Face-down card stacks for each player (except "You" at bottom - their cards are in bottom panel) */}
          {positions
            .filter(({ idx }) => idx !== 2) // Don't show for "You" - their cards are visible in hand
            .map(({ pos, idx }) => (
              <View
                key={`cards-${idx}`}
                style={[
                  { position: "absolute" } as ViewStyle,
                  cardStackPositions[pos],
                ]}
              >
                <FaceDownCardStack 
                  cardCount={playerCardCounts[idx] ?? 0} 
                  position={pos}
                />
              </View>
            ))}
        </View>
      </View>
    </View>
  );
}
