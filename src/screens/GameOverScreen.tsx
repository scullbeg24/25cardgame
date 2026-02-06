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
import { getTeamColors } from "../theme/colors";
import type { RootStackParamList } from "./HomeScreen";

type GameOverNavProp = NativeStackNavigationProp<
  RootStackParamList,
  "GameOver"
>;

export default function GameOverScreen() {
  const navigation = useNavigation<GameOverNavProp>();
  const { handsWon, resetGame, players, humanPlayerIndex, teamAssignment } = useGameStore();
  const [showConfetti, setShowConfetti] = useState(false);
  const [showSparkle, setShowSparkle] = useState(false);
  const hasPlayedSound = useRef(false);

  const { teamCount } = teamAssignment;
  const humanTeamId = players[humanPlayerIndex]?.teamId ?? 0;

  // Find the winning team (first to 5 hands)
  let winnerTeamId: number | null = null;
  for (let t = 0; t < teamCount; t++) {
    if ((handsWon[t] ?? 0) >= 5) {
      winnerTeamId = t;
      break;
    }
  }
  const youWon = winnerTeamId === humanTeamId;

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
    cardScale.value = withDelay(
      200,
      withSpring(1, { damping: 12, stiffness: 150 })
    );
    cardTranslateY.value = withDelay(
      200,
      withSpring(0, { damping: 15, stiffness: 150 })
    );

    trophyScale.value = withDelay(
      500,
      withSequence(
        withSpring(1.3, { damping: 6, stiffness: 200 }),
        withSpring(1, { damping: 10, stiffness: 200 })
      )
    );

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

    titleOpacity.value = withDelay(700, withTiming(1, { duration: 300 }));
    scoreScale.value = withDelay(
      900,
      withSpring(1, { damping: 10, stiffness: 200 })
    );
    buttonsOpacity.value = withDelay(1200, withTiming(1, { duration: 400 }));

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

  const winnerBorderColor = youWon
    ? colors.gold.primary
    : winnerTeamId !== null
    ? getTeamColors(winnerTeamId).primary
    : colors.teams.team2.primary;

  const teamIds = Array.from({ length: teamCount }, (_, i) => i);

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
              borderColor: winnerBorderColor,
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
              {youWon ? "Congratulations! Your team wins!" : "Better luck next time"}
            </Text>
          </Animated.View>

          {/* Score display - dynamic teams */}
          <Animated.View
            style={[
              {
                flexDirection: "row",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: colors.background.primary,
                borderRadius: borderRadius.lg,
                padding: 16,
                width: "100%",
              },
              scoreStyle,
            ]}
          >
            {teamIds.map((teamId, i) => {
              const tc = getTeamColors(teamId);
              const isHumanTeam = teamId === humanTeamId;
              const label = isHumanTeam ? "Your Team" : `Team ${teamId + 1}`;
              const hw = handsWon[teamId] ?? 0;
              return (
                <View key={teamId} style={{ flexDirection: "row", alignItems: "center" }}>
                  {i > 0 && (
                    <Text style={{ color: colors.text.muted, fontSize: 20, fontWeight: "bold", marginHorizontal: 8 }}>
                      vs
                    </Text>
                  )}
                  <View style={{ flex: 1, alignItems: "center", minWidth: 80 }}>
                    <Text style={{ color: tc.light, fontSize: 12, marginBottom: 4 }}>
                      {label}
                    </Text>
                    <View style={{ flexDirection: "row", gap: 4, marginBottom: 6 }}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <View
                          key={`t${teamId}-${j}`}
                          style={{
                            width: 14,
                            height: 14,
                            borderRadius: 7,
                            backgroundColor: j < hw ? tc.primary : "transparent",
                            borderWidth: 2,
                            borderColor: tc.primary,
                          }}
                        />
                      ))}
                    </View>
                    <Text style={{ color: colors.text.muted, fontSize: 11 }}>
                      {hw} hands
                    </Text>
                  </View>
                </View>
              );
            })}
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
