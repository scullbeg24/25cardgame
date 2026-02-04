import { View, Text } from "react-native";
import Modal from "./Modal";
import Button from "./Button";
import Card from "./Card";
import CardHand from "./CardHand";
import type { Card as CardType } from "../game-logic/cards";
import { colors, borderRadius } from "../theme";

interface RobPromptProps {
  visible: boolean;
  hand: CardType[];
  trumpCard: CardType;
  onRob: (cardToDiscard: CardType) => void;
  onDecline: () => void;
  /** Whether the trump card is an Ace (player must take it) */
  isForcedRob?: boolean;
  /** Name of the player who is robbing (for display) */
  robberName?: string;
}

const SUIT_SYMBOLS: Record<string, string> = {
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
  spades: "♠",
};

const SUIT_NAMES: Record<string, string> = {
  hearts: "Hearts",
  diamonds: "Diamonds",
  clubs: "Clubs",
  spades: "Spades",
};

export default function RobPrompt({
  visible,
  hand,
  trumpCard,
  onRob,
  onDecline,
  isForcedRob = false,
  robberName,
}: RobPromptProps) {
  const suitSymbol = SUIT_SYMBOLS[trumpCard?.suit] ?? "?";
  const suitName = SUIT_NAMES[trumpCard?.suit] ?? "trumps";
  const trumpDisplay = `${trumpCard?.rank}${suitSymbol}`;
  const suitColor = trumpCard?.suit === "hearts" || trumpCard?.suit === "diamonds"
    ? colors.suits.hearts
    : colors.suits.spades;
  
  // Determine the title and message based on whether it's a forced rob
  const title = isForcedRob ? "🃏 You Must Take the Ace!" : "🃏 Pick Up the Trump Card?";
  
  return (
    <Modal visible={visible} onClose={isForcedRob ? undefined : onDecline} title={title}>
      {/* Trump card display */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: colors.background.primary,
          padding: 12,
          borderRadius: borderRadius.lg,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: colors.gold.dark,
        }}
      >
        <View style={{ marginRight: 12, transform: [{ scale: 0.85 }] }}>
          <Card card={trumpCard} faceUp size="medium" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.gold.primary, fontSize: 16, fontWeight: "bold" }}>
            Trump Card
          </Text>
          <Text style={{ color: suitColor, fontSize: 22, fontWeight: "bold", marginTop: 2 }}>
            {trumpDisplay}
          </Text>
          <Text style={{ color: colors.text.muted, fontSize: 12, marginTop: 4 }}>
            {suitName} are trumps this hand
          </Text>
        </View>
      </View>

      {/* Explanation text */}
      {isForcedRob ? (
        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: colors.state.warning, fontSize: 14, fontWeight: "600", marginBottom: 8 }}>
            The trump card is an Ace - you must take it!
          </Text>
          <Text style={{ color: colors.text.secondary, fontSize: 13, lineHeight: 20 }}>
            Select one of your cards below to discard. It will be replaced with the{" "}
            <Text style={{ color: colors.gold.light, fontWeight: "bold" }}>{trumpDisplay}</Text>.
          </Text>
        </View>
      ) : (
        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: colors.text.primary, fontSize: 14, fontWeight: "600", marginBottom: 8 }}>
            You can pick up the trump card!
          </Text>
          <Text style={{ color: colors.text.secondary, fontSize: 13, lineHeight: 20 }}>
            You hold the Ace of {suitName.toLowerCase()}, giving you the option to "rob" the trump card.{"\n\n"}
            <Text style={{ fontWeight: "600" }}>To rob:</Text> Tap a card below to discard it and take the{" "}
            <Text style={{ color: colors.gold.light, fontWeight: "bold" }}>{trumpDisplay}</Text>.{"\n\n"}
            <Text style={{ fontWeight: "600" }}>To keep your hand:</Text> Tap "Cancel" below.
          </Text>
        </View>
      )}

      {/* Card selection label */}
      <Text style={{ color: colors.gold.muted, fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
        {isForcedRob ? "Select a card to discard:" : "Tap a card to discard it:"}
      </Text>

      {/* Hand display */}
      <CardHand
        cards={hand}
        playerId={0}
        isHuman
        isCurrentPlayer
        validMoves={hand}
        onCardSelect={onRob}
        size="medium"
      />

      {/* Cancel button (only if not forced) */}
      {!isForcedRob && (
        <View style={{ marginTop: 16 }}>
          <Button title="Cancel - Keep My Hand" variant="outline" onPress={onDecline} />
        </View>
      )}
    </Modal>
  );
}
