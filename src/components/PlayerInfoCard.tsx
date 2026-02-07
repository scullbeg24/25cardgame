import { View, Text } from "react-native";
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  useSharedValue,
} from "react-native-reanimated";
import { useEffect } from "react";
import { colors, borderRadius } from "../theme";

/** Player color palette for individual mode (indexed by player position) */
const PLAYER_COLORS = [
  colors.teams.team1,  // blue
  colors.teams.team2,  // red
  { primary: "#22c55e", light: "#4ade80", bg: "rgba(34, 197, 94, 0.15)", bgActive: "rgba(34, 197, 94, 0.3)" },  // green
  { primary: "#a855f7", light: "#c084fc", bg: "rgba(168, 85, 247, 0.15)", bgActive: "rgba(168, 85, 247, 0.3)" },  // purple
  { primary: "#f59e0b", light: "#fbbf24", bg: "rgba(245, 158, 11, 0.15)", bgActive: "rgba(245, 158, 11, 0.3)" },  // amber
  { primary: "#06b6d4", light: "#22d3ee", bg: "rgba(6, 182, 212, 0.15)", bgActive: "rgba(6, 182, 212, 0.3)" },  // cyan
  { primary: "#ec4899", light: "#f472b6", bg: "rgba(236, 72, 153, 0.15)", bgActive: "rgba(236, 72, 153, 0.3)" },  // pink
  { primary: "#84cc16", light: "#a3e635", bg: "rgba(132, 204, 22, 0.15)", bgActive: "rgba(132, 204, 22, 0.3)" },  // lime
  { primary: "#f97316", light: "#fb923c", bg: "rgba(249, 115, 22, 0.15)", bgActive: "rgba(249, 115, 22, 0.3)" },  // orange
  { primary: "#8b5cf6", light: "#a78bfa", bg: "rgba(139, 92, 246, 0.15)", bgActive: "rgba(139, 92, 246, 0.3)" },  // violet
];

export function getPlayerColor(playerIndex: number, teamIndex?: number) {
  if (teamIndex !== undefined && teamIndex >= 0 && teamIndex <= 1) {
    return teamIndex === 0 ? colors.teams.team1 : colors.teams.team2;
  }
  return PLAYER_COLORS[playerIndex % PLAYER_COLORS.length];
}

interface PlayerInfoCardProps {
  name: string;
  score: number;
  tricksWon: number;
  isCurrentPlayer: boolean;
  isYou?: boolean;
  /** Team index (0 or 1) for team mode, or player index for individual color */
  teamIndex: number;
  position: "top" | "left" | "right" | "bottom";
  isLeader?: boolean;
  isDealer?: boolean;
  isRobber?: boolean;
}

export default function PlayerInfoCard({
  name,
  score,
  isCurrentPlayer,
  isYou = false,
  teamIndex,
  position,
  isDealer = false,
  isRobber = false,
}: PlayerInfoCardProps) {
  const glowOpacity = useSharedValue(0.6);

  // Pulse animation for current player
  useEffect(() => {
    if (isCurrentPlayer) {
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 600 }),
          withTiming(0.5, { duration: 600 })
        ),
        -1,
        true
      );
    } else {
      glowOpacity.value = withTiming(0.6, { duration: 200 });
    }
  }, [isCurrentPlayer]);

  const badgeStyle = useAnimatedStyle(() => ({
    opacity: isCurrentPlayer ? glowOpacity.value : 1,
  }));

  const teamColor = teamIndex <= 1
    ? (teamIndex === 0 ? colors.teams.team1 : colors.teams.team2)
    : PLAYER_COLORS[teamIndex % PLAYER_COLORS.length];
  const displayName = isYou ? "You" : name;

  return (
    <Animated.View
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: isCurrentPlayer ? teamColor.bgActive : teamColor.bg,
          borderRadius: borderRadius.round,
          paddingVertical: 3,
          paddingHorizontal: 7,
          borderWidth: isCurrentPlayer ? 2 : 1,
          borderColor: isCurrentPlayer ? colors.gold.primary : teamColor.primary,
        },
        badgeStyle,
      ]}
    >
      {/* Score circle - shows current score instead of initial */}
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: teamColor.primary,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 5,
        }}
      >
        <Text style={{ color: "#fff", fontSize: score >= 10 ? 9 : 11, fontWeight: "bold" }}>
          {score}
        </Text>
      </View>

      {/* Name */}
      <Text
        style={{
          color: isCurrentPlayer ? colors.gold.light : teamColor.light,
          fontSize: 11,
          fontWeight: "600",
          maxWidth: 55,
        }}
        numberOfLines={1}
      >
        {displayName}
      </Text>

      {/* Dealer badge */}
      {isDealer && (
        <View
          style={{
            backgroundColor: colors.gold.dark,
            paddingHorizontal: 4,
            paddingVertical: 1,
            borderRadius: 4,
            marginLeft: 3,
          }}
        >
          <Text style={{ color: colors.text.primary, fontSize: 8, fontWeight: "bold" }}>D</Text>
        </View>
      )}

      {/* Rob badge - shows when this player robbed the trump card this hand */}
      {isRobber && (
        <View
          style={{
            backgroundColor: "#7c3aed",
            paddingHorizontal: 4,
            paddingVertical: 1,
            borderRadius: 4,
            marginLeft: 3,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 8, fontWeight: "bold" }}>R</Text>
        </View>
      )}
    </Animated.View>
  );
}
