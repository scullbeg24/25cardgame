import { View, Text } from "react-native";
import { colors, shadows, borderRadius } from "../theme";
import Card from "./Card";
import type { Card as CardType, Suit } from "../game-logic/cards";

const SUIT_SYMBOLS: Record<string, string> = {
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
  spades: "♠",
};

interface Player {
  name: string;
  score: number;
  tricksWon: number;
  teamIndex: 0 | 1;
}

interface BottomPanelProps {
  // Scoreboard data
  players: Player[];
  
  // Trump data
  trumpCard: CardType | null;
  trumpSuit: Suit;
  
  // Cards in hand
  cards: CardType[];
  validMoves: CardType[];
  onCardSelect: (card: CardType) => void;
  isYourTurn: boolean;
}

export default function BottomPanel({
  players,
  trumpCard,
  trumpSuit,
  cards,
  validMoves,
  onCardSelect,
  isYourTurn,
}: BottomPanelProps) {
  const suitColor = trumpSuit === "hearts" || trumpSuit === "diamonds" 
    ? colors.suits.hearts 
    : colors.suits.spades;
  const suitSymbol = SUIT_SYMBOLS[trumpSuit] ?? "?";

  const isValidMove = (card: CardType) => {
    return validMoves.some(
      (m) => m.suit === card.suit && m.rank === card.rank
    );
  };

  // Group players by team for scoreboard
  const team1Players = players.filter(p => p.teamIndex === 0);
  const team2Players = players.filter(p => p.teamIndex === 1);

  return (
    <View
      style={{
        backgroundColor: colors.background.secondary,
        borderTopWidth: 1,
        borderTopColor: colors.softUI.border,
        paddingVertical: 6,
        paddingHorizontal: 8,
      }}
    >
      {/* Top row: Cards In Hand - compact horizontal layout */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.background.surface,
          borderRadius: borderRadius.lg,
          paddingVertical: 6,
          paddingHorizontal: 12,
          marginBottom: 6,
          ...shadows.extruded.small,
          borderWidth: 1,
          borderColor: isYourTurn ? colors.gold.primary : colors.softUI.border,
        }}
      >
        <Text
          style={{
            color: isYourTurn ? colors.gold.light : colors.gold.muted,
            fontSize: 10,
            fontWeight: "600",
            textTransform: "uppercase",
            letterSpacing: 1,
            marginRight: 12,
          }}
        >
          Your Hand
        </Text>
        
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {cards.map((card, index) => {
            const valid = isValidMove(card);
            return (
              <View
                key={`${card.suit}-${card.rank}-${index}`}
                style={{
                  marginLeft: index > 0 ? -30 : 0, // Overlap cards more for compact display
                  zIndex: index,
                }}
              >
                <Card
                  card={card}
                  faceUp
                  selectable={isYourTurn && valid}
                  validMove={valid && isYourTurn}
                  onPress={() => valid && isYourTurn && onCardSelect(card)}
                  size="small"
                />
              </View>
            );
          })}
          {cards.length === 0 && (
            <Text style={{ color: colors.text.muted, fontSize: 12, fontStyle: "italic" }}>
              No cards
            </Text>
          )}
        </View>
      </View>

      {/* Bottom row: Scoreboard and Trump */}
      <View style={{ flexDirection: "row", gap: 8 }}>
        {/* Scoreboard Section - Larger with team grouping */}
        <View
          style={{
            flex: 1,
            backgroundColor: colors.background.primary,
            borderRadius: borderRadius.lg,
            padding: 10,
            borderWidth: 1,
            borderColor: colors.softUI.border,
          }}
        >
          <Text
            style={{
              color: colors.gold.muted,
              fontSize: 11,
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 8,
              textAlign: "center",
            }}
          >
            Scoreboard
          </Text>
          
          <View style={{ flexDirection: "row", gap: 12 }}>
            {/* Team 1 (Your Team) */}
            <View style={{ flex: 1 }}>
              <View 
                style={{ 
                  flexDirection: "row", 
                  alignItems: "center", 
                  marginBottom: 6,
                  paddingBottom: 4,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.teams.team1.primary + "40",
                }}
              >
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: colors.teams.team1.primary,
                    marginRight: 6,
                  }}
                />
                <Text style={{ color: colors.teams.team1.light, fontSize: 11, fontWeight: "600" }}>
                  Your Team
                </Text>
                <View
                  style={{
                    marginLeft: "auto",
                    backgroundColor: colors.teams.team1.bg,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 6,
                  }}
                >
                  <Text style={{ color: colors.teams.team1.light, fontSize: 14, fontWeight: "bold" }}>
                    {team1Players[0]?.score ?? 0}
                  </Text>
                </View>
              </View>
              {team1Players.map((player, index) => (
                <View
                  key={index}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingVertical: 2,
                  }}
                >
                  <Text
                    style={{ color: colors.text.secondary, fontSize: 11, flex: 1 }}
                    numberOfLines={1}
                  >
                    {player.name}
                  </Text>
                  <Text style={{ color: colors.gold.muted, fontSize: 10 }}>
                    {player.tricksWon} tricks
                  </Text>
                </View>
              ))}
            </View>

            {/* Divider */}
            <View style={{ width: 1, backgroundColor: colors.softUI.border }} />

            {/* Team 2 (Opponents) */}
            <View style={{ flex: 1 }}>
              <View 
                style={{ 
                  flexDirection: "row", 
                  alignItems: "center", 
                  marginBottom: 6,
                  paddingBottom: 4,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.teams.team2.primary + "40",
                }}
              >
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: colors.teams.team2.primary,
                    marginRight: 6,
                  }}
                />
                <Text style={{ color: colors.teams.team2.light, fontSize: 11, fontWeight: "600" }}>
                  Opponents
                </Text>
                <View
                  style={{
                    marginLeft: "auto",
                    backgroundColor: colors.teams.team2.bg,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 6,
                  }}
                >
                  <Text style={{ color: colors.teams.team2.light, fontSize: 14, fontWeight: "bold" }}>
                    {team2Players[0]?.score ?? 0}
                  </Text>
                </View>
              </View>
              {team2Players.map((player, index) => (
                <View
                  key={index}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingVertical: 2,
                  }}
                >
                  <Text
                    style={{ color: colors.text.secondary, fontSize: 11, flex: 1 }}
                    numberOfLines={1}
                  >
                    {player.name}
                  </Text>
                  <Text style={{ color: colors.gold.muted, fontSize: 10 }}>
                    {player.tricksWon} tricks
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Trump Section - Extruded/highlighted style */}
        <View
          style={{
            width: 70,
            backgroundColor: colors.background.surface,
            borderRadius: borderRadius.lg,
            padding: 6,
            alignItems: "center",
            justifyContent: "center",
            ...shadows.extruded.small,
            borderWidth: 2,
            borderColor: colors.gold.dark,
          }}
        >
          <Text
            style={{
              color: colors.gold.primary,
              fontSize: 9,
              fontWeight: "600",
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 4,
            }}
          >
            Trump
          </Text>
          
          {trumpCard ? (
            <View style={{ transform: [{ scale: 0.6 }], marginVertical: -12 }}>
              <Card card={trumpCard} faceUp size="small" />
            </View>
          ) : (
            <View
              style={{
                width: 40,
                height: 56,
                backgroundColor: colors.background.primary,
                borderRadius: borderRadius.sm,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: colors.softUI.border,
              }}
            >
              <Text style={{ color: suitColor, fontSize: 24 }}>{suitSymbol}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}
