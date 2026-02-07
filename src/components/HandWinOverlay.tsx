/**
 * Full-screen overlay celebration when someone wins a hand
 * Supports both team mode and individual mode.
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
import Confetti from "./Confetti";
import type { ScoreMode } from "../utils/constants";
import type { HandsWon } from "../game-logic/scoring";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface HandWinOverlayProps {
  visible: boolean;
  /** Label of the winner ("Your Team", "Opponents", player name, or "You") */
  winnerLabel: string;
  /** Whether this is the human player's win */
  isYourWin: boolean;
  /** Scoring mode */
  scoringMode: ScoreMode;
  /** Hands won data */
  handsWon: HandsWon;
  /** Final hand score to display */
  finalScore: number;
  /** Player names (for individual leaderboard) */
  playerNames?: string[];
  /** Individual scores (for individual leaderboard) */
  individualScores?: number[];
  /** Human player index */
  humanPlayerIndex?: number;
  onComplete?: () => void;
}

export default function HandWinOverlay({
  visible,
  winnerLabel,
  isYourWin,
  scoringMode,
  handsWon,
  finalScore,
  playerNames = [],
  individualScores = [],
  humanPlayerIndex = 0,
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

  const title = isYourWin ? "Hand Won!" : "Hand Lost";
  const emoji = isYourWin ? "\uD83C\uDFC6" : "\uD83D\uDE14";
  const subtitle = isYourWin
    ? (scoringMode === "team" ? "Your team takes the hand!" : "You take the hand!")
    : `${winnerLabel} wins this hand`;
  const accentColor = isYourWin ? colors.gold.primary : colors.teams.team2.primary;

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

      {/* Brief confetti for your win */}
      {isYourWin && (
        <Confetti visible={visible} intensity="medium" duration={2000} />
      )}

      {/* Content */}
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.card,
            {
              borderColor: isYourWin ? colors.gold.primary : accentColor,
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
              { color: isYourWin ? colors.gold.primary : accentColor },
            ]}
          >
            {title}
          </Text>

          {/* Subtitle */}
          <Text style={styles.subtitle}>{subtitle}</Text>

          {/* Score display - varies by mode */}
          <Animated.View style={[styles.scoreContainer, scoreStyle]}>
            {scoringMode === "team" ? (
              /* Team mode: Your Team vs Opponents */
              <>
                <View style={styles.scoreBox}>
                  <Text style={[styles.scoreLabel, { color: colors.teams.team1.light }]}>
                    Your Team
                  </Text>
                  <Text style={styles.scoreValue}>{finalScore}</Text>
                </View>
              </>
            ) : (
              /* Individual mode: Winner's score */
              <View style={styles.scoreBox}>
                <Text style={[styles.scoreLabel, { color: isYourWin ? colors.gold.primary : colors.text.secondary }]}>
                  {winnerLabel}
                </Text>
                <Text style={styles.scoreValue}>{finalScore}</Text>
                <Text style={[styles.scoreLabel, { color: colors.text.muted, marginTop: 2 }]}>
                  points
                </Text>
              </View>
            )}
          </Animated.View>

          {/* Hands won display */}
          <Animated.View style={[styles.handsContainer, handsStyle]}>
            <Text style={styles.handsLabel}>Hands Won</Text>
            {scoringMode === "team" ? (
              /* Team mode: dot indicators */
              <View style={styles.handsDisplay}>
                {/* Team 1 hands */}
                <View style={styles.handsTeam}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <View
                      key={`t1-${i}`}
                      style={[
                        styles.handDot,
                        {
                          backgroundColor:
                            i < handsWon.team1
                              ? colors.teams.team1.primary
                              : colors.background.primary,
                          borderColor: colors.teams.team1.primary,
                        },
                      ]}
                    />
                  ))}
                </View>
                <Text style={styles.handsVs}>—</Text>
                {/* Team 2 hands */}
                <View style={styles.handsTeam}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <View
                      key={`t2-${i}`}
                      style={[
                        styles.handDot,
                        {
                          backgroundColor:
                            i < handsWon.team2
                              ? colors.teams.team2.primary
                              : colors.background.primary,
                          borderColor: colors.teams.team2.primary,
                        },
                      ]}
                    />
                  ))}
                </View>
              </View>
            ) : (
              /* Individual mode: compact leaderboard */
              <View style={{ width: "100%" }}>
                {playerNames
                  .map((name, idx) => ({
                    name: idx === humanPlayerIndex ? "You" : name,
                    hands: handsWon.individual[idx] ?? 0,
                    isYou: idx === humanPlayerIndex,
                  }))
                  .sort((a, b) => b.hands - a.hands)
                  .slice(0, 4) // Show top 4
                  .map((entry, i) => (
                    <View
                      key={i}
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        paddingVertical: 2,
                        paddingHorizontal: 8,
                      }}
                    >
                      <Text
                        style={{
                          color: entry.isYou ? colors.teams.team1.light : colors.text.secondary,
                          fontSize: 11,
                          fontWeight: entry.isYou ? "bold" : "normal",
                        }}
                        numberOfLines={1}
                      >
                        {entry.name}
                      </Text>
                      <View style={{ flexDirection: "row", gap: 3 }}>
                        {Array.from({ length: 5 }).map((_, j) => (
                          <View
                            key={j}
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: 4,
                              backgroundColor:
                                j < entry.hands
                                  ? (entry.isYou ? colors.teams.team1.primary : colors.teams.team2.primary)
                                  : colors.background.primary,
                              borderWidth: 1,
                              borderColor: entry.isYou ? colors.teams.team1.primary : colors.teams.team2.primary,
                            }}
                          />
                        ))}
                      </View>
                    </View>
                  ))}
              </View>
            )}
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
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.md,
    padding: 12,
    width: "100%",
    marginBottom: 12,
  },
  scoreBox: {
    flex: 1,
    alignItems: "center",
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
