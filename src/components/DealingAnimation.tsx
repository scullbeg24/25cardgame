import { useEffect, useState } from "react";
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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Player positions relative to center
const PLAYER_POSITIONS = [
  { x: 0, y: -120, label: "North" },   // Top
  { x: 150, y: 0, label: "East" },     // Right
  { x: 0, y: 120, label: "South" },    // Bottom (You)
  { x: -150, y: 0, label: "West" },    // Left
];

const DEAL_DURATION = 150;
const DELAY_BETWEEN_CARDS = 100;

interface DealingCardProps {
  index: number;
  playerIndex: number;
  onComplete?: () => void;
  isLastCard: boolean;
}

function DealingCard({ index, playerIndex, onComplete, isLastCard }: DealingCardProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(0.3);
  const opacity = useSharedValue(1);
  const rotate = useSharedValue(0);

  const targetPos = PLAYER_POSITIONS[playerIndex];
  // Stagger cards slightly within each player's hand
  const cardOffset = (index % 5) * 15 - 30;

  useEffect(() => {
    const delay = index * DELAY_BETWEEN_CARDS;
    
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
  }, []);

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
}

export default function DealingAnimation({ playerHands, onComplete }: DealingAnimationProps) {
  const [cards, setCards] = useState<{ index: number; playerIndex: number }[]>([]);

  useEffect(() => {
    // Create dealing sequence: round-robin dealing like real poker
    const dealingOrder: { index: number; playerIndex: number }[] = [];
    const cardsPerPlayer = 5;
    
    let cardIndex = 0;
    for (let round = 0; round < cardsPerPlayer; round++) {
      for (let player = 0; player < 4; player++) {
        dealingOrder.push({ index: cardIndex, playerIndex: player });
        cardIndex++;
      }
    }
    
    setCards(dealingOrder);
  }, []);

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
          isLastCard={i === cards.length - 1}
          onComplete={onComplete}
        />
      ))}

      {/* Player position indicators */}
      {PLAYER_POSITIONS.map((pos, idx) => (
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
          <Text style={[
            styles.playerLabel,
            idx % 2 === 0 ? styles.team1Label : styles.team2Label
          ]}>
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
    fontSize: 12,
    fontWeight: "600",
  },
  team1Label: {
    color: "#60a5fa",
  },
  team2Label: {
    color: "#f87171",
  },
});
