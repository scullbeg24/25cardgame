import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Button from "../components/Button";
import { colors, shadows, borderRadius } from "../theme";
import type { RootStackParamList } from "./HomeScreen";

type RulesNavProp = NativeStackNavigationProp<RootStackParamList, "Rules">;

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  const [expanded, setExpanded] = useState(false);
  return (
    <View style={{ marginBottom: 16 }}>
      <TouchableOpacity
        onPress={() => setExpanded(!expanded)}
        style={{
          backgroundColor: colors.background.surface,
          padding: 16,
          borderRadius: borderRadius.lg,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          ...shadows.extruded.small,
          borderWidth: 1,
          borderColor: expanded ? colors.gold.dark : colors.softUI.border,
          borderBottomLeftRadius: expanded ? 0 : borderRadius.lg,
          borderBottomRightRadius: expanded ? 0 : borderRadius.lg,
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: "600", color: colors.gold.light }}>
          {title}
        </Text>
        <Text style={{ color: colors.gold.primary, fontSize: 18 }}>
          {expanded ? "−" : "+"}
        </Text>
      </TouchableOpacity>
      {expanded && (
        <View
          style={{
            backgroundColor: colors.background.primary,
            padding: 16,
            borderBottomLeftRadius: borderRadius.lg,
            borderBottomRightRadius: borderRadius.lg,
            borderWidth: 1,
            borderTopWidth: 0,
            borderColor: colors.gold.dark,
          }}
        >
          {children}
        </View>
      )}
    </View>
  );
}

export default function RulesScreen() {
  const navigation = useNavigation<RulesNavProp>();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.primary }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background.primary} />
      
      <LinearGradient
        colors={[colors.background.primary, colors.background.secondary, colors.background.primary]}
        style={{ flex: 1 }}
      >
        <ScrollView style={{ flex: 1, padding: 24 }} contentContainerStyle={{ paddingBottom: 24 }}>
          <Text
            style={{
              fontSize: 28,
              fontWeight: "bold",
              color: colors.gold.primary,
              textAlign: "center",
              marginBottom: 24,
            }}
          >
            How to Play 25
          </Text>

          <Section title="Objective">
            <Text style={{ color: colors.text.secondary, fontSize: 15, lineHeight: 24 }}>
              Be the first team to score 25 points (5 tricks × 5 points each).
              First team to win 5 hands wins the game.
            </Text>
          </Section>

          <Section title="Trump Hierarchy">
            <Text style={{ color: colors.text.secondary, fontSize: 15, lineHeight: 24, marginBottom: 8 }}>
              Highest to lowest:
            </Text>
            <Text style={{ color: colors.text.primary, fontSize: 15, lineHeight: 26 }}>
              1. <Text style={{ color: colors.suits.hearts }}>5♥</Text> (always highest){"\n"}
              2. Jack of trump{"\n"}
              3. <Text style={{ color: colors.suits.hearts }}>A♥</Text> (always 3rd){"\n"}
              4. Ace of trump{"\n"}
              5. K, Q, then numerals
            </Text>
          </Section>

          <Section title="Robbing the Pack">
            <Text style={{ color: colors.text.secondary, fontSize: 15, lineHeight: 24 }}>
              If you're the dealer and hold the Ace of trump, you may take the
              face-up trump card and discard any card. You must decide before play
              begins.
            </Text>
          </Section>

          <Section title="Following Suit">
            <Text style={{ color: colors.text.secondary, fontSize: 15, lineHeight: 24 }}>
              You must follow suit when able. If trump was led, you must play
              trump if you have any. If you can't follow, you may play any card.
            </Text>
          </Section>

          <Section title="Scoring">
            <Text style={{ color: colors.text.secondary, fontSize: 15, lineHeight: 24 }}>
              Each trick = 5 points. First to 25 wins the hand. First to 5 hands
              wins the game.
            </Text>
          </Section>

          <View className="mt-6">
            <Button title="Got it" onPress={() => navigation.goBack()} />
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}
