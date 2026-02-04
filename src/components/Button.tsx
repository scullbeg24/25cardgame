import {
  Pressable,
  Text,
  type PressableProps,
  View,
} from "react-native";
import { colors, shadows, borderRadius } from "../theme";
import { playButtonTap } from "../utils/sounds";

interface ButtonProps extends Omit<PressableProps, "style"> {
  title: string;
  variant?: "primary" | "secondary" | "outline";
  size?: "small" | "medium" | "large";
  style?: PressableProps["style"];
  /** Disable sound effect for this button */
  silent?: boolean;
}

const sizeConfig = {
  small: { height: 44, paddingHorizontal: 16, fontSize: 14 },
  medium: { height: 52, paddingHorizontal: 20, fontSize: 16 },
  large: { height: 56, paddingHorizontal: 24, fontSize: 18 },
};

export default function Button({
  title,
  variant = "primary",
  size = "large",
  style,
  silent = false,
  ...props
}: ButtonProps) {
  const dims = sizeConfig[size];

  const handlePressIn = () => {
    if (!silent) {
      playButtonTap();
    }
  };

  const getBackgroundColor = (pressed: boolean) => {
    switch (variant) {
      case "primary":
        return pressed ? colors.gold.dark : colors.gold.primary;
      case "secondary":
        return pressed ? colors.background.primary : colors.background.surface;
      case "outline":
        return pressed ? colors.background.surface : "transparent";
    }
  };

  const getBorderColor = () => {
    switch (variant) {
      case "primary":
        return colors.gold.dark;
      case "secondary":
        return colors.softUI.border;
      case "outline":
        return colors.gold.muted;
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case "primary":
        return colors.text.inverse;
      case "secondary":
        return colors.text.primary;
      case "outline":
        return colors.gold.primary;
    }
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPressIn={handlePressIn}
      {...props}
      style={({ pressed }) => [
        {
          minHeight: dims.height,
          paddingHorizontal: dims.paddingHorizontal,
          borderRadius: borderRadius.lg,
          backgroundColor: getBackgroundColor(pressed),
          borderWidth: variant === "outline" ? 2 : 1,
          borderColor: getBorderColor(),
          alignItems: "center",
          justifyContent: "center",
          ...(variant === "primary" ? shadows.extruded.small : {}),
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
        typeof style === "function" ? style({ pressed }) : style,
      ]}
    >
      <Text
        style={{
          fontSize: dims.fontSize,
          fontWeight: "600",
          color: getTextColor(),
          letterSpacing: 0.5,
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}
