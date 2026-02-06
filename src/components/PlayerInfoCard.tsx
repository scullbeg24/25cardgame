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

interface PlayerInfoCardProps {
  name: string;
  score: number;
  tricksWon: number;
  isCurrentPlayer: boolean;
  isYou?: boolean;
  teamIndex: 0 | 1; // 0 = your team (blue), 1 = opponent (red)
  position: "top" | "left" | "right" | "bottom";
  isLeader?: boolean;
  isDealer?: boolean;
}

export default function PlayerInfoCard({
  name,
  isCurrentPlayer,
  isYou = false,
  teamIndex,
  position,
  isDealer = false,
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

  const teamColor = teamIndex === 0 ? colors.teams.team1 : colors.teams.team2;
  const displayName = isYou ? "You" : name;
  const initial = isYou ? "Y" : name.charAt(0).toUpperCase();
  
  return (
    <Animated.View
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: isCurrentPlayer ? teamColor.bgActive : teamColor.bg,
          borderRadius: borderRadius.round,
          paddingVertical: 4,
          paddingHorizontal: 8,
          borderWidth: isCurrentPlayer ? 2 : 1,
          borderColor: isCurrentPlayer ? colors.gold.primary : teamColor.primary,
        },
        badgeStyle,
      ]}
    >
      {/* Small avatar circle */}
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          backgroundColor: teamColor.primary,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 6,
        }}
      >
        <Text style={{ color: "#fff", fontSize: 11, fontWeight: "bold" }}>
          {initial}
        </Text>
      </View>

      {/* Name */}
      <Text
        style={{
          color: isCurrentPlayer ? colors.gold.light : teamColor.light,
          fontSize: 11,
          fontWeight: "600",
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
            marginLeft: 4,
          }}
        >
          <Text style={{ color: colors.text.primary, fontSize: 8, fontWeight: "bold" }}>D</Text>
        </View>
      )}
    </Animated.View>
  );
}
