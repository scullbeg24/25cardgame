import { useState } from "react";
import { View, Text, StatusBar, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useGameStore } from "../store/gameStore";
import { useSettingsStore } from "../store/settingsStore";
import { colors, shadows, borderRadius } from "../theme";
import { MIN_PLAYERS, MAX_PLAYERS } from "../utils/constants";
import type { RootStackParamList } from "./HomeScreen";

type GameSetupNavProp = NativeStackNavigationProp<
  RootStackParamList,
  "GameSetup"
>;

export default function GameSetupScreen() {
  const navigation = useNavigation<GameSetupNavProp>();
  const initializeGame = useGameStore((s) => s.initializeGame);
  const aiDifficulty = useSettingsStore((s) => s.aiDifficulty);

  const [numPlayers, setNumPlayers] = useState(4);
  const [targetScore, setTargetScore] = useState(25);

  const handleStart = () => {
    const ruleOptions = useSettingsStore.getState().ruleVariations;
    initializeGame(
      "You",
      aiDifficulty,
      {
        allowRobWithFiveHearts: ruleOptions.allowRobWithFiveHearts,
        allowRenege: ruleOptions.allowRenege ?? true,
      },
      numPlayers,
      targetScore
    );
    navigation.navigate("Game");
  };

  const handleClose = () => {
    navigation.goBack();
  };

  const canDecrement = numPlayers > MIN_PLAYERS;
  const canIncrement = numPlayers < MAX_PLAYERS;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.primary }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background.primary} />

      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: 24 }}>
          {/* Card container */}
          <View
            style={{
              backgroundColor: colors.background.secondary,
              borderRadius: 20,
              overflow: "hidden",
              ...shadows.extruded.large,
            }}
          >
            {/* Header */}
            <View
              style={{
                paddingVertical: 20,
                paddingHorizontal: 24,
                borderBottomWidth: 1,
                borderBottomColor: colors.gold.dark + "40",
              }}
            >
              <Text
                style={{
                  color: colors.text.primary,
                  fontSize: 24,
                  fontWeight: "bold",
                  textAlign: "center",
                  textTransform: "uppercase",
                  letterSpacing: 2,
                }}
              >
                Start Game
              </Text>
            </View>

            {/* Content */}
            <View style={{ padding: 24 }}>
              {/* Number of Players section */}
              <View
                style={{
                  backgroundColor: colors.background.surface,
                  borderRadius: borderRadius.lg,
                  padding: 20,
                  borderWidth: 1,
                  borderColor: colors.softUI.border,
                }}
              >
                <Text
                  style={{
                    color: colors.text.primary,
                    fontSize: 13,
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: 1.5,
                    marginBottom: 16,
                  }}
                >
                  Number of Players
                </Text>

                {/* Stepper */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 28,
                  }}
                >
                  {/* Minus button */}
                  <Pressable
                    onPress={() => canDecrement && setNumPlayers(numPlayers - 1)}
                    style={({ pressed }) => ({
                      width: 56,
                      height: 56,
                      borderRadius: 28,
                      borderWidth: 2,
                      borderColor: canDecrement
                        ? (pressed ? colors.gold.primary : colors.background.elevated)
                        : colors.background.primary + "60",
                      backgroundColor: pressed && canDecrement
                        ? colors.background.elevated
                        : "transparent",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: canDecrement ? 1 : 0.35,
                    })}
                    disabled={!canDecrement}
                  >
                    <Text
                      style={{
                        color: canDecrement ? colors.gold.primary : colors.text.muted,
                        fontSize: 28,
                        fontWeight: "300",
                        marginTop: -2,
                      }}
                    >
                      −
                    </Text>
                  </Pressable>

                  {/* Number display */}
                  <Text
                    style={{
                      color: colors.text.primary,
                      fontSize: 48,
                      fontWeight: "bold",
                      minWidth: 50,
                      textAlign: "center",
                    }}
                  >
                    {numPlayers}
                  </Text>

                  {/* Plus button */}
                  <Pressable
                    onPress={() => canIncrement && setNumPlayers(numPlayers + 1)}
                    style={({ pressed }) => ({
                      width: 56,
                      height: 56,
                      borderRadius: 28,
                      borderWidth: 2,
                      borderColor: canIncrement
                        ? (pressed ? colors.gold.primary : colors.background.elevated)
                        : colors.background.primary + "60",
                      backgroundColor: pressed && canIncrement
                        ? colors.background.elevated
                        : "transparent",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: canIncrement ? 1 : 0.35,
                    })}
                    disabled={!canIncrement}
                  >
                    <Text
                      style={{
                        color: canIncrement ? colors.gold.primary : colors.text.muted,
                        fontSize: 28,
                        fontWeight: "300",
                        marginTop: -2,
                      }}
                    >
                      +
                    </Text>
                  </Pressable>
                </View>

                {/* Target Score section */}
                <Text
                  style={{
                    color: colors.text.primary,
                    fontSize: 13,
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: 1.5,
                    marginTop: 24,
                    marginBottom: 12,
                  }}
                >
                  Target Score
                </Text>

                <View
                  style={{
                    flexDirection: "row",
                    gap: 12,
                  }}
                >
                  {/* 25 option */}
                  <Pressable
                    onPress={() => setTargetScore(25)}
                    style={{
                      flex: 1,
                      paddingVertical: 14,
                      borderRadius: borderRadius.lg,
                      borderWidth: 2,
                      borderColor: targetScore === 25 ? colors.gold.dark : colors.background.elevated,
                      backgroundColor: targetScore === 25 ? colors.gold.dark + "20" : "transparent",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: targetScore === 25 ? colors.gold.primary : colors.text.secondary,
                        fontSize: 24,
                        fontWeight: "bold",
                      }}
                    >
                      25
                    </Text>
                  </Pressable>

                  {/* 45 option */}
                  <Pressable
                    onPress={() => setTargetScore(45)}
                    style={{
                      flex: 1,
                      paddingVertical: 14,
                      borderRadius: borderRadius.lg,
                      borderWidth: 2,
                      borderColor: targetScore === 45 ? colors.gold.dark : colors.background.elevated,
                      backgroundColor: targetScore === 45 ? colors.gold.dark + "20" : "transparent",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: targetScore === 45 ? colors.gold.primary : colors.text.secondary,
                        fontSize: 24,
                        fontWeight: "bold",
                      }}
                    >
                      45
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>

            {/* Start Game Button */}
            <View style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
              <Pressable
                onPress={handleStart}
                style={({ pressed }) => ({
                  backgroundColor: pressed ? colors.gold.dark : colors.gold.primary,
                  borderRadius: borderRadius.lg,
                  paddingVertical: 18,
                  alignItems: "center",
                  ...shadows.extruded.small,
                })}
              >
                <Text
                  style={{
                    color: colors.text.inverse,
                    fontSize: 18,
                    fontWeight: "bold",
                  }}
                >
                  Start Game
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Close link */}
          <Pressable
            onPress={handleClose}
            style={{ marginTop: 20, alignItems: "center" }}
          >
            <Text
              style={{
                color: colors.gold.primary,
                fontSize: 16,
                fontWeight: "600",
              }}
            >
              Close
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
