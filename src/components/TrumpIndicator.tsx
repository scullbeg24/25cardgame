import { View, Text } from "react-native";
import Card from "./Card";
import type { Card as CardType } from "../game-logic/cards";
import type { Suit } from "../game-logic/cards";
import type { CardSize } from "../store/settingsStore";

const SUIT_SYMBOLS: Record<string, string> = {
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
  spades: "♠",
};

interface TrumpIndicatorProps {
  trumpCard: CardType | null;
  trumpSuit: Suit;
  size?: CardSize;
}

export default function TrumpIndicator({
  trumpCard,
  trumpSuit,
  size = "small",
}: TrumpIndicatorProps) {
  const symbol = SUIT_SYMBOLS[trumpSuit] ?? "?";

  const suitColor = trumpSuit === "hearts" || trumpSuit === "diamonds" 
    ? "#ef4444" 
    : "#171717";

  return (
    <View 
      className="rounded-xl p-2 flex-row items-center gap-2"
      style={{
        backgroundColor: "rgba(0,0,0,0.4)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
      }}
    >
      {trumpCard && (
        <Card card={trumpCard} faceUp size={size} />
      )}
      <View className="items-center">
        <Text className="text-neutral-400 text-xs font-medium">Trump</Text>
        <Text 
          className="text-3xl font-bold"
          style={{ color: suitColor }}
        >
          {symbol}
        </Text>
      </View>
    </View>
  );
}
