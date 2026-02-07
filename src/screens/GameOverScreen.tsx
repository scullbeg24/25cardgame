import { useState, useEffect, useRef } from "react";
import { View, Text, StatusBar, StyleSheet, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withSequence,
  withTiming,
  withRepeat,
} from "react-native-reanimated";
import Button from "../components/Button";
import { useGameStore } from "../store/gameStore";
import { useOnlineGameStore } from "../store/onlineGameStore";
import { useRoomStore } from "../store/roomStore";
import Confetti from "../components/Confetti";
import Sparkle from "../components/Sparkle";
import { playVictoryFanfare, playDefeatSound } from "../utils/sounds";
import { colors, shadows, borderRadius } from "../theme";
import { getTeamColors } from "../theme/colors";
import type { RootStackParamList } from "./HomeScreen";

type GameOverNavProp = NativeStackNavigationProp<
  RootStackParamList,
  "GameOver"
>;
type GameOverRouteProp = RouteProp<RootStackParamList, "GameOver">;

export default function GameOverScreen() {
  const navigation = useNavigation<GameOverNavProp>();
  const route = useRoute<GameOverRouteProp>();
  const { scores, handsWon, resetGame, teamAssignment } = useGameStore();
  const [showConfetti, setShowConfetti] = useState(false);
  const [showSparkle, setShowSparkle] = useState(false);
  const hasPlayedSound = useRef(false);

  // Determine mode from route params
  const mode = route.params?.mode ?? "local";
  const isOnline = mode === "online";

  // Online data from route params
  const onlineWinnerIndex = route.params?.winnerIndex ?? 0;
  const onlinePlayerNames = route.params?.playerNames ?? [];
  const onlineScores = route.params?.scores ?? [];
  const onlineTargetScore = route.params?.targetScore ?? 25;

  // Get humanPlayerIndex for online mode
  const mySlot = useOnlineGameStore((s) => s.mySlot);
  const humanPlayerIndex = mySlot ?? 0;

  // Determine if "you" won
  const youWon = isOnline
    ? onlineWinnerIndex === humanPlayerIndex
    : ((handsWon[0] ?? 0) >= 5);

  // Winner name for online
  const winnerName = isOnline
    ? (onlinePlayerNames[onlineWinnerIndex] ?? "Player")
    : undefined;

  // Play game end sound once
  useEffect(() => {
    if (!hasPlayedSound.current) {
      hasPlayedSound.current = true;
      if (youWon) {
        setTimeout(() => playVictoryFanfare(), 600);
      } else {
        setTimeout(() => playDefeatSound(), 500);
      }
    }
  }, [youWon]);

  // Animation values
  const cardScale = useSharedValue(0);
  const cardTranslateY = useSharedValue(50);
  const trophyScale = useSharedValue(0);
  const trophyRotate = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const scoreScale = useSharedValue(0);
  const buttonsOpacity = useSharedValue(0);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    // Card entrance
    cardScale.value = withDelay(
      200,
      withSpring(1, { damping: 12, stiffness: 150 })
    );
    cardTranslateY.value = withDelay(
      200,
      withSpring(0, { damping: 15, stiffness: 150 })
    );

    // Trophy bounce
    trophyScale.value = withDelay(
      500,
      withSequence(
        withSpring(1.3, { damping: 6, stiffness: 200 }),
        withSpring(1, { damping: 10, stiffness: 200 })
      )
    );

    // Trophy wiggle for victory
    if (youWon) {
      trophyRotate.value = withDelay(
        900,
        withSequence(
          withTiming(-15, { duration: 100 }),
          withTiming(15, { duration: 100 }),
          withTiming(-10, { duration: 100 }),
          withTiming(10, { duration: 100 }),
          withTiming(0, { duration: 100 })
        )
      );
    }

    // Title fade
    titleOpacity.value = withDelay(700, withTiming(1, { duration: 300 }));

    // Score scale
    scoreScale.value = withDelay(
      900,
      withSpring(1, { damping: 10, stiffness: 200 })
    );

    // Buttons fade
    buttonsOpacity.value = withDelay(1200, withTiming(1, { duration: 400 }));

    // Victory effects
    if (youWon) {
      glowOpacity.value = withDelay(
        600,
        withRepeat(
          withSequence(
            withTiming(0.4, { duration: 1000 }),
            withTiming(0.1, { duration: 1000 })
          ),
          -1,
          true
        )
      );
      setTimeout(() => setShowConfetti(true), 600);
      setTimeout(() => setShowSparkle(true), 500);
    }
  }, [youWon]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: cardScale.value },
      { translateY: cardTranslateY.value },
    ],
  }));

  const trophyStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: trophyScale.value },
      { rotate: `${trophyRotate.value}deg` },
    ],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
  }));

  const scoreStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scoreScale.value }],
  }));

  const buttonsStyle = useAnimatedStyle(() => ({
    opacity: buttonsOpacity.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const handlePlayAgain = () => {
    if (isOnline) {
      // Clean up online game and go back to lobby or multiplayer menu
      useOnlineGameStore.getState().cleanup();
      navigation.navigate("MultiplayerMenu");
    } else {
      resetGame();
      navigation.navigate("GameSetup");
    }
  };

  const handleMainMenu = () => {
    if (isOnline) {
      useOnlineGameStore.getState().cleanup();
      useRoomStore.getState().cleanup();
    } else {
      resetGame();
    }
    navigation.navigate("Home");
  };

  // Sort online players by score (descending) for leaderboard
  const sortedOnlinePlayers = isOnline
    ? onlinePlayerNames
        .map((name, idx) => ({
          name,
          score: onlineScores[idx] ?? 0,
          isYou: idx === humanPlayerIndex,
          isWinner: idx === onlineWinnerIndex,
        }))
        .sort((a, b) => b.score - a.score)
    : [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.primary }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background.primary} />

      {/* Victory glow effect */}
      {youWon && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: colors.gold.primary },
            glowStyle,
          ]}
          pointerEvents="none"
        />
      )}

      {/* Confetti for victory */}
      {youWon && <Confetti visible={showConfetti} intensity="medium" duration={2500} />}

      <LinearGradient
        colors={[colors.background.primary, colors.background.secondary, colors.background.primary]}
        style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24 }}
      >
        {/* Result card */}
        <Animated.View
          style={[
            {
              backgroundColor: colors.background.surface,
              borderRadius: borderRadius.xxl,
              padding: 32,
              alignItems: "center",
              ...shadows.extruded.large,
              borderWidth: 3,
              borderColor: youWon ? colors.gold.primary : colors.teams.team2.primary,
              marginBottom: 32,
              width: "100%",
              maxWidth: 340,
            },
            cardStyle,
          ]}
        >
          {/* Trophy/Emoji with sparkle */}
          <View style={{ position: "relative", marginBottom: 8 }}>
            {youWon && showSparkle && (
              <View style={{ position: "absolute", top: -30, left: -30 }}>
                <Sparkle visible={showSparkle} color={colors.gold.light} size={110} duration={2000} />
              </View>
            )}
            <Animated.Text
              style={[
                {
                  fontSize: 64,
                },
                trophyStyle,
              ]}
            >
              {youWon ? "🏆" : "😔"}
            </Animated.Text>
          </View>

          <Animated.View style={titleStyle}>
            <Text
              style={{
                fontSize: 32,
                fontWeight: "bold",
                color: youWon ? colors.gold.primary : colors.text.primary,
                textAlign: "center",
                marginBottom: 4,
                letterSpacing: youWon ? 2 : 0,
              }}
            >
              {youWon ? "VICTORY!" : "Defeat"}
            </Text>

            <Text
              style={{
                fontSize: 16,
                color: colors.text.secondary,
                textAlign: "center",
                marginBottom: 16,
              }}
            >
              {isOnline
                ? youWon
                  ? "You won the game!"
                  : `${winnerName} wins!`
                : youWon
                  ? "Congratulations! Your team wins!"
                  : "Better luck next time"}
            </Text>
          </Animated.View>

          {/* Score display — branches on mode */}
          <Animated.View
            style={[
              {
                backgroundColor: colors.background.primary,
                borderRadius: borderRadius.lg,
                padding: 16,
                width: "100%",
              },
              scoreStyle,
            ]}
          >
            {isOnline ? (
              /* ─── Online: Individual player leaderboard ─── */
              <ScrollView style={{ maxHeight: 220 }} showsVerticalScrollIndicator={false}>
                {sortedOnlinePlayers.map((player, rank) => (
                  <View
                    key={`player-${rank}`}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                      backgroundColor: player.isWinner
                        ? colors.gold.primary + "20"
                        : player.isYou
                          ? colors.teams.team1.bg
                          : "transparent",
                      borderRadius: borderRadius.md,
                      marginBottom: 4,
                      borderWidth: player.isWinner ? 1 : 0,
                      borderColor: colors.gold.primary,
                    }}
                  >
                    {/* Rank */}
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "bold",
                        color: rank === 0 ? colors.gold.primary : colors.text.muted,
                        width: 28,
                      }}
                    >
                      {rank === 0 ? "🥇" : rank === 1 ? "🥈" : rank === 2 ? "🥉" : `${rank + 1}.`}
                    </Text>

                    {/* Name */}
                    <Text
                      style={{
                        flex: 1,
                        fontSize: 15,
                        fontWeight: player.isYou ? "700" : "500",
                        color: player.isYou ? colors.teams.team1.light : colors.text.primary,
                      }}
                    >
                      {player.name}{player.isYou ? " (You)" : ""}
                    </Text>

                    {/* Score */}
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "bold",
                        color: player.isWinner ? colors.gold.primary : colors.text.secondary,
                      }}
                    >
                      {player.score}
                    </Text>
                  </View>
                ))}

                {/* Target score reference */}
                <Text
                  style={{
                    textAlign: "center",
                    color: colors.text.muted,
                    fontSize: 11,
                    marginTop: 8,
                  }}
                >
                  Target: {onlineTargetScore} points
                </Text>
              </ScrollView>
            ) : (
              /* ─── Local: Team-based score display ─── */
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                {Array.from({ length: teamAssignment.teamCount }).map((_, teamId) => {
                  const teamColors = getTeamColors(teamId);
                  const won = handsWon[teamId] ?? 0;
                  const label = teamId === 0 ? "Your Team" : teamAssignment.teamCount === 2 ? "Opponents" : `Team ${teamId + 1}`;
                  return (
                    <View key={`team-${teamId}`} style={{ flex: 1, alignItems: "center", flexDirection: "column" }}>
                      {/* Separator between teams */}
                      {teamId > 0 && (
                        <Text style={{ color: colors.text.muted, fontSize: 20, fontWeight: "bold", position: "absolute", left: -12, top: "40%" }}>
                          vs
                        </Text>
                      )}
                      <Text style={{ color: teamColors.light, fontSize: 12, marginBottom: 4 }}>
                        {label}
                      </Text>
                      {/* Hands indicators */}
                      <View style={{ flexDirection: "row", gap: 4, marginBottom: 6 }}>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <View
                            key={`t${teamId}-${i}`}
                            style={{
                              width: 14,
                              height: 14,
                              borderRadius: 7,
                              backgroundColor: i < won ? teamColors.primary : "transparent",
                              borderWidth: 2,
                              borderColor: teamColors.primary,
                            }}
                          />
                        ))}
                      </View>
                      <Text style={{ color: colors.text.muted, fontSize: 11 }}>
                        {won} hands
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
          </Animated.View>
        </Animated.View>

        {/* Buttons */}
        <Animated.View style={[{ gap: 16, width: "100%", maxWidth: 280 }, buttonsStyle]}>
          <Button
            title={isOnline ? "New Game" : "Play Again"}
            onPress={handlePlayAgain}
          />
          <Button title="Main Menu" variant="outline" onPress={handleMainMenu} />
        </Animated.View>
      </LinearGradient>
    </View>
  );
}
