/**
 * Full-screen victory celebration overlay for when a team wins the game
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
  Easing,
} from "react-native-reanimated";
import { colors, borderRadius, shadows } from "../theme";
import Confetti from "./Confetti";
import Sparkle from "./Sparkle";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface VictoryOverlayProps {
  visible: boolean;
  isVictory: boolean;
  handsWon: { team1: number; team2: number };
}

export default function VictoryOverlay({
  visible,
  isVictory,
  handsWon,
}: VictoryOverlayProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [showSparkle, setShowSparkle] = useState(false);

  const backdropOpacity = useSharedValue(0);
  const trophyScale = useSharedValue(0);
  const trophyRotate = useSharedValue(0);
  const titleScale = useSharedValue(0);
  const titleTranslateY = useSharedValue(30);
  const scoreScale = useSharedValue(0);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Backdrop
      backdropOpacity.value = withTiming(1, { duration: 500 });

      // Trophy entrance with bounce
      trophyScale.value = withDelay(
        300,
        withSequence(
          withSpring(1.3, { damping: 6, stiffness: 150 }),
          withSpring(1, { damping: 10, stiffness: 200 })
        )
      );

      // Trophy wiggle
      trophyRotate.value = withDelay(
        800,
        withSequence(
          withTiming(-10, { duration: 100 }),
          withTiming(10, { duration: 100 }),
          withTiming(-5, { duration: 100 }),
          withTiming(5, { duration: 100 }),
          withTiming(0, { duration: 100 })
        )
      );

      // Title
      titleScale.value = withDelay(
        600,
        withSpring(1, { damping: 10, stiffness: 200 })
      );
      titleTranslateY.value = withDelay(
        600,
        withSpring(0, { damping: 15, stiffness: 200 })
      );

      // Score
      scoreScale.value = withDelay(
        900,
        withSpring(1, { damping: 10, stiffness: 200 })
      );

      // Glow effect for victory
      if (isVictory) {
        glowOpacity.value = withDelay(
          400,
          withRepeat(
            withSequence(
              withTiming(0.8, { duration: 1000 }),
              withTiming(0.3, { duration: 1000 })
            ),
            -1,
            true
          )
        );

        // Trigger confetti and sparkle
        setTimeout(() => setShowConfetti(true), 500);
        setTimeout(() => setShowSparkle(true), 300);
      }
    } else {
      backdropOpacity.value = 0;
      trophyScale.value = 0;
      trophyRotate.value = 0;
      titleScale.value = 0;
      titleTranslateY.value = 30;
      scoreScale.value = 0;
      glowOpacity.value = 0;
      setShowConfetti(false);
      setShowSparkle(false);
    }
  }, [visible, isVictory]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const trophyStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: trophyScale.value },
      { rotate: `${trophyRotate.value}deg` },
    ],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: titleScale.value },
      { translateY: titleTranslateY.value },
    ],
  }));

  const scoreStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scoreScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  if (!visible) return null;

  const title = isVictory ? "VICTORY!" : "DEFEAT";
  const subtitle = isVictory
    ? "Congratulations! You've won the game!"
    : "Better luck next time!";
  const emoji = isVictory ? "🏆" : "😔";
  const accentColor = isVictory ? colors.gold.primary : colors.teams.team2.primary;

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Backdrop */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: isVictory
              ? "rgba(13, 40, 24, 0.95)"
              : "rgba(0, 0, 0, 0.9)",
          },
          backdropStyle,
        ]}
      />

      {/* Victory glow effect */}
      {isVictory && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: colors.gold.primary,
            },
            glowStyle,
          ]}
          pointerEvents="none"
        />
      )}

      {/* Confetti */}
      {isVictory && (
        <Confetti
          visible={showConfetti}
          intensity="heavy"
          duration={5000}
        />
      )}

      {/* Content */}
      <View style={styles.container}>
        {/* Trophy with sparkle */}
        <View style={styles.trophyContainer}>
          {isVictory && showSparkle && (
            <View style={styles.sparkleWrapper}>
              <Sparkle
                visible={showSparkle}
                color={colors.gold.light}
                size={180}
                duration={1500}
              />
            </View>
          )}
          <Animated.Text style={[styles.trophy, trophyStyle]}>
            {emoji}
          </Animated.Text>
        </View>

        {/* Title */}
        <Animated.View style={titleStyle}>
          <Text style={[styles.title, { color: accentColor }]}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </Animated.View>

        {/* Final Score */}
        <Animated.View style={[styles.scoreCard, scoreStyle]}>
          <Text style={styles.scoreTitle}>Final Score</Text>

          <View style={styles.scoreRow}>
            <View style={styles.teamScore}>
              <Text style={[styles.teamLabel, { color: colors.teams.team1.light }]}>
                Your Team
              </Text>
              <View style={styles.handsRow}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <View
                    key={`t1-${i}`}
                    style={[
                      styles.handIndicator,
                      {
                        backgroundColor:
                          i < handsWon.team1
                            ? colors.teams.team1.primary
                            : "transparent",
                        borderColor: colors.teams.team1.primary,
                      },
                    ]}
                  />
                ))}
              </View>
              <Text style={styles.handsCount}>{handsWon.team1} hands</Text>
            </View>

            <View style={styles.divider}>
              <Text style={styles.dividerText}>vs</Text>
            </View>

            <View style={styles.teamScore}>
              <Text style={[styles.teamLabel, { color: colors.teams.team2.light }]}>
                Opponents
              </Text>
              <View style={styles.handsRow}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <View
                    key={`t2-${i}`}
                    style={[
                      styles.handIndicator,
                      {
                        backgroundColor:
                          i < handsWon.team2
                            ? colors.teams.team2.primary
                            : "transparent",
                        borderColor: colors.teams.team2.primary,
                      },
                    ]}
                  />
                ))}
              </View>
              <Text style={styles.handsCount}>{handsWon.team2} hands</Text>
            </View>
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
    padding: 24,
  },
  trophyContainer: {
    position: "relative",
    width: 150,
    height: 150,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  sparkleWrapper: {
    position: "absolute",
    top: -15,
    left: -15,
  },
  trophy: {
    fontSize: 100,
  },
  title: {
    fontSize: 48,
    fontWeight: "bold",
    textAlign: "center",
    letterSpacing: 4,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: "center",
    marginBottom: 32,
  },
  scoreCard: {
    backgroundColor: colors.background.surface,
    borderRadius: borderRadius.xl,
    padding: 24,
    width: SCREEN_WIDTH * 0.85,
    maxWidth: 340,
    borderWidth: 2,
    borderColor: colors.gold.dark,
    ...shadows.extruded.medium,
  },
  scoreTitle: {
    fontSize: 14,
    color: colors.gold.muted,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 20,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  teamScore: {
    flex: 1,
    alignItems: "center",
  },
  teamLabel: {
    fontSize: 12,
    marginBottom: 12,
  },
  handsRow: {
    flexDirection: "row",
    gap: 4,
    marginBottom: 8,
  },
  handIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
  },
  handsCount: {
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: "600",
  },
  divider: {
    paddingHorizontal: 16,
  },
  dividerText: {
    fontSize: 16,
    color: colors.text.muted,
    fontWeight: "bold",
  },
});
