import { useState, useEffect, useRef } from "react";
import { View, Text, StatusBar, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
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
import Confetti from "../components/Confetti";
import Sparkle from "../components/Sparkle";
import { playVictoryFanfare, playDefeatSound } from "../utils/sounds";
import { colors, shadows, borderRadius } from "../theme";
import { getHumanPlayerIndex } from "../utils/constants";
import type { RootStackParamList } from "./HomeScreen";

type GameOverNavProp = NativeStackNavigationProp<
  RootStackParamList,
  "GameOver"
>;

export default function GameOverScreen() {
  const navigation = useNavigation<GameOverNavProp>();
  const { scores, handsWon, resetGame, players, numPlayers, scoringMode } = useGameStore();
  const [showConfetti, setShowConfetti] = useState(false);
  const [showSparkle, setShowSparkle] = useState(false);
  const hasPlayedSound = useRef(false);

  const humanPlayerIndex = getHumanPlayerIndex(numPlayers);

  // Determine winner
  let youWon = false;
  let winnerLabel = "";

  if (scoringMode === "team") {
    const winner = handsWon.team1 >= 5 ? 1 : handsWon.team2 >= 5 ? 2 : null;
    youWon = winner === 1;
    winnerLabel = youWon ? "Your Team" : "Opponents";
  } else {
    // Individual mode - find who has 5 hands
    let winnerIdx = -1;
    for (let i = 0; i < numPlayers; i++) {
      if ((handsWon.individual[i] ?? 0) >= 5) {
        winnerIdx = i;
        break;
      }
    }
    if (winnerIdx === -1) {
      // Fallback - find max hands
      let maxHands = 0;
      for (let i = 0; i < numPlayers; i++) {
        if ((handsWon.individual[i] ?? 0) > maxHands) {
          maxHands = handsWon.individual[i];
          winnerIdx = i;
        }
      }
    }
    youWon = winnerIdx === humanPlayerIndex;
    winnerLabel = youWon ? "You" : (players[winnerIdx]?.name ?? "Player");
  }

  // Play game end sound once
  useEffect(() => {
    if (!hasPlayedSound.current) {
      hasPlayedSound.current = true;
      if (youWon) {
        // Delay victory fanfare to sync with animations
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
    resetGame();
    navigation.navigate("GameSetup");
  };

  const handleMainMenu = () => {
    resetGame();
    navigation.navigate("Home");
  };

  const playerNames = players.map(p => p.name);

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
              maxWidth: 320,
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
              {youWon ? "\uD83C\uDFC6" : "\uD83D\uDE14"}
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
              {youWon
                ? (scoringMode === "team" ? "Congratulations! Your team wins!" : "Congratulations! You win!")
                : `${winnerLabel} wins the game`}
            </Text>
          </Animated.View>

          {/* Score display */}
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
            {scoringMode === "team" ? (
              /* Team mode */
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={{ flex: 1, alignItems: "center" }}>
                  <Text style={{ color: colors.teams.team1.light, fontSize: 12, marginBottom: 4 }}>
                    Your Team
                  </Text>
                  <View style={{ flexDirection: "row", gap: 4, marginBottom: 6 }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <View
                        key={`t1-${i}`}
                        style={{
                          width: 14,
                          height: 14,
                          borderRadius: 7,
                          backgroundColor: i < handsWon.team1 ? colors.teams.team1.primary : "transparent",
                          borderWidth: 2,
                          borderColor: colors.teams.team1.primary,
                        }}
                      />
                    ))}
                  </View>
                  <Text style={{ color: colors.text.muted, fontSize: 11 }}>
                    {handsWon.team1} hands
                  </Text>
                </View>

                <Text style={{ color: colors.text.muted, fontSize: 20, fontWeight: "bold", marginHorizontal: 12 }}>
                  vs
                </Text>

                <View style={{ flex: 1, alignItems: "center" }}>
                  <Text style={{ color: colors.teams.team2.light, fontSize: 12, marginBottom: 4 }}>
                    Opponents
                  </Text>
                  <View style={{ flexDirection: "row", gap: 4, marginBottom: 6 }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <View
                        key={`t2-${i}`}
                        style={{
                          width: 14,
                          height: 14,
                          borderRadius: 7,
                          backgroundColor: i < handsWon.team2 ? colors.teams.team2.primary : "transparent",
                          borderWidth: 2,
                          borderColor: colors.teams.team2.primary,
                        }}
                      />
                    ))}
                  </View>
                  <Text style={{ color: colors.text.muted, fontSize: 11 }}>
                    {handsWon.team2} hands
                  </Text>
                </View>
              </View>
            ) : (
              /* Individual mode: leaderboard */
              <View>
                {playerNames
                  .map((name, idx) => ({
                    name: idx === humanPlayerIndex ? "You" : name,
                    hands: handsWon.individual[idx] ?? 0,
                    isYou: idx === humanPlayerIndex,
                  }))
                  .sort((a, b) => b.hands - a.hands)
                  .map((entry, i) => (
                    <View
                      key={i}
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        paddingVertical: 5,
                        paddingHorizontal: 8,
                        backgroundColor: entry.isYou ? "rgba(59, 130, 246, 0.15)" : "transparent",
                        borderRadius: 8,
                        marginBottom: 2,
                      }}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Text
                          style={{
                            color: colors.text.muted,
                            fontSize: 11,
                            fontWeight: "bold",
                            width: 16,
                          }}
                        >
                          #{i + 1}
                        </Text>
                        <Text
                          style={{
                            color: entry.isYou ? colors.teams.team1.light : colors.text.primary,
                            fontSize: 13,
                            fontWeight: entry.isYou ? "bold" : "600",
                          }}
                          numberOfLines={1}
                        >
                          {entry.name}
                        </Text>
                      </View>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        <View style={{ flexDirection: "row", gap: 2 }}>
                          {Array.from({ length: 5 }).map((_, j) => (
                            <View
                              key={j}
                              style={{
                                width: 10,
                                height: 10,
                                borderRadius: 5,
                                backgroundColor:
                                  j < entry.hands
                                    ? (entry.isYou ? colors.teams.team1.primary : colors.teams.team2.primary)
                                    : "transparent",
                                borderWidth: 1.5,
                                borderColor: entry.isYou ? colors.teams.team1.primary : colors.teams.team2.primary,
                              }}
                            />
                          ))}
                        </View>
                        <Text style={{ color: colors.text.muted, fontSize: 10, minWidth: 35, textAlign: "right" }}>
                          {entry.hands} hand{entry.hands !== 1 ? "s" : ""}
                        </Text>
                      </View>
                    </View>
                  ))}
              </View>
            )}
          </Animated.View>
        </Animated.View>

        {/* Buttons */}
        <Animated.View style={[{ gap: 16, width: "100%", maxWidth: 280 }, buttonsStyle]}>
          <Button title="Play Again" onPress={handlePlayAgain} />
          <Button title="Main Menu" variant="outline" onPress={handleMainMenu} />
        </Animated.View>
      </LinearGradient>
    </View>
  );
}
