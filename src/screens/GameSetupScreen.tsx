import { useState } from "react";
import { View, Text, TextInput, StatusBar, Pressable, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Button from "../components/Button";
import NavigationHeader from "../components/NavigationHeader";
import { useGameStore } from "../store/gameStore";
import { useSettingsStore } from "../store/settingsStore";
import { colors, shadows, borderRadius } from "../theme";
import { MIN_PLAYERS, MAX_PLAYERS } from "../utils/constants";
import type { TeamMode } from "../game-logic/types";
import type { RootStackParamList } from "./HomeScreen";

type GameSetupNavProp = NativeStackNavigationProp<
  RootStackParamList,
  "GameSetup"
>;

function getTeamDescription(playerCount: number, teamMode: TeamMode): string {
  if (teamMode === "ffa") return `${playerCount} players - Free for All`;
  const teamCount = teamMode === "three-teams" ? 3 : 2;
  const perTeam = Math.floor(playerCount / teamCount);
  const extra = playerCount % teamCount;
  if (extra === 0) {
    return `${teamCount} teams of ${perTeam}`;
  }
  return `${teamCount} teams (${perTeam}-${perTeam + 1} per team)`;
}

const TEAM_MODES: { value: TeamMode; label: string; minPlayers: number }[] = [
  { value: "two-teams", label: "2 Teams", minPlayers: 2 },
  { value: "three-teams", label: "3 Teams", minPlayers: 6 },
  { value: "ffa", label: "FFA", minPlayers: 2 },
];

export default function GameSetupScreen() {
  const navigation = useNavigation<GameSetupNavProp>();
  const initializeGame = useGameStore((s) => s.initializeGame);
  const aiDifficulty = useSettingsStore((s) => s.aiDifficulty);
  const savedPlayerCount = useSettingsStore((s) => s.playerCount);
  const savedTeamMode = useSettingsStore((s) => s.teamMode);

  const [playerName, setPlayerName] = useState("You");
  const [playerCount, setPlayerCount] = useState(savedPlayerCount);
  const [teamMode, setTeamMode] = useState<TeamMode>(savedTeamMode);

  // Ensure team mode is valid for current player count
  const handlePlayerCountChange = (delta: number) => {
    const next = Math.max(MIN_PLAYERS, Math.min(MAX_PLAYERS, playerCount + delta));
    setPlayerCount(next);
    // Reset team mode if no longer valid
    if (teamMode === "three-teams" && next < 6) {
      setTeamMode("two-teams");
    }
  };

  const handleStart = () => {
    const settings = useSettingsStore.getState();
    const ruleOptions = settings.ruleVariations;

    // Persist player count and team mode
    useSettingsStore.getState().setPlayerCount(playerCount);
    useSettingsStore.getState().setTeamMode(teamMode);
    settings.save();

    initializeGame(
      playerName.trim() || "You",
      aiDifficulty,
      {
        allowRobWithFiveHearts: ruleOptions.allowRobWithFiveHearts,
        allowRenege: ruleOptions.allowRenege ?? true,
      },
      {
        playerCount,
        teamMode,
        humanPlayerIndex: 0,
        aiDifficulty,
      }
    );
    navigation.navigate("Game");
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.primary }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background.primary} />

      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background.secondary }}>
        <NavigationHeader title="New Game" />
      </SafeAreaView>

      <LinearGradient
        colors={[colors.background.primary, colors.background.secondary, colors.background.primary]}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ padding: 24, paddingBottom: 48 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
        <Text
          style={{
            color: colors.text.secondary,
            textAlign: "center",
            marginTop: 16,
            fontSize: 16,
          }}
        >
          {getTeamDescription(playerCount, teamMode)}
        </Text>

        {/* Name input section */}
        <View style={{ marginTop: 32 }}>
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

        {/* Player Count */}
        <View
          style={{
            marginTop: 24,
            backgroundColor: colors.background.surface,
            borderRadius: borderRadius.lg,
            padding: 16,
            ...shadows.extruded.small,
            borderWidth: 1,
            borderColor: colors.softUI.border,
          }}
        >
          <Text style={{ color: colors.text.secondary, fontSize: 16, marginBottom: 12 }}>
            Players
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 20 }}>
            <Pressable
              onPress={() => handlePlayerCountChange(-1)}
              disabled={playerCount <= MIN_PLAYERS}
              style={({ pressed }) => ({
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: pressed ? colors.background.elevated : colors.background.primary,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: playerCount <= MIN_PLAYERS ? colors.softUI.border : colors.gold.dark,
                opacity: playerCount <= MIN_PLAYERS ? 0.4 : 1,
              })}
            >
              <Text style={{ color: colors.gold.primary, fontSize: 24, fontWeight: "bold" }}>-</Text>
            </Pressable>
            <Text style={{ color: colors.gold.light, fontSize: 32, fontWeight: "bold", minWidth: 50, textAlign: "center" }}>
              {playerCount}
            </Text>
            <Pressable
              onPress={() => handlePlayerCountChange(1)}
              disabled={playerCount >= MAX_PLAYERS}
              style={({ pressed }) => ({
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: pressed ? colors.background.elevated : colors.background.primary,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: playerCount >= MAX_PLAYERS ? colors.softUI.border : colors.gold.dark,
                opacity: playerCount >= MAX_PLAYERS ? 0.4 : 1,
              })}
            >
              <Text style={{ color: colors.gold.primary, fontSize: 24, fontWeight: "bold" }}>+</Text>
            </Pressable>
          </View>
          <Text style={{ color: colors.text.muted, fontSize: 12, textAlign: "center", marginTop: 4 }}>
            1 human + {playerCount - 1} AI
          </Text>
        </View>

        {/* Team Mode */}
        <View
          style={{
            marginTop: 16,
            backgroundColor: colors.background.surface,
            borderRadius: borderRadius.lg,
            padding: 16,
            ...shadows.extruded.small,
            borderWidth: 1,
            borderColor: colors.softUI.border,
          }}
        >
          <Text style={{ color: colors.text.secondary, fontSize: 16, marginBottom: 12 }}>
            Team Mode
          </Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {TEAM_MODES.map((mode) => {
              const disabled = playerCount < mode.minPlayers;
              const selected = teamMode === mode.value;
              return (
                <Pressable
                  key={mode.value}
                  onPress={() => !disabled && setTeamMode(mode.value)}
                  disabled={disabled}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    paddingHorizontal: 8,
                    borderRadius: borderRadius.md,
                    backgroundColor: selected ? colors.gold.dark : colors.background.primary,
                    borderWidth: 1,
                    borderColor: selected ? colors.gold.primary : colors.softUI.border,
                    alignItems: "center",
                    opacity: disabled ? 0.3 : 1,
                  }}
                >
                  <Text
                    style={{
                      color: selected ? colors.text.primary : colors.text.secondary,
                      fontSize: 14,
                      fontWeight: selected ? "700" : "500",
                    }}
                  >
                    {mode.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* AI Difficulty section */}
        <View
          style={{
            marginTop: 16,
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

        {/* Start Button */}
        <View style={{ marginTop: 32 }}>
          <Button title="Start Game" onPress={handleStart} />
        </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}
