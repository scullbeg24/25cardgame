/**
 * Reusable animated badge component for achievements and milestones
 */

import { useEffect } from "react";
import { Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withDelay,
  withTiming,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import { colors, borderRadius, shadows } from "../theme";

export type BadgeVariant = "gold" | "success" | "team1" | "team2" | "special";

interface BadgeProps {
  text: string;
  subText?: string;
  icon?: string;
  variant?: BadgeVariant;
  visible: boolean;
  onHide?: () => void;
  duration?: number;
  size?: "small" | "medium" | "large";
}

const variantStyles = {
  gold: {
    bg: colors.gold.primary,
    border: colors.gold.light,
    text: colors.text.inverse,
    glow: colors.gold.light,
  },
  success: {
    bg: colors.state.success,
    border: "#4ade80",
    text: "#ffffff",
    glow: "#22c55e",
  },
  team1: {
    bg: colors.teams.team1.primary,
    border: colors.teams.team1.light,
    text: "#ffffff",
    glow: colors.teams.team1.light,
  },
  team2: {
    bg: colors.teams.team2.primary,
    border: colors.teams.team2.light,
    text: "#ffffff",
    glow: colors.teams.team2.light,
  },
  special: {
    bg: "#9333ea",
    border: "#a855f7",
    text: "#ffffff",
    glow: "#c084fc",
  },
};

const sizeStyles = {
  small: { padding: 4, fontSize: 10, iconSize: 12, minWidth: 40 },
  medium: { padding: 6, fontSize: 12, iconSize: 16, minWidth: 50 },
  large: { padding: 10, fontSize: 14, iconSize: 20, minWidth: 70 },
};

export default function Badge({
  text,
  subText,
  icon,
  variant = "gold",
  visible,
  onHide,
  duration = 1200,
  size = "medium",
}: BadgeProps) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-20);

  const style = variantStyles[variant];
  const sizeStyle = sizeStyles[size];

  useEffect(() => {
    if (visible) {
      // Entrance animation
      scale.value = withSequence(
        withSpring(1.2, { damping: 8, stiffness: 200 }),
        withSpring(1, { damping: 12, stiffness: 200 })
      );
      opacity.value = withTiming(1, { duration: 150 });
      translateY.value = withSpring(0, { damping: 15, stiffness: 200 });

      // Auto-hide after duration
      if (onHide) {
        const hideDelay = duration;
        scale.value = withDelay(
          hideDelay,
          withTiming(0.8, { duration: 200 }, (finished) => {
            if (finished) {
              runOnJS(onHide)();
            }
          })
        );
        opacity.value = withDelay(hideDelay, withTiming(0, { duration: 200 }));
        translateY.value = withDelay(
          hideDelay,
          withTiming(-20, { duration: 200 })
        );
      }
    } else {
      scale.value = 0;
      opacity.value = 0;
      translateY.value = -20;
    }
  }, [visible, duration, onHide]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        {
          backgroundColor: style.bg,
          borderRadius: borderRadius.lg,
          padding: sizeStyle.padding,
          paddingHorizontal: sizeStyle.padding * 1.5,
          minWidth: sizeStyle.minWidth,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 2,
          borderColor: style.border,
          ...shadows.extruded.medium,
          shadowColor: style.glow,
          shadowOpacity: 0.5,
          shadowRadius: 10,
        },
        animatedStyle,
      ]}
    >
      {icon && (
        <Text
          style={{
            fontSize: sizeStyle.iconSize,
            marginBottom: subText || text ? 2 : 0,
          }}
        >
          {icon}
        </Text>
      )}
      <Text
        style={{
          color: style.text,
          fontSize: sizeStyle.fontSize,
          fontWeight: "bold",
          textAlign: "center",
        }}
      >
        {text}
      </Text>
      {subText && (
        <Text
          style={{
            color: style.text,
            fontSize: sizeStyle.fontSize * 0.7,
            opacity: 0.9,
            marginTop: 2,
          }}
        >
          {subText}
        </Text>
      )}
    </Animated.View>
  );
}

/**
 * Floating badge that appears at a specific position and floats upward
 */
export function FloatingBadge({
  text,
  icon,
  variant = "gold",
  visible,
  onHide,
}: Omit<BadgeProps, "subText" | "size" | "duration">) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);

  const style = variantStyles[variant];

  useEffect(() => {
    if (visible) {
      // Quick pop in and float up
      scale.value = withSequence(
        withSpring(1.05, { damping: 12 }),
        withSpring(1, { damping: 15 })
      );
      opacity.value = withTiming(1, { duration: 100 });
      translateY.value = withSequence(
        withTiming(0, { duration: 50 }),
        withDelay(
          400,
          withTiming(-30, { duration: 400, easing: Easing.out(Easing.ease) })
        )
      );

      // Fade out quickly
      opacity.value = withDelay(600, withTiming(0, { duration: 200 }));

      if (onHide) {
        setTimeout(onHide, 800);
      }
    } else {
      translateY.value = 0;
      opacity.value = 0;
      scale.value = 0.5;
    }
  }, [visible, onHide]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        {
          backgroundColor: style.bg,
          borderRadius: borderRadius.round,
          paddingVertical: 4,
          paddingHorizontal: 8,
          flexDirection: "row",
          alignItems: "center",
          gap: 3,
          borderWidth: 1,
          borderColor: style.border,
          ...shadows.extruded.small,
        },
        animatedStyle,
      ]}
    >
      {icon && <Text style={{ fontSize: 10 }}>{icon}</Text>}
      <Text
        style={{
          color: style.text,
          fontSize: 11,
          fontWeight: "bold",
        }}
      >
        {text}
      </Text>
    </Animated.View>
  );
}
