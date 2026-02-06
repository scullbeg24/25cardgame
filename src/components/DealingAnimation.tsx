import { useEffect, useState, useRef } from "react";
import { View, Text, Dimensions, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import type { Card } from "../game-logic/cards";
import { playCardDeal } from "../utils/sounds";
import { getTeamColors } from "../theme/colors";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

/**
 * Generate player positions in a circle for any player count.
 * Returns positions relative to center (0,0).
 */
function generatePlayerPositions(count: number): { x: number; y: number; label: string }[] {
  if (count === 4) {
    // Classic N/E/S/W layout
    return [
      { x: 0, y: -120, label: "North" },
      { x: 150, y: 0, label: "East" },
      { x: 0, y: 120, label: "South" },
      { x: -150, y: 0, label: "West" },
    ];
  }

  const radius = Math.min(120, 90 + count * 5);
  const positions: { x: number; y: number; label: string }[] = [];
  for (let i = 0; i < count; i++) {
    // Start from top (-PI/2) and go clockwise
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / count;
    positions.push({
      x: Math.round(Math.cos(angle) * radius * 1.3),
      y: Math.round(Math.sin(angle) * radius),
      label: `P${i + 1}`,
    });
  }
  return positions;
}

const DEAL_DURATION = 150;
const DELAY_BETWEEN_CARDS = 100;

interface DealingCardProps {
  index: number;
  playerIndex: number;
  positions: { x: number; y: number }[];
  cardsPerPlayer: number;
  onComplete?: () => void;
  isLastCard: boolean;
}

function DealingCard({ index, playerIndex, positions, cardsPerPlayer, onComplete, isLastCard }: DealingCardProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(0.3);
  const opacity = useSharedValue(1);
  const rotate = useSharedValue(0);
  const hasPlayedSound = useRef(false);

  const targetPos = positions[playerIndex] ?? { x: 0, y: 0 };
  const cardOffset = (index % cardsPerPlayer) * 15 - 30;

  useEffect(() => {
    const delay = index * DELAY_BETWEEN_CARDS;

    const soundTimeout = setTimeout(() => {
      if (!hasPlayedSound.current) {
        hasPlayedSound.current = true;
        playCardDeal();
      }
    }, delay);

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
  playerCount?: number;
  playerTeamIds?: number[];
  onComplete: () => void;
}

export default function DealingAnimation({
  playerHands,
  playerCount: playerCountProp,
  playerTeamIds = [],
  onComplete,
}: DealingAnimationProps) {
  const playerCount = playerCountProp ?? playerHands.length;
  const positions = generatePlayerPositions(playerCount);
  const [cards, setCards] = useState<{ index: number; playerIndex: number }[]>([]);

  useEffect(() => {
    const dealingOrder: { index: number; playerIndex: number }[] = [];
    const cardsPerPlayer = 5;

    let cardIndex = 0;
    for (let round = 0; round < cardsPerPlayer; round++) {
      for (let player = 0; player < playerCount; player++) {
        dealingOrder.push({ index: cardIndex, playerIndex: player });
        cardIndex++;
      }
    }

    setCards(dealingOrder);
  }, [playerCount]);

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
          positions={positions}
          cardsPerPlayer={5}
          isLastCard={i === cards.length - 1}
          onComplete={onComplete}
        />
      ))}

      {/* Player position indicators */}
      {positions.map((pos, idx) => {
        const teamId = playerTeamIds[idx] ?? 0;
        const tc = getTeamColors(teamId);
        return (
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
            <Text style={[styles.playerLabel, { color: tc.light }]}>
              {pos.label}
            </Text>
          </View>
        );
      })}
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
    fontSize: 12,
    fontWeight: "600",
  },
});
