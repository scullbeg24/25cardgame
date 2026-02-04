/**
 * Badge for score milestones (10, 15, 20, 25 points)
 * Compact version that appears briefly near the scoreboard
 */

import { useEffect } from "react";
import { Text } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { colors, borderRadius, shadows } from "../theme";

interface ScoreMilestoneBadgeProps {
  visible: boolean;
  milestone: 10 | 15 | 20 | 25;
  teamIndex: 0 | 1;
  isYourTeam: boolean;
  onHide?: () => void;
}

const milestoneConfig = {
  10: { icon: "🎯", text: "10!", color: colors.state.success },
  15: { icon: "🔥", text: "15!", color: colors.state.warning },
  20: { icon: "⚡", text: "20!", color: colors.gold.primary },
  25: { icon: "👑", text: "25!", color: colors.gold.light },
};

export default function ScoreMilestoneBadge({
  visible,
  milestone,
  teamIndex,
  isYourTeam,
  onHide,
}: ScoreMilestoneBadgeProps) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-10);

  const config = milestoneConfig[milestone];
  const teamColor = teamIndex === 0 ? colors.teams.team1 : colors.teams.team2;

  useEffect(() => {
    if (visible) {
      // Quick badge entrance
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
        }, 800);

        return () => clearTimeout(timer);
      }
    } else {
      scale.value = 0;
      opacity.value = 0;
      translateY.value = -10;
    }
  }, [visible, onHide]);

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        {
          backgroundColor: isYourTeam ? config.color : teamColor.primary,
          borderColor: isYourTeam ? colors.gold.light : teamColor.light,
          paddingVertical: 4,
          paddingHorizontal: 8,
          borderRadius: borderRadius.md,
          borderWidth: 1,
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          ...shadows.extruded.small,
        },
        badgeStyle,
      ]}
    >
      <Text style={{ fontSize: 12 }}>{config.icon}</Text>
      <Text style={{ fontSize: 11, fontWeight: "bold", color: colors.text.inverse }}>
        {config.text}
      </Text>
    </Animated.View>
  );
}

/**
 * Tracks score changes and triggers milestone badges
 */
export function useScoreMilestones(scores: { team1: number; team2: number }) {
  const prevScores = { team1: 0, team2: 0 };

  const checkMilestone = (
    oldScore: number,
    newScore: number
  ): 10 | 15 | 20 | 25 | null => {
    const milestones = [10, 15, 20, 25] as const;
    for (const m of milestones) {
      if (oldScore < m && newScore >= m) {
        return m;
      }
    }
    return null;
  };

  return {
    team1Milestone: checkMilestone(prevScores.team1, scores.team1),
    team2Milestone: checkMilestone(prevScores.team2, scores.team2),
  };
}
