import { View, Text } from "react-native";
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useEffect } from "react";
import { colors, shadows, borderRadius } from "../theme";

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
  score,
  tricksWon,
  isCurrentPlayer,
  isYou = false,
  teamIndex,
  position,
  isLeader = false,
  isDealer = false,
}: PlayerInfoCardProps) {
  const glowOpacity = useSharedValue(0);
  const scaleValue = useSharedValue(1);

  // Pulse animation for current player
  useEffect(() => {
    if (isCurrentPlayer) {
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 800 }),
          withTiming(0.4, { duration: 800 })
        ),
        -1,
        true
      );
      scaleValue.value = withSpring(1.02);
    } else {
      glowOpacity.value = withTiming(0, { duration: 300 });
      scaleValue.value = withSpring(1);
    }
  }, [isCurrentPlayer]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
  }));

  const teamColor = teamIndex === 0 ? colors.teams.team1 : colors.teams.team2;
  
  // Determine layout based on position
  const isVertical = position === "left" || position === "right";
  
  return (
    <Animated.View
      style={[
        {
          backgroundColor: colors.background.surface,
          borderRadius: borderRadius.lg,
          padding: isVertical ? 8 : 10,
          minWidth: isVertical ? 70 : 120,
          ...shadows.extruded.medium,
          borderWidth: 1,
          borderColor: isCurrentPlayer ? colors.gold.primary : colors.softUI.border,
        },
        cardStyle,
      ]}
    >
      {/* Gold glow overlay for active player */}
      {isCurrentPlayer && (
        <Animated.View
          style={[
            {
              position: "absolute",
              top: -2,
              left: -2,
              right: -2,
              bottom: -2,
              borderRadius: borderRadius.lg + 2,
              borderWidth: 2,
              borderColor: colors.gold.primary,
              ...shadows.goldGlow,
            },
            glowStyle,
          ]}
        />
      )}

      <View style={{ flexDirection: isVertical ? "column" : "row", alignItems: "center" }}>
        {/* Avatar placeholder */}
        <View
          style={{
            width: isVertical ? 32 : 40,
            height: isVertical ? 32 : 40,
            borderRadius: isVertical ? 16 : 20,
            backgroundColor: teamColor.bg,
            borderWidth: 2,
            borderColor: teamColor.primary,
            alignItems: "center",
            justifyContent: "center",
            marginRight: isVertical ? 0 : 10,
            marginBottom: isVertical ? 6 : 0,
          }}
        >
          <Text style={{ color: teamColor.light, fontSize: isVertical ? 14 : 18, fontWeight: "bold" }}>
            {isYou ? "Y" : name.charAt(0).toUpperCase()}
          </Text>
        </View>

        {/* Info section */}
        <View style={{ alignItems: isVertical ? "center" : "flex-start", flex: 1 }}>
          {/* Name */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Text
              style={{
                color: isCurrentPlayer ? colors.gold.light : colors.text.primary,
                fontSize: isVertical ? 11 : 13,
                fontWeight: "600",
              }}
              numberOfLines={1}
            >
              {isYou ? "You" : name}
            </Text>
            {isDealer && (
              <View
                style={{
                  backgroundColor: colors.gold.dark,
                  paddingHorizontal: 4,
                  paddingVertical: 1,
                  borderRadius: 4,
                }}
              >
                <Text style={{ color: colors.text.primary, fontSize: 8, fontWeight: "bold" }}>D</Text>
              </View>
            )}
            {isLeader && (
              <Text style={{ color: colors.gold.primary, fontSize: 10 }}>★</Text>
            )}
          </View>

          {/* Score row */}
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4, gap: isVertical ? 4 : 8 }}>
            {/* Score badge */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: colors.background.secondary,
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: borderRadius.sm,
              }}
            >
              <Text style={{ color: colors.gold.muted, fontSize: 9, fontWeight: "600" }}>S</Text>
              <Text style={{ color: colors.text.primary, fontSize: 11, fontWeight: "bold", marginLeft: 3 }}>
                {score}
              </Text>
            </View>

            {/* Tricks badge */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: colors.background.secondary,
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: borderRadius.sm,
              }}
            >
              <Text style={{ color: colors.gold.muted, fontSize: 9, fontWeight: "600" }}>T</Text>
              <Text style={{ color: colors.text.primary, fontSize: 11, fontWeight: "bold", marginLeft: 3 }}>
                {tricksWon}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Turn indicator bar */}
      {isCurrentPlayer && (
        <View
          style={{
            height: 3,
            backgroundColor: colors.background.secondary,
            borderRadius: 2,
            marginTop: 8,
            overflow: "hidden",
          }}
        >
          <Animated.View
            style={{
              height: "100%",
              backgroundColor: colors.gold.primary,
              borderRadius: 2,
              width: "100%",
            }}
          />
        </View>
      )}
    </Animated.View>
  );
}
