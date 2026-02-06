import { useEffect } from "react";
import { View, Text, Switch, ScrollView, StatusBar } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Button from "../components/Button";
import NavigationHeader from "../components/NavigationHeader";
import { useSettingsStore } from "../store/settingsStore";
import { useGameStore } from "../store/gameStore";
import { colors, shadows, borderRadius } from "../theme";
import type { RootStackParamList } from "./HomeScreen";

type SettingsNavProp = NativeStackNavigationProp<
  RootStackParamList,
  "Settings"
>;

// Reusable setting row component
interface SettingRowProps {
  label: string;
  children: React.ReactNode;
}

function SettingRow({ label, children }: SettingRowProps) {
  return (
    <View
      style={{
        backgroundColor: colors.background.surface,
        padding: 16,
        borderRadius: borderRadius.lg,
        ...shadows.extruded.small,
        borderWidth: 1,
        borderColor: colors.softUI.border,
      }}
    >
      <Text style={{ fontSize: 16, color: colors.text.primary, marginBottom: 12 }}>
        {label}
      </Text>
      {children}
    </View>
  );
}

export default function SettingsScreen() {
  const navigation = useNavigation<SettingsNavProp>();
  const { load, save } = useSettingsStore();

  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const setSoundEnabled = useSettingsStore((s) => s.setSoundEnabled);
  const animationSpeed = useSettingsStore((s) => s.animationSpeed);
  const setAnimationSpeed = useSettingsStore((s) => s.setAnimationSpeed);
  const cardSize = useSettingsStore((s) => s.cardSize);
  const setCardSize = useSettingsStore((s) => s.setCardSize);
  const showHints = useSettingsStore((s) => s.showHints);
  const setShowHints = useSettingsStore((s) => s.setShowHints);
  const aiDifficulty = useSettingsStore((s) => s.aiDifficulty);
  const setAIDifficulty = useSettingsStore((s) => s.setAIDifficulty);
  const allowRobWithFiveHearts = useSettingsStore(
    (s) => s.ruleVariations.allowRobWithFiveHearts
  );
  const setRuleVariations = useSettingsStore((s) => s.setRuleVariations);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    await save();
    useGameStore.getState().setRuleOptions({
      allowRobWithFiveHearts: allowRobWithFiveHearts ?? false,
    });
    navigation.goBack();
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.primary }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background.primary} />
      
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background.secondary }}>
        <NavigationHeader title="Settings" />
      </SafeAreaView>
      
      <LinearGradient
        colors={[colors.background.primary, colors.background.secondary, colors.background.primary]}
        style={{ flex: 1 }}
      >
        <ScrollView style={{ flex: 1, padding: 24 }} contentContainerStyle={{ paddingBottom: 32 }}>

          <View className="gap-4">
            {/* Sound toggle */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: colors.background.surface,
                padding: 16,
                borderRadius: borderRadius.lg,
                ...shadows.extruded.small,
                borderWidth: 1,
                borderColor: colors.softUI.border,
              }}
            >
              <Text style={{ fontSize: 16, color: colors.text.primary }}>Sound Effects</Text>
              <Switch
                value={soundEnabled}
                onValueChange={setSoundEnabled}
                trackColor={{ false: colors.background.primary, true: colors.gold.dark }}
                thumbColor={soundEnabled ? colors.gold.light : colors.text.muted}
              />
            </View>

            {/* Animation Speed */}
            <SettingRow label="Animation Speed">
              <View className="flex-row gap-2 flex-wrap">
                {(["slow", "normal", "fast", "off"] as const).map((s) => (
                  <Button
                    key={s}
                    title={s}
                    size="small"
                    variant={animationSpeed === s ? "primary" : "outline"}
                    onPress={() => setAnimationSpeed(s)}
                  />
                ))}
              </View>
            </SettingRow>

            {/* Card Size */}
            <SettingRow label="Card Size">
              <View className="flex-row gap-2">
                {(["small", "medium", "large"] as const).map((s) => (
                  <Button
                    key={s}
                    title={s}
                    size="small"
                    variant={cardSize === s ? "primary" : "outline"}
                    onPress={() => setCardSize(s)}
                  />
                ))}
              </View>
            </SettingRow>

            {/* Show Hints toggle */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: colors.background.surface,
                padding: 16,
                borderRadius: borderRadius.lg,
                ...shadows.extruded.small,
                borderWidth: 1,
                borderColor: colors.softUI.border,
              }}
            >
              <Text style={{ fontSize: 16, color: colors.text.primary }}>Show Hints</Text>
              <Switch
                value={showHints}
                onValueChange={setShowHints}
                trackColor={{ false: colors.background.primary, true: colors.gold.dark }}
                thumbColor={showHints ? colors.gold.light : colors.text.muted}
              />
            </View>

            {/* AI Difficulty */}
            <SettingRow label="AI Difficulty">
              <View className="flex-row gap-2 flex-wrap">
                {(["easy", "medium", "hard"] as const).map((d) => (
                  <Button
                    key={d}
                    title={d}
                    size="small"
                    variant={aiDifficulty === d ? "primary" : "outline"}
                    onPress={() => setAIDifficulty(d)}
                  />
                ))}
              </View>
            </SettingRow>

            {/* Rule Variation toggle */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: colors.background.surface,
                padding: 16,
                borderRadius: borderRadius.lg,
                ...shadows.extruded.small,
                borderWidth: 1,
                borderColor: colors.softUI.border,
              }}
            >
              <Text style={{ fontSize: 16, color: colors.text.primary, flex: 1 }}>
                Allow rob with <Text style={{ color: colors.suits.hearts }}>5♥</Text>
              </Text>
              <Switch
                value={allowRobWithFiveHearts ?? false}
                onValueChange={(v) => setRuleVariations({ allowRobWithFiveHearts: v })}
                trackColor={{ false: colors.background.primary, true: colors.gold.dark }}
                thumbColor={allowRobWithFiveHearts ? colors.gold.light : colors.text.muted}
              />
            </View>
          </View>

          <View className="mt-8">
            <Button title="Save" onPress={handleSave} />
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}
