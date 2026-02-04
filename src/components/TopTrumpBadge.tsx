/**
 * Compact badge when playing a top trump card (5♥, J of trump, A♥)
 */

import { useEffect } from "react";
import { Text, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { colors, borderRadius, shadows } from "../theme";
import type { Card, Suit } from "../game-logic/cards";

interface TopTrumpBadgeProps {
  visible: boolean;
  card: Card | null;
  trumpSuit: Suit;
  playerName: string;
  isYou: boolean;
  onHide?: () => void;
}

// Check if a card is a "top trump" worthy of a special badge
export function isTopTrump(card: Card, trumpSuit: Suit): boolean {
  // 5 of Hearts - highest trump
  if (card.suit === "hearts" && card.rank === "5") return true;
  // Jack of trump suit
  if (card.suit === trumpSuit && card.rank === "J") return true;
  // Ace of Hearts - always trump
  if (card.suit === "hearts" && card.rank === "A") return true;
  return false;
}

// Get the badge config for a top trump
function getTopTrumpConfig(card: Card, trumpSuit: Suit) {
  if (card.suit === "hearts" && card.rank === "5") {
    return { icon: "👑", text: "5♥", color: colors.gold.light };
  }
  if (card.suit === trumpSuit && card.rank === "J") {
    return { icon: "⚔️", text: "J trump", color: colors.gold.primary };
  }
  if (card.suit === "hearts" && card.rank === "A") {
    return { icon: "💎", text: "A♥", color: "#ec4899" };
  }
  return { icon: "🃏", text: "Trump", color: colors.gold.primary };
}

export default function TopTrumpBadge({
  visible,
  card,
  trumpSuit,
  playerName,
  isYou,
  onHide,
}: TopTrumpBadgeProps) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-15);

  useEffect(() => {
    if (visible && card) {
      // Quick entrance
      scale.value = withSequence(
        withSpring(1.05, { damping: 12, stiffness: 250 }),
        withSpring(1, { damping: 15, stiffness: 250 })
      );
      opacity.value = withTiming(1, { duration: 100 });
      translateY.value = withSpring(0, { damping: 18, stiffness: 250 });

      // Auto-hide quickly
      if (onHide) {
        const timer = setTimeout(() => {
          scale.value = withTiming(0.9, { duration: 150 });
          opacity.value = withTiming(0, { duration: 150 }, (finished) => {
            if (finished) {
              runOnJS(onHide)();
            }
          });
        }, 900);

        return () => clearTimeout(timer);
      }
    } else {
      scale.value = 0;
      opacity.value = 0;
      translateY.value = -15;
    }
  }, [visible, card, onHide]);

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!visible || !card) return null;

  const config = getTopTrumpConfig(card, trumpSuit);

  return (
    <Animated.View
      style={[
        styles.badge,
        { borderColor: config.color },
        badgeStyle,
      ]}
    >
      <Text style={styles.icon}>{config.icon}</Text>
      <Text style={[styles.text, { color: config.color }]}>{config.text}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: colors.background.surface,
    borderRadius: borderRadius.md,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    ...shadows.extruded.small,
  },
  icon: {
    fontSize: 12,
  },
  text: {
    fontSize: 11,
    fontWeight: "bold",
  },
});
