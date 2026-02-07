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
import { getTeamColors } from "../theme/colors";

interface PlayerInfoCardProps {
  name: string;
  score: number;
  tricksWon: number;
  isCurrentPlayer: boolean;
  isYou?: boolean;
  /** Team index (0-indexed) for team coloring via getTeamColors() */
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

  const teamColor = getTeamColors(teamIndex);
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
      {/* Score circle - shows current score */}
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
