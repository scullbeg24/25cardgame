import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useState, useRef, useEffect } from "react";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { colors, borderRadius, shadows } from "../theme";
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

const EVENT_ICONS: Partial<Record<GameLogEventType, string>> = {
  game_start: "🎮",
  hand_start: "🃏",
  trick_won: "✨",
  hand_won: "🏆",
  game_won: "👑",
  rob_offered: "💰",
  rob_accepted: "✅",
  rob_declined: "❌",
  trump_revealed: "🎯",
  invalid_play: "⚠️",
};

interface GameLogProps {
  /** Maximum height when expanded */
  maxHeight?: number;
  /** Whether to show in collapsed mode (just shows recent events) */
  collapsible?: boolean;
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function LogEntry({ entry }: { entry: GameLogEntry }) {
  const color = EVENT_COLORS[entry.type] || colors.text.secondary;
  const icon = EVENT_ICONS[entry.type];

  return (
    <View
      style={{
        flexDirection: "row",
        paddingVertical: 6,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: colors.softUI.border,
      }}
    >
      {icon && (
        <Text style={{ fontSize: 12, marginRight: 6 }}>{icon}</Text>
      )}
      <Text
        style={{
          flex: 1,
          color,
          fontSize: 12,
          lineHeight: 18,
        }}
      >
        {entry.message}
      </Text>
      <Text
        style={{
          color: colors.text.muted,
          fontSize: 10,
          marginLeft: 8,
        }}
      >
        {formatTime(entry.timestamp)}
      </Text>
    </View>
  );
}

export default function GameLog({
  maxHeight = 200,
  collapsible = true,
}: GameLogProps) {
  const logs = useGameLogStore((s) => s.logs);
  const [isExpanded, setIsExpanded] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const height = useSharedValue(collapsible ? 44 : maxHeight);
  const [hasNewLogs, setHasNewLogs] = useState(false);
  const prevLogCount = useRef(logs.length);

  // Animate height when expanding/collapsing
  useEffect(() => {
    if (collapsible) {
      height.value = withSpring(isExpanded ? maxHeight : 44, {
        damping: 20,
        stiffness: 150,
      });
    }
  }, [isExpanded, maxHeight, collapsible, height]);

  // Track new logs for notification badge
  useEffect(() => {
    if (logs.length > prevLogCount.current && !isExpanded) {
      setHasNewLogs(true);
    }
    prevLogCount.current = logs.length;
  }, [logs.length, isExpanded]);

  // Clear badge when expanded
  useEffect(() => {
    if (isExpanded) {
      setHasNewLogs(false);
    }
  }, [isExpanded]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
  }));

  const recentLog = logs[0];

  if (!collapsible) {
    // Full log view (for a dedicated log screen)
    return (
      <View
        style={{
          backgroundColor: colors.background.surface,
          borderRadius: borderRadius.lg,
          overflow: "hidden",
          maxHeight,
          ...shadows.extruded.small,
          borderWidth: 1,
          borderColor: colors.gold.dark,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            padding: 10,
            borderBottomWidth: 1,
            borderBottomColor: colors.softUI.border,
            backgroundColor: colors.background.primary,
          }}
        >
          <Text style={{ fontSize: 14 }}>📜</Text>
          <Text
            style={{
              color: colors.gold.primary,
              fontSize: 12,
              fontWeight: "600",
              marginLeft: 6,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            Game Log
          </Text>
          <Text
            style={{
              color: colors.text.muted,
              fontSize: 11,
              marginLeft: "auto",
            }}
          >
            {logs.length} events
          </Text>
        </View>
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
      </View>
    );
  }

  // Collapsible log view
  return (
    <Animated.View
      style={[
        animatedStyle,
        {
          backgroundColor: colors.background.surface,
          borderRadius: borderRadius.lg,
          overflow: "hidden",
          ...shadows.extruded.small,
          borderWidth: 1,
          borderColor: colors.gold.dark,
        },
      ]}
    >
      {/* Header - always visible */}
      <TouchableOpacity
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.8}
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 10,
          borderBottomWidth: isExpanded ? 1 : 0,
          borderBottomColor: colors.softUI.border,
          backgroundColor: colors.background.primary,
        }}
      >
        <Text style={{ fontSize: 14 }}>📜</Text>
        <Text
          style={{
            color: colors.gold.primary,
            fontSize: 12,
            fontWeight: "600",
            marginLeft: 6,
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          Game Log
        </Text>

        {/* Show recent message when collapsed */}
        {!isExpanded && recentLog && (
          <Text
            numberOfLines={1}
            style={{
              flex: 1,
              color: EVENT_COLORS[recentLog.type],
              fontSize: 11,
              marginLeft: 12,
              marginRight: 8,
            }}
          >
            {recentLog.message}
          </Text>
        )}

        {/* New log indicator */}
        {hasNewLogs && !isExpanded && (
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: colors.state.warning,
              marginRight: 8,
            }}
          />
        )}

        {/* Expand/collapse icon */}
        <Text
          style={{
            color: colors.text.muted,
            fontSize: 12,
            marginLeft: "auto",
          }}
        >
          {isExpanded ? "▼" : "▲"}
        </Text>
      </TouchableOpacity>

      {/* Log entries - visible when expanded */}
      {isExpanded && (
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
      )}
    </Animated.View>
  );
}
