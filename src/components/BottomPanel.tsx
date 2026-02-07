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

interface BottomPanelProps {
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
      {/* Single row: Cards | Trump */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
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

        {/* Trump Display - regular size */}
        <View
          style={{
            backgroundColor: colors.background.surface,
            borderRadius: borderRadius.lg,
            paddingVertical: 8,
            paddingHorizontal: 12,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: colors.gold.dark,
            minWidth: 60,
          }}
        >
          <Text
            style={{
              color: colors.gold.primary,
              fontSize: 10,
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            Trump
          </Text>
          <Text style={{ color: suitColor, fontSize: 32, marginTop: 0 }}>{suitSymbol}</Text>
        </View>
      </View>
    </View>
  );
}
