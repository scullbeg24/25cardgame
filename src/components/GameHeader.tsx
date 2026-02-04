import { View, Text, Pressable, ScrollView, TouchableOpacity, Modal } from "react-native";
import Animated, {
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  useSharedValue,
} from "react-native-reanimated";
import { useEffect, useState, useRef } from "react";
import { colors, shadows, borderRadius } from "../theme";
import { useGameLogStore, type GameLogEntry, type GameLogEventType } from "../store/gameLogStore";

const EVENT_COLORS: Record<GameLogEventType, string> = {
  game_start: colors.gold.primary,
  hand_start: colors.gold.muted,
  deal: colors.text.secondary,
  card_played: colors.text.secondary,
  trick_won: colors.state.success,
  hand_won: colors.gold.light,
  game_won: colors.gold.primary,
  rob_offered: colors.gold.primary,
  rob_accepted: colors.gold.light,
  rob_declined: colors.text.muted,
  trump_revealed: colors.gold.primary,
  invalid_play: colors.state.error,
  info: colors.text.secondary,
};

interface GameHeaderProps {
  currentPlayerName: string;
  isYourTurn: boolean;
  onInfoPress?: () => void;
  onMenuPress?: () => void;
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function LogEntry({ entry, compact = false }: { entry: GameLogEntry; compact?: boolean }) {
  const color = EVENT_COLORS[entry.type] || colors.text.secondary;

  return (
    <View
      style={{
        flexDirection: "row",
        paddingVertical: compact ? 4 : 6,
        paddingHorizontal: compact ? 8 : 10,
        borderBottomWidth: 1,
        borderBottomColor: colors.softUI.border,
      }}
    >
      <Text
        style={{
          flex: 1,
          color,
          fontSize: compact ? 11 : 12,
          lineHeight: compact ? 16 : 18,
        }}
      >
        {entry.message}
      </Text>
      <Text
        style={{
          color: colors.text.muted,
          fontSize: compact ? 9 : 10,
          marginLeft: 8,
        }}
      >
        {formatTime(entry.timestamp)}
      </Text>
    </View>
  );
}

export default function GameHeader({
  currentPlayerName,
  isYourTurn,
  onInfoPress,
  onMenuPress,
}: GameHeaderProps) {
  const logs = useGameLogStore((s) => s.logs);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showHandHistory, setShowHandHistory] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const expandedHeight = useSharedValue(0);
  const turnGlow = useSharedValue(0.8);

  const maxExpandedHeight = 220;

  // Animate turn indicator when it's your turn
  useEffect(() => {
    if (isYourTurn) {
      turnGlow.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 600 }),
          withTiming(0.6, { duration: 600 })
        ),
        -1,
        true
      );
    } else {
      turnGlow.value = withTiming(0.8, { duration: 300 });
    }
  }, [isYourTurn]);

  const turnStyle = useAnimatedStyle(() => ({
    opacity: turnGlow.value,
  }));

  // Animate expanded section
  useEffect(() => {
    expandedHeight.value = withSpring(isExpanded ? maxExpandedHeight : 0, {
      damping: 20,
      stiffness: 150,
    });
  }, [isExpanded]);

  const animatedExpandStyle = useAnimatedStyle(() => ({
    height: expandedHeight.value,
    opacity: expandedHeight.value > 0 ? 1 : 0,
  }));

  // Get recent logs for display (last 3)
  const recentLogs = logs.slice(0, 3);

  return (
    <View
      style={{
        backgroundColor: colors.background.secondary,
        borderBottomWidth: 1,
        borderBottomColor: colors.softUI.border,
      }}
    >
      {/* Main header row */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "stretch",
          justifyContent: "space-between",
          paddingHorizontal: 12,
          paddingVertical: 10,
        }}
      >
        {/* Info Button */}
        <Pressable
          onPress={onInfoPress}
          style={({ pressed }) => ({
            width: 44,
            height: 44,
            borderRadius: borderRadius.md,
            backgroundColor: pressed ? colors.background.primary : colors.background.surface,
            alignItems: "center",
            justifyContent: "center",
            ...shadows.extruded.small,
            borderWidth: 1,
            borderColor: colors.softUI.border,
          })}
          accessibilityLabel="Game info"
          accessibilityRole="button"
        >
          <Text style={{ color: colors.text.secondary, fontSize: 20, fontWeight: "600" }}>i</Text>
        </Pressable>

        {/* Game Log & Turn Display - Center */}
        <TouchableOpacity
          onPress={() => setIsExpanded(!isExpanded)}
          activeOpacity={0.8}
          style={{
            flex: 1,
            marginHorizontal: 10,
            backgroundColor: colors.background.surface,
            borderRadius: borderRadius.lg,
            overflow: "hidden",
            ...shadows.extruded.small,
            borderWidth: 1,
            borderColor: colors.gold.dark,
          }}
        >
          {/* Turn indicator row */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 12,
              paddingVertical: 6,
              backgroundColor: isYourTurn ? colors.gold.dark + "40" : colors.background.primary,
              borderBottomWidth: 1,
              borderBottomColor: colors.softUI.border,
            }}
          >
            <Animated.Text
              style={[
                turnStyle,
                {
                  color: isYourTurn ? colors.gold.light : colors.text.primary,
                  fontSize: 13,
                  fontWeight: "600",
                },
              ]}
            >
              {isYourTurn ? "Your Turn" : `${currentPlayerName}'s Turn`}
            </Animated.Text>
            <Text style={{ color: colors.text.muted, fontSize: 10 }}>
              {isExpanded ? "▲" : "▼"}
            </Text>
          </View>

          {/* Recent log entries */}
          <View style={{ paddingVertical: 2 }}>
            {recentLogs.length === 0 ? (
              <Text
                style={{
                  color: colors.text.muted,
                  fontSize: 11,
                  textAlign: "center",
                  paddingVertical: 8,
                  fontStyle: "italic",
                }}
              >
                Game starting...
              </Text>
            ) : (
              recentLogs.map((entry) => (
                <LogEntry key={entry.id} entry={entry} compact />
              ))
            )}
          </View>
        </TouchableOpacity>

        {/* Hand History Button */}
        <Pressable
          onPress={() => setShowHandHistory(true)}
          style={({ pressed }) => ({
            width: 44,
            height: 44,
            borderRadius: borderRadius.md,
            backgroundColor: pressed ? colors.background.primary : colors.background.surface,
            alignItems: "center",
            justifyContent: "center",
            ...shadows.extruded.small,
            borderWidth: 1,
            borderColor: colors.softUI.border,
            marginRight: 8,
          })}
          accessibilityLabel="Hand history"
          accessibilityRole="button"
        >
          <Text style={{ fontSize: 18 }}>📋</Text>
        </Pressable>

        {/* Menu Button */}
        <Pressable
          onPress={onMenuPress}
          style={({ pressed }) => ({
            width: 44,
            height: 44,
            borderRadius: borderRadius.md,
            backgroundColor: pressed ? colors.background.primary : colors.background.surface,
            alignItems: "center",
            justifyContent: "center",
            ...shadows.extruded.small,
            borderWidth: 1,
            borderColor: colors.softUI.border,
          })}
          accessibilityLabel="Open menu"
          accessibilityRole="button"
        >
          <View style={{ gap: 4 }}>
            <View style={{ width: 18, height: 2, backgroundColor: colors.text.secondary, borderRadius: 1 }} />
            <View style={{ width: 18, height: 2, backgroundColor: colors.text.secondary, borderRadius: 1 }} />
            <View style={{ width: 18, height: 2, backgroundColor: colors.text.secondary, borderRadius: 1 }} />
          </View>
        </Pressable>
      </View>

      {/* Expandable full log section */}
      <Animated.View
        style={[
          animatedExpandStyle,
          {
            overflow: "hidden",
            backgroundColor: colors.background.surface,
            borderTopWidth: 1,
            borderTopColor: colors.softUI.border,
          },
        ]}
      >
        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 4 }}
        >
          {logs.length === 0 ? (
            <Text
              style={{
                color: colors.text.muted,
                fontSize: 12,
                textAlign: "center",
                padding: 20,
                fontStyle: "italic",
              }}
            >
              No events yet...
            </Text>
          ) : (
            logs.map((entry) => <LogEntry key={entry.id} entry={entry} />)
          )}
        </ScrollView>
      </Animated.View>

      {/* Hand History Modal */}
      <Modal
        visible={showHandHistory}
        transparent
        animationType="fade"
        onRequestClose={() => setShowHandHistory(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            padding: 16,
          }}
          activeOpacity={1}
          onPress={() => setShowHandHistory(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: colors.background.surface,
              borderRadius: borderRadius.xl,
              width: "100%",
              maxWidth: 500,
              maxHeight: "80%",
              ...shadows.extruded.large,
              borderWidth: 2,
              borderColor: colors.gold.dark,
            }}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                padding: 16,
                borderBottomWidth: 1,
                borderBottomColor: colors.softUI.border,
                backgroundColor: colors.background.primary,
                borderTopLeftRadius: borderRadius.xl,
                borderTopRightRadius: borderRadius.xl,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={{ fontSize: 20 }}>📋</Text>
                <Text
                  style={{
                    color: colors.gold.primary,
                    fontSize: 18,
                    fontWeight: "bold",
                    marginLeft: 10,
                  }}
                >
                  Hand History
                </Text>
              </View>
              <Pressable
                onPress={() => setShowHandHistory(false)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: colors.background.surface,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: colors.text.secondary, fontSize: 18 }}>✕</Text>
              </Pressable>
            </View>

            {/* Log entries */}
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ padding: 8 }}
            >
              {logs.length === 0 ? (
                <Text
                  style={{
                    color: colors.text.muted,
                    fontSize: 14,
                    textAlign: "center",
                    padding: 40,
                    fontStyle: "italic",
                  }}
                >
                  No hand history yet...
                </Text>
              ) : (
                logs.map((entry) => <LogEntry key={entry.id} entry={entry} />)
              )}
            </ScrollView>

            {/* Footer */}
            <View
              style={{
                padding: 12,
                borderTopWidth: 1,
                borderTopColor: colors.softUI.border,
                alignItems: "center",
              }}
            >
              <Text style={{ color: colors.text.muted, fontSize: 11 }}>
                {logs.length} events recorded
              </Text>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
