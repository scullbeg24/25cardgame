import { View } from "react-native";
import Card from "./Card";
import type { Card as CardType } from "../game-logic/cards";
import type { CardSize } from "../store/settingsStore";

interface CardHandProps {
  cards: CardType[];
  playerId: number;
  isHuman?: boolean;
  isCurrentPlayer?: boolean;
  validMoves: CardType[];
  onCardSelect?: (card: CardType) => void;
  size?: CardSize;
  faceUp?: boolean;
}

export default function CardHand({
  cards,
  isHuman = true,
  isCurrentPlayer = false,
  validMoves,
  onCardSelect,
  size = "medium",
  faceUp = true,
}: CardHandProps) {
  const isValidMove = (card: CardType) =>
    validMoves.some(
      (v) => v.suit === card.suit && v.rank === card.rank
    );

  if (cards.length === 0) return null;

  return (
    <View
      className={`flex-row justify-center items-center gap-1 flex-wrap ${
        isHuman ? "py-2" : "py-1"
      }`}
      style={{
        transform: isHuman ? [] : [{ scaleY: -1 }],
      }}
    >
      {cards.map((card, i) => (
        <View
          key={`${card.suit}-${card.rank}-${i}`}
          style={
            isHuman
              ? {
                  marginLeft: i === 0 ? 0 : -30,
                  zIndex: i,
                }
              : {}
          }
        >
          <Card
            card={card}
            faceUp={faceUp}
            selectable={isHuman && isCurrentPlayer && !!onCardSelect}
            validMove={isCurrentPlayer && isValidMove(card)}
            onPress={() => onCardSelect?.(card)}
            size={size}
          />
        </View>
      ))}
    </View>
  );
}
