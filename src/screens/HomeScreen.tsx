import { useState } from "react";
import { View, Text, StatusBar } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Button from "../components/Button";
import { useGameStore } from "../store/gameStore";
import { colors, shadows, borderRadius } from "../theme";

export type RootStackParamList = {
  Home: undefined;
  GameSetup: undefined;
  Game: undefined;
  Rules: undefined;
  Settings: undefined;
  GameOver: undefined;
};

type HomeNavProp = NativeStackNavigationProp<RootStackParamList, "Home">;

export default function HomeScreen() {
  const navigation = useNavigation<HomeNavProp>();
  const [hasSavedGame, setHasSavedGame] = useState(false);
  const loadGame = useGameStore((s) => s.loadGame);
  const hasSavedGameFn = useGameStore((s) => s.hasSavedGame);

  useFocusEffect(() => {
    hasSavedGameFn().then(setHasSavedGame).catch(() => setHasSavedGame(false));
  });

  const handleContinue = async () => {
    const loaded = await loadGame();
    if (loaded) navigation.navigate("Game");
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.primary }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background.primary} />
      
      <LinearGradient
        colors={[colors.background.primary, colors.background.secondary, colors.background.primary]}
        style={{ flex: 1 }}
      >
        <View className="flex-1 justify-center items-center px-6">
          {/* Logo/Title area with soft UI card */}
          <View
            style={{
              backgroundColor: colors.background.surface,
              borderRadius: borderRadius.xxl,
              padding: 32,
              alignItems: "center",
              ...shadows.extruded.large,
              borderWidth: 2,
              borderColor: colors.gold.dark,
              marginBottom: 40,
            }}
          >
            <Text
              style={{
                fontSize: 72,
                fontWeight: "bold",
                color: colors.gold.primary,
                textShadowColor: colors.gold.dark,
                textShadowOffset: { width: 2, height: 2 },
                textShadowRadius: 4,
              }}
            >
              25
            </Text>
            <Text
              style={{
                marginTop: 8,
                fontSize: 18,
                color: colors.text.secondary,
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              Irish Card Game
            </Text>
          </View>

          {/* Menu buttons */}
          <View className="gap-4 w-full max-w-xs">
            <Button
              title="New Game"
              onPress={() => navigation.navigate("GameSetup")}
            />
            {hasSavedGame && (
              <Button
                title="Continue Game"
                variant="secondary"
                onPress={handleContinue}
              />
            )}
            <Button
              title="How to Play"
              variant="outline"
              onPress={() => navigation.navigate("Rules")}
            />
            <Button
              title="Settings"
              variant="outline"
              onPress={() => navigation.navigate("Settings")}
            />
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}
