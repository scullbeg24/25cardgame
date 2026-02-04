/**
 * Animation for when trump card is revealed at the start of a hand
 */

import { useEffect, useState } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withDelay,
  withTiming,
  withRepeat,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import { colors, borderRadius, shadows } from "../theme";
import type { Card as CardType, Suit } from "../game-logic/cards";
import Card from "./Card";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const SUIT_SYMBOLS: Record<Suit, string> = {
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
  spades: "♠",
};

const SUIT_NAMES: Record<Suit, string> = {
  hearts: "Hearts",
  diamonds: "Diamonds",
  clubs: "Clubs",
  spades: "Spades",
};

interface TrumpRevealAnimationProps {
  visible: boolean;
  trumpCard: CardType | null;
  onComplete?: () => void;
}

export default function TrumpRevealAnimation({
  visible,
  trumpCard,
  onComplete,
}: TrumpRevealAnimationProps) {
  const [showCard, setShowCard] = useState(false);

  const backdropOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0);
  const cardRotateY = useSharedValue(180); // Start face down
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(20);
  const suitPulse = useSharedValue(1);

  useEffect(() => {
    if (visible && trumpCard) {
      setShowCard(true);

      // Backdrop
      backdropOpacity.value = withTiming(1, { duration: 300 });

      // Card flip animation
      cardScale.value = withDelay(
        200,
        withSequence(
          withSpring(1.1, { damping: 10, stiffness: 150 }),
          withSpring(1, { damping: 12, stiffness: 200 })
        )
      );

      // Flip the card (rotate from 180 to 0)
      cardRotateY.value = withDelay(
        400,
        withTiming(0, {
          duration: 600,
          easing: Easing.inOut(Easing.ease),
        })
      );

      // Title fade in
      titleOpacity.value = withDelay(900, withTiming(1, { duration: 300 }));
      titleTranslateY.value = withDelay(
        900,
        withSpring(0, { damping: 15, stiffness: 200 })
      );

      // Single suit pulse
      suitPulse.value = withDelay(
        600,
        withSequence(
          withTiming(1.1, { duration: 200 }),
          withTiming(1, { duration: 200 })
        )
      );

      // Auto-dismiss quickly
      if (onComplete) {
        const timer = setTimeout(() => {
          backdropOpacity.value = withTiming(0, { duration: 200 });
          cardScale.value = withTiming(0.8, { duration: 200 }, (finished) => {
            if (finished) {
              runOnJS(onComplete)();
              runOnJS(setShowCard)(false);
            }
          });
        }, 1500);

        return () => clearTimeout(timer);
      }
    } else {
      backdropOpacity.value = 0;
      cardScale.value = 0;
      cardRotateY.value = 180;
      titleOpacity.value = 0;
      titleTranslateY.value = 20;
      suitPulse.value = 1;
    }
  }, [visible, trumpCard, onComplete]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const cardContainerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: cardScale.value },
      { perspective: 1000 },
      { rotateY: `${cardRotateY.value}deg` },
    ],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const suitStyle = useAnimatedStyle(() => ({
    transform: [{ scale: suitPulse.value }],
  }));

  if (!visible || !trumpCard) return null;

  const suitColor =
    trumpCard.suit === "hearts" || trumpCard.suit === "diamonds"
      ? colors.suits.hearts
      : colors.suits.spades;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Backdrop */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: "rgba(0, 0, 0, 0.75)" },
          backdropStyle,
        ]}
      />

      {/* Content */}
      <View style={styles.container}>
        {/* Card with flip animation */}
        <Animated.View style={[styles.cardWrapper, cardContainerStyle]}>
          {showCard && <Card card={trumpCard} faceUp size="large" />}
        </Animated.View>

        {/* Trump suit announcement */}
        <Animated.View style={[styles.titleContainer, titleStyle]}>
          <Text style={styles.trumpLabel}>Trump Suit</Text>
          <View style={styles.suitRow}>
            <Animated.Text style={[styles.suitSymbol, { color: suitColor }, suitStyle]}>
              {SUIT_SYMBOLS[trumpCard.suit]}
            </Animated.Text>
            <Text style={[styles.suitName, { color: suitColor }]}>
              {SUIT_NAMES[trumpCard.suit]}
            </Text>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 24,
  },
  cardWrapper: {
    ...shadows.extruded.large,
    shadowColor: colors.gold.primary,
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  titleContainer: {
    alignItems: "center",
    backgroundColor: colors.background.surface,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    borderColor: colors.gold.dark,
    ...shadows.extruded.medium,
  },
  trumpLabel: {
    fontSize: 12,
    color: colors.gold.muted,
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 8,
  },
  suitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  suitSymbol: {
    fontSize: 36,
  },
  suitName: {
    fontSize: 24,
    fontWeight: "bold",
  },
});
