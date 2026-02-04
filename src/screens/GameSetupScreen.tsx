import { useState } from "react";
import { View, Text, TextInput, StatusBar } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Button from "../components/Button";
import { useGameStore } from "../store/gameStore";
import { useSettingsStore } from "../store/settingsStore";
import { colors, shadows, borderRadius } from "../theme";
import type { RootStackParamList } from "./HomeScreen";

type GameSetupNavProp = NativeStackNavigationProp<
  RootStackParamList,
  "GameSetup"
>;

export default function GameSetupScreen() {
  const navigation = useNavigation<GameSetupNavProp>();
  const initializeGame = useGameStore((s) => s.initializeGame);
  const aiDifficulty = useSettingsStore((s) => s.aiDifficulty);

  const [playerName, setPlayerName] = useState("You");

  const handleStart = () => {
    const ruleOptions = useSettingsStore.getState().ruleVariations;
    initializeGame(playerName.trim() || "You", aiDifficulty, {
      allowRobWithFiveHearts: ruleOptions.allowRobWithFiveHearts,
      allowRenege: ruleOptions.allowRenege ?? true,
    });
    navigation.navigate("Game");
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.primary }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background.primary} />
      
      <LinearGradient
        colors={[colors.background.primary, colors.background.secondary, colors.background.primary]}
        style={{ flex: 1, padding: 24 }}
      >
        <Text
          style={{
            fontSize: 32,
            fontWeight: "bold",
            color: colors.gold.primary,
            textAlign: "center",
            marginTop: 32,
          }}
        >
          New Game
        </Text>
        <Text
          style={{
            color: colors.text.secondary,
            textAlign: "center",
            marginTop: 8,
            fontSize: 16,
          }}
        >
          You + AI Partner vs 2 AI Opponents
        </Text>

        {/* Name input section */}
        <View style={{ marginTop: 48 }}>
          <Text style={{ color: colors.text.secondary, fontSize: 16, marginBottom: 8 }}>
            Your Name
          </Text>
          <TextInput
            style={{
              backgroundColor: colors.background.surface,
              color: colors.text.primary,
              fontSize: 18,
              paddingHorizontal: 16,
              paddingVertical: 14,
              borderRadius: borderRadius.lg,
              borderWidth: 1,
              borderColor: colors.gold.dark,
            }}
            value={playerName}
            onChangeText={setPlayerName}
            placeholder="Enter your name"
            placeholderTextColor={colors.text.muted}
            maxLength={20}
          />
        </View>

        {/* AI Difficulty section */}
        <View
          style={{
            marginTop: 32,
            backgroundColor: colors.background.surface,
            borderRadius: borderRadius.lg,
            padding: 16,
            ...shadows.extruded.small,
            borderWidth: 1,
            borderColor: colors.softUI.border,
          }}
        >
          <Text style={{ color: colors.text.secondary, fontSize: 16, marginBottom: 8 }}>
            AI Difficulty
          </Text>
          <Text style={{ color: colors.gold.light, fontSize: 18, fontWeight: "600" }}>
            {aiDifficulty === "easy"
              ? "Easy"
              : aiDifficulty === "medium"
              ? "Medium"
              : "Hard"}
          </Text>
          <Text style={{ color: colors.text.muted, fontSize: 13, marginTop: 4 }}>
            Change in Settings
          </Text>
        </View>

        {/* Buttons */}
        <View className="mt-12 gap-4">
          <Button title="Start Game" onPress={handleStart} />
          <Button
            title="Back"
            variant="outline"
            onPress={() => navigation.goBack()}
          />
        </View>
      </LinearGradient>
    </View>
  );
}
