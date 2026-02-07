/**
 * Compact badge for when a team wins a hand after being behind
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

interface ComebackWinBadgeProps {
  visible: boolean;
  teamIndex: number;
  isYourTeam: boolean;
  onHide?: () => void;
}

// Track scores during a hand to detect comebacks
export function wasComeback(
  scoreHistory: Array<{ team1: number; team2: number }>,
  winningTeam: 1 | 2
): boolean {
  if (scoreHistory.length < 3) return false;

  const losingTeam = winningTeam === 1 ? 2 : 1;
  const winKey = `team${winningTeam}` as "team1" | "team2";
  const loseKey = `team${losingTeam}` as "team1" | "team2";

  // Check if losing team was ever ahead by 10+ points
  for (const score of scoreHistory) {
    const deficit = score[loseKey] - score[winKey];
    if (deficit >= 10) {
      return true;
    }
  }

  return false;
}

export default function ComebackWinBadge({
  visible,
  teamIndex,
  isYourTeam,
  onHide,
}: ComebackWinBadgeProps) {
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
        }, 1200);

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

  const teamColor = teamIndex === 0 ? colors.teams.team1 : colors.teams.team2;

  return (
    <Animated.View
      style={[
        styles.badge,
        { borderColor: isYourTeam ? colors.gold.primary : teamColor.primary },
        badgeStyle,
      ]}
    >
      <Text style={styles.icon}>🔥</Text>
      <Text style={[styles.text, { color: isYourTeam ? colors.gold.primary : teamColor.light }]}>
        Comeback!
      </Text>
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
