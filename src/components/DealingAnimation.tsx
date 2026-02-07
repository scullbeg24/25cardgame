import { useEffect, useState, useRef, useMemo } from "react";
import { View, Text, Dimensions, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import type { Card } from "../game-logic/cards";
import { playCardDeal } from "../utils/sounds";

const DEAL_DURATION = 150;
const DELAY_BETWEEN_CARDS = 100;

/**
 * Generate dealing positions for variable player count.
 * Human (last index) is always at bottom.
 * Others distributed evenly clockwise.
 */
function getDealingPositions(numPlayers: number, playerNames: string[]): Array<{ x: number; y: number; label: string }> {
  const positions: Array<{ x: number; y: number; label: string }> = [];
  const humanIndex = numPlayers - 1;
  const angleStep = (2 * Math.PI) / numPlayers;
  const humanAngle = Math.PI / 2; // bottom

  const radiusX = 150;
  const radiusY = 120;

  for (let i = 0; i < numPlayers; i++) {
    const offset = (i - humanIndex + numPlayers) % numPlayers;
    const angle = humanAngle + offset * angleStep;
    positions.push({
      x: radiusX * Math.sin(angle),
      y: -radiusY * Math.cos(angle),
      label: i === humanIndex ? "You" : (playerNames[i] || `P${i + 1}`),
    });
  }
  return positions;
}

interface DealingCardProps {
  index: number;
  playerIndex: number;
  targetPos: { x: number; y: number };
  onComplete?: () => void;
  isLastCard: boolean;
}

function DealingCard({ index, playerIndex, targetPos, onComplete, isLastCard }: DealingCardProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(0.3);
  const opacity = useSharedValue(1);
  const rotate = useSharedValue(0);
  const hasPlayedSound = useRef(false);

  // Stagger cards slightly within each player's hand
  const cardOffset = (index % 5) * 15 - 30;

  useEffect(() => {
    const delay = index * DELAY_BETWEEN_CARDS;

    // Play deal sound for this card (staggered)
    const soundTimeout = setTimeout(() => {
      if (!hasPlayedSound.current) {
        hasPlayedSound.current = true;
        playCardDeal();
      }
    }, delay);

    // Animate card moving to player position
    translateX.value = withDelay(
      delay,
      withTiming(targetPos.x + cardOffset, {
        duration: DEAL_DURATION,
        easing: Easing.out(Easing.cubic),
      })
    );

    translateY.value = withDelay(
      delay,
      withTiming(targetPos.y, {
        duration: DEAL_DURATION,
        easing: Easing.out(Easing.cubic),
      })
    );

    scale.value = withDelay(
      delay,
      withTiming(0.5, {
        duration: DEAL_DURATION,
        easing: Easing.out(Easing.cubic),
      })
    );

    rotate.value = withDelay(
      delay,
      withTiming(playerIndex * 5 - 10, {
        duration: DEAL_DURATION,
      })
    );

    // Fade out after reaching destination
    opacity.value = withDelay(
      delay + DEAL_DURATION + 200,
      withTiming(0, { duration: 200 }, (finished) => {
        if (finished && isLastCard && onComplete) {
          runOnJS(onComplete)();
        }
      })
    );

    return () => clearTimeout(soundTimeout);
  }, [index, targetPos, cardOffset, isLastCard, onComplete]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.card, animatedStyle]}>
      <View style={styles.cardBack}>
        <View style={styles.cardBackInner} />
      </View>
    </Animated.View>
  );
}

interface DealingAnimationProps {
  playerHands: Card[][];
  onComplete: () => void;
  numPlayers?: number;
  playerNames?: string[];
}

export default function DealingAnimation({
  playerHands,
  onComplete,
  numPlayers = 4,
  playerNames = [],
}: DealingAnimationProps) {
  const [cards, setCards] = useState<{ index: number; playerIndex: number }[]>([]);

  const positions = useMemo(
    () => getDealingPositions(numPlayers, playerNames),
    [numPlayers, playerNames]
  );

  useEffect(() => {
    // Create dealing sequence: round-robin dealing
    const dealingOrder: { index: number; playerIndex: number }[] = [];
    const cardsPerPlayer = 5;

    let cardIndex = 0;
    for (let round = 0; round < cardsPerPlayer; round++) {
      for (let player = 0; player < numPlayers; player++) {
        dealingOrder.push({ index: cardIndex, playerIndex: player });
        cardIndex++;
      }
    }

    setCards(dealingOrder);
  }, [numPlayers]);

  if (cards.length === 0) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Deck in center */}
      <View style={styles.deckContainer}>
        <View style={styles.deck}>
          {[...Array(5)].map((_, i) => (
            <View
              key={i}
              style={[
                styles.deckCard,
                {
                  transform: [
                    { translateY: -i * 2 },
                    { translateX: -i * 0.5 },
                  ],
                }
              ]}
            >
              <View style={styles.cardBack}>
                <View style={styles.cardBackInner} />
              </View>
            </View>
          ))}
        </View>
        <Text style={styles.dealingText}>Dealing...</Text>
      </View>

      {/* Animated dealing cards */}
      {cards.map((card, i) => (
        <DealingCard
          key={i}
          index={card.index}
          playerIndex={card.playerIndex}
          targetPos={positions[card.playerIndex]}
          isLastCard={i === cards.length - 1}
          onComplete={onComplete}
        />
      ))}

      {/* Player position indicators */}
      {positions.map((pos, idx) => (
        <View
          key={idx}
          style={[
            styles.playerIndicator,
            {
              transform: [
                { translateX: pos.x - 30 },
                { translateY: pos.y + 40 },
              ],
            },
          ]}
        >
          <Text
            style={[
              styles.playerLabel,
              { color: idx === numPlayers - 1 ? "#60a5fa" : "#ccc" },
            ]}
            numberOfLines={1}
          >
            {pos.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    zIndex: 100,
  },
  deckContainer: {
    alignItems: "center",
  },
  deck: {
    width: 60,
    height: 84,
    position: "relative",
  },
  deckCard: {
    position: "absolute",
    width: 60,
    height: 84,
    borderRadius: 6,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  card: {
    position: "absolute",
    width: 60,
    height: 84,
    borderRadius: 6,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  cardBack: {
    flex: 1,
    margin: 3,
    borderRadius: 4,
    backgroundColor: "#1e3a5f",
    justifyContent: "center",
    alignItems: "center",
  },
  cardBackInner: {
    width: "80%",
    height: "85%",
    borderWidth: 2,
    borderColor: "rgba(100, 150, 200, 0.3)",
    borderRadius: 3,
  },
  dealingText: {
    marginTop: 16,
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  playerIndicator: {
    position: "absolute",
    width: 60,
    alignItems: "center",
  },
  playerLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
});
