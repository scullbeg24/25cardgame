/**
 * Compact badge for when all 4 cards in a trick are trumps
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
import { isTrump } from "../game-logic/cards";

interface PerfectTrickBadgeProps {
  visible: boolean;
  onHide?: () => void;
}

// Check if all cards in a trick are trumps
export function isPerfectTrumpTrick(cards: Card[], trumpSuit: Suit): boolean {
  if (cards.length !== 4) return false;
  return cards.every((card) => isTrump(card, trumpSuit));
}

export default function PerfectTrickBadge({
  visible,
  onHide,
}: PerfectTrickBadgeProps) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-15);

  useEffect(() => {
    if (visible) {
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
        }, 1000);

        return () => clearTimeout(timer);
      }
    } else {
      scale.value = 0;
      opacity.value = 0;
      translateY.value = -15;
    }
  }, [visible, onHide]);

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.badge, badgeStyle]}>
      <Text style={styles.icon}>⭐</Text>
      <Text style={styles.text}>All trumps!</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: "#7c3aed",
    borderRadius: borderRadius.md,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "#a78bfa",
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
    color: "#ffffff",
  },
});
