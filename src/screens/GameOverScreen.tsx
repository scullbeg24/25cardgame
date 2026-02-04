import { useState, useEffect } from "react";
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
import { colors, shadows, borderRadius } from "../theme";
import type { RootStackParamList } from "./HomeScreen";

type GameOverNavProp = NativeStackNavigationProp<
  RootStackParamList,
  "GameOver"
>;

export default function GameOverScreen() {
  const navigation = useNavigation<GameOverNavProp>();
  const { scores, handsWon, resetGame } = useGameStore();
  const [showConfetti, setShowConfetti] = useState(false);
  const [showSparkle, setShowSparkle] = useState(false);

  const winner = handsWon.team1 >= 5 ? 1 : handsWon.team2 >= 5 ? 2 : null;
  const youWon = winner === 1;

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

          {/* Score display */}
          <Animated.View
            style={[
              {
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: colors.background.primary,
                borderRadius: borderRadius.lg,
                padding: 16,
                width: "100%",
              },
              scoreStyle,
            ]}
          >
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text style={{ color: colors.teams.team1.light, fontSize: 12, marginBottom: 4 }}>
                Your Team
              </Text>
              {/* Hands indicators */}
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
              {/* Hands indicators */}
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
