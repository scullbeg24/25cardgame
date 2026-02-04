/**
 * Compact badge when a player successfully robs the Ace
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

interface RobBadgeProps {
  visible: boolean;
  playerName: string;
  isYou: boolean;
  onComplete?: () => void;
}

export default function RobBadge({
  visible,
  playerName,
  isYou,
  onComplete,
}: RobBadgeProps) {
  const scale = useSharedValue(0);
  const translateY = useSharedValue(-15);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Quick entrance
      scale.value = withSequence(
        withSpring(1.05, { damping: 12, stiffness: 250 }),
        withSpring(1, { damping: 15, stiffness: 250 })
      );
      translateY.value = withSpring(0, { damping: 18, stiffness: 250 });
      opacity.value = withTiming(1, { duration: 100 });

      // Auto-dismiss quickly
      if (onComplete) {
        const timer = setTimeout(() => {
          scale.value = withTiming(0.9, { duration: 150 });
          opacity.value = withTiming(0, { duration: 150 }, (finished) => {
            if (finished) {
              runOnJS(onComplete)();
            }
          });
        }, 1000);

        return () => clearTimeout(timer);
      }
    } else {
      scale.value = 0;
      translateY.value = -15;
      opacity.value = 0;
    }
  }, [visible, onComplete]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  const displayName = isYou ? "You" : playerName;

  return (
    <Animated.View style={[styles.badge, animatedStyle]}>
      <Text style={styles.icon}>💎</Text>
      <Text style={styles.text}>{displayName} robbed!</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: "absolute",
    top: "40%",
    alignSelf: "center",
    backgroundColor: colors.background.surface,
    borderRadius: borderRadius.md,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: colors.gold.primary,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    ...shadows.extruded.small,
    zIndex: 100,
  },
  icon: {
    fontSize: 14,
  },
  text: {
    fontSize: 12,
    fontWeight: "bold",
    color: colors.gold.primary,
  },
});
