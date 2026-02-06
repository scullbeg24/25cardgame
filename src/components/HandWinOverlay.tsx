/**
 * Full-screen overlay celebration when a team wins a hand
 */

import { useEffect } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withDelay,
  withTiming,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import { colors, borderRadius, shadows } from "../theme";
import { getTeamColors } from "../theme/colors";
import type { TeamScores, TeamHandsWon } from "../game-logic/types";
import Confetti from "./Confetti";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface HandWinOverlayProps {
  visible: boolean;
  winningTeam: number;
  isYourTeam: boolean;
  handsWon: TeamHandsWon;
  finalScore: TeamScores;
  teamCount?: number;
  onComplete?: () => void;
}

export default function HandWinOverlay({
  visible,
  winningTeam,
  isYourTeam,
  handsWon,
  finalScore,
  teamCount = 2,
  onComplete,
}: HandWinOverlayProps) {
  const backdropOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0);
  const cardTranslateY = useSharedValue(-100);
  const scoreScale = useSharedValue(0);
  const handsScale = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Backdrop fade in
      backdropOpacity.value = withTiming(1, { duration: 300 });

      // Card slide in and bounce
      cardScale.value = withDelay(
        200,
        withSequence(
          withSpring(1.1, { damping: 8, stiffness: 200 }),
          withSpring(1, { damping: 12, stiffness: 200 })
        )
      );
      cardTranslateY.value = withDelay(
        200,
        withSpring(0, { damping: 15, stiffness: 150 })
      );

      // Score and hands animation
      scoreScale.value = withDelay(
        600,
        withSpring(1, { damping: 10, stiffness: 200 })
      );
      handsScale.value = withDelay(
        800,
        withSpring(1, { damping: 10, stiffness: 200 })
      );

      // Auto-dismiss quickly
      if (onComplete) {
        const timer = setTimeout(() => {
          // Fade out
          backdropOpacity.value = withTiming(0, { duration: 200 });
          cardScale.value = withTiming(0.8, { duration: 200 });
          cardTranslateY.value = withTiming(
            30,
            { duration: 200 },
            (finished) => {
              if (finished) {
                runOnJS(onComplete)();
              }
            }
          );
        }, 1800);

        return () => clearTimeout(timer);
      }
    } else {
      backdropOpacity.value = 0;
      cardScale.value = 0;
      cardTranslateY.value = -100;
      scoreScale.value = 0;
      handsScale.value = 0;
    }
  }, [visible, onComplete]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: cardScale.value },
      { translateY: cardTranslateY.value },
    ],
  }));

  const scoreStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scoreScale.value }],
  }));

  const handsStyle = useAnimatedStyle(() => ({
    transform: [{ scale: handsScale.value }],
  }));

  if (!visible) return null;

  const winnerColors = getTeamColors(winningTeam);
  const title = isYourTeam ? "Hand Won!" : "Hand Lost";
  const emoji = isYourTeam ? "🏆" : "😔";
  const subtitle = isYourTeam ? "Your team takes the hand!" : "Opponents win this hand";

  // Build team entries for score/hands display
  const teamIds = Array.from({ length: teamCount }, (_, i) => i);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Backdrop */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: "rgba(0, 0, 0, 0.7)" },
          backdropStyle,
        ]}
      />

      {/* Brief confetti for your team winning */}
      {isYourTeam && (
        <Confetti visible={visible} intensity="medium" duration={2000} />
      )}

      {/* Content */}
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.card,
            {
              borderColor: isYourTeam ? colors.gold.primary : winnerColors.primary,
            },
            cardStyle,
          ]}
        >
          {/* Emoji */}
          <Text style={styles.emoji}>{emoji}</Text>

          {/* Title */}
          <Text
            style={[
              styles.title,
              { color: isYourTeam ? colors.gold.primary : winnerColors.light },
            ]}
          >
            {title}
          </Text>

          {/* Subtitle */}
          <Text style={styles.subtitle}>{subtitle}</Text>

          {/* Score display - dynamic teams */}
          <Animated.View style={[styles.scoreContainer, scoreStyle]}>
            {teamIds.map((teamId, i) => {
              const tc = getTeamColors(teamId);
              return (
                <View key={teamId} style={{ flexDirection: "row", alignItems: "center" }}>
                  {i > 0 && <Text style={styles.vs}>vs</Text>}
                  <View style={styles.scoreBox}>
                    <Text style={[styles.scoreLabel, { color: tc.light }]}>
                      {teamId === winningTeam && isYourTeam
                        ? "Your Team"
                        : `Team ${teamId + 1}`}
                    </Text>
                    <Text style={styles.scoreValue}>{finalScore[teamId] ?? 0}</Text>
                  </View>
                </View>
              );
            })}
          </Animated.View>

          {/* Hands won display - dynamic teams */}
          <Animated.View style={[styles.handsContainer, handsStyle]}>
            <Text style={styles.handsLabel}>Hands Won</Text>
            <View style={styles.handsDisplay}>
              {teamIds.map((teamId, i) => {
                const tc = getTeamColors(teamId);
                return (
                  <View key={teamId} style={{ flexDirection: "row", alignItems: "center" }}>
                    {i > 0 && <Text style={styles.handsVs}>—</Text>}
                    <View style={styles.handsTeam}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <View
                          key={`t${teamId}-${j}`}
                          style={[
                            styles.handDot,
                            {
                              backgroundColor:
                                j < (handsWon[teamId] ?? 0)
                                  ? tc.primary
                                  : colors.background.primary,
                              borderColor: tc.primary,
                            },
                          ]}
                        />
                      ))}
                    </View>
                  </View>
                );
              })}
            </View>
          </Animated.View>
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
    padding: 24,
  },
  card: {
    backgroundColor: colors.background.surface,
    borderRadius: borderRadius.xl,
    padding: 20,
    alignItems: "center",
    width: SCREEN_WIDTH * 0.75,
    maxWidth: 280,
    borderWidth: 2,
    ...shadows.extruded.medium,
  },
  emoji: {
    fontSize: 40,
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 16,
  },
  scoreContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.md,
    padding: 12,
    width: "100%",
    marginBottom: 12,
  },
  scoreBox: {
    flex: 1,
    alignItems: "center",
    minWidth: 60,
  },
  scoreLabel: {
    fontSize: 10,
    marginBottom: 2,
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.text.primary,
  },
  vs: {
    fontSize: 12,
    color: colors.text.muted,
    fontWeight: "bold",
    marginHorizontal: 8,
  },
  handsContainer: {
    alignItems: "center",
    width: "100%",
  },
  handsLabel: {
    fontSize: 9,
    color: colors.text.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  handsDisplay: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  handsTeam: {
    flexDirection: "row",
    gap: 4,
  },
  handDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  handsVs: {
    fontSize: 12,
    color: colors.text.muted,
  },
});
