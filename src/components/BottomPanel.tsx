import { View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
  teamIndex: number;
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
  const insets = useSafeAreaInsets();
  const suitColor = trumpSuit === "hearts" || trumpSuit === "diamonds" 
    ? colors.suits.hearts 
    : colors.suits.spades;
  const suitSymbol = SUIT_SYMBOLS[trumpSuit] ?? "?";

  const isValidMove = (card: CardType) => {
    return validMoves.some(
      (m) => m.suit === card.suit && m.rank === card.rank
    );
  };

  // Get scores - handle both team and individual modes
  const isTeamMode = players.length === 4 && players.some(p => p.teamIndex === 0) && players.some(p => p.teamIndex === 1);
  const team1Score = players.find(p => p.teamIndex === 0)?.score ?? 0;
  const team2Score = players.find(p => p.teamIndex === 1)?.score ?? 0;

  // For individual mode, find "You" score and best opponent
  const youPlayer = players.find(p => p.name === "You");
  const youScore = youPlayer?.score ?? 0;
  const bestOpp = players.filter(p => p.name !== "You").reduce((best, p) => p.score > best.score ? p : best, { name: "", score: 0, tricksWon: 0, teamIndex: 0 });

  return (
    <View
      style={{
        backgroundColor: colors.background.secondary,
        borderTopWidth: 1,
        borderTopColor: colors.softUI.border,
        paddingTop: 4,
        paddingBottom: Math.max(8, insets.bottom),
        paddingHorizontal: 8,
      }}
    >
      {/* Single row: Score | Cards | Trump */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        {/* Compact Score Display */}
        <View
          style={{
            backgroundColor: colors.background.primary,
            borderRadius: borderRadius.md,
            padding: 6,
            minWidth: 60,
            borderWidth: 1,
            borderColor: colors.softUI.border,
          }}
        >
          {isTeamMode ? (
            <>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.teams.team1.primary }} />
                <Text style={{ color: colors.teams.team1.light, fontSize: 14, fontWeight: "bold", marginLeft: 4 }}>
                  {team1Score}
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.teams.team2.primary }} />
                <Text style={{ color: colors.teams.team2.light, fontSize: 14, fontWeight: "bold", marginLeft: 4 }}>
                  {team2Score}
                </Text>
              </View>
            </>
          ) : (
            <>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
                <Text style={{ color: colors.teams.team1.light, fontSize: 10, fontWeight: "600" }}>You</Text>
                <Text style={{ color: colors.teams.team1.light, fontSize: 14, fontWeight: "bold", marginLeft: 4 }}>
                  {youScore}
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Text style={{ color: colors.text.muted, fontSize: 9 }} numberOfLines={1}>Best</Text>
                <Text style={{ color: colors.teams.team2.light, fontSize: 14, fontWeight: "bold", marginLeft: 4 }}>
                  {bestOpp.score}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Cards In Hand - centered, overlapping */}
        <View
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.background.surface,
            borderRadius: borderRadius.lg,
            paddingVertical: 4,
            paddingHorizontal: 8,
            minHeight: 70,
            borderWidth: 1,
            borderColor: isYourTurn ? colors.gold.primary : colors.softUI.border,
          }}
        >
          {cards.length > 0 ? (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              {cards.map((card, index) => {
                const valid = isValidMove(card);
                return (
                  <View
                    key={`${card.suit}-${card.rank}-${index}`}
                    style={{
                      marginLeft: index > 0 ? -35 : 0,
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
            </View>
          ) : (
            <Text style={{ color: colors.text.muted, fontSize: 11, fontStyle: "italic" }}>
              No cards
            </Text>
          )}
        </View>

        {/* Compact Trump Display */}
        <View
          style={{
            backgroundColor: colors.background.surface,
            borderRadius: borderRadius.md,
            padding: 4,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: colors.gold.dark,
            minWidth: 50,
          }}
        >
          <Text
            style={{
              color: colors.gold.primary,
              fontSize: 8,
              fontWeight: "600",
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            Trump
          </Text>
          <Text style={{ color: suitColor, fontSize: 22, marginTop: -2 }}>{suitSymbol}</Text>
        </View>
      </View>
    </View>
  );
}
