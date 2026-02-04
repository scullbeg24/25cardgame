import React from "react";
import { View, Text, Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import type { Card as CardType } from "../game-logic/cards";
import type { CardSize } from "../store/settingsStore";
import { colors, shadows, borderRadius } from "../theme";

const SUIT_SYMBOLS: Record<string, string> = {
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
  spades: "♠",
};

const CARD_SIZES = {
  small: { width: 70, height: 98, fontSize: 13, suitSize: 18 },
  medium: { width: 90, height: 126, fontSize: 16, suitSize: 24 },
  large: { width: 110, height: 154, fontSize: 20, suitSize: 30 },
};

interface CardProps {
  card: CardType;
  faceUp?: boolean;
  selectable?: boolean;
  selected?: boolean;
  validMove?: boolean;
  onPress?: () => void;
  size?: CardSize;
  shake?: boolean;
  onShakeComplete?: () => void;
}

export default function Card({
  card,
  faceUp = true,
  selectable = false,
  selected = false,
  validMove = false,
  onPress,
  size = "medium",
  shake = false,
  onShakeComplete,
}: CardProps) {
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const borderColorAnim = useSharedValue(0);
  const dims = CARD_SIZES[size];

  // Handle shake animation for invalid plays
  React.useEffect(() => {
    if (shake) {
      // Shake left-right
      translateX.value = withSequence(
        withTiming(-8, { duration: 50 }),
        withTiming(8, { duration: 50 }),
        withTiming(-6, { duration: 50 }),
        withTiming(6, { duration: 50 }),
        withTiming(-4, { duration: 50 }),
        withTiming(4, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
      // Flash red border
      borderColorAnim.value = withSequence(
        withTiming(1, { duration: 100 }),
        withTiming(0, { duration: 300 })
      );
      
      if (onShakeComplete) {
        setTimeout(onShakeComplete, 400);
      }
    }
  }, [shake, onShakeComplete]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
      { translateX: translateX.value },
    ],
  }));

  const borderAnimStyle = useAnimatedStyle(() => ({
    borderColor:
      borderColorAnim.value > 0
        ? `rgba(239, 68, 68, ${borderColorAnim.value})`
        : undefined,
  }));

  const handlePressIn = () => {
    if (selectable) {
      scale.value = withSpring(1.08, { damping: 15 });
      translateY.value = withSpring(-8, { damping: 15 });
    }
  };
  const handlePressOut = () => {
    scale.value = withSpring(1);
    translateY.value = withSpring(0);
  };

  const suitColor = colors.suits[card.suit as keyof typeof colors.suits] ?? colors.suits.spades;
  const symbol = SUIT_SYMBOLS[card.suit] ?? "?";

  // Border color logic
  const getBorderColor = () => {
    if (validMove) return colors.gold.primary;
    if (selected) return colors.gold.light;
    return colors.gold.dark + "40"; // 40 = 25% opacity
  };

  return (
    <Pressable
      onPress={selectable ? onPress : undefined}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={{ minWidth: 50, minHeight: 70 }}
      accessibilityRole={selectable ? "button" : "image"}
      accessibilityLabel={faceUp ? `${card.rank} of ${card.suit}` : "Card face down"}
      accessibilityHint={selectable && validMove ? "Double tap to play this card" : undefined}
    >
      <Animated.View
        style={[
          {
            width: dims.width,
            height: dims.height,
            borderRadius: borderRadius.md,
            backgroundColor: colors.card.face,
            borderWidth: validMove || selected || shake ? 2 : 1,
            borderColor: getBorderColor(),
            ...shadows.card,
            ...(validMove && shadows.goldGlow),
          },
          animatedStyle,
          borderAnimStyle,
        ]}
      >
        {faceUp ? (
          <View className="flex-1 p-1.5 justify-between">
            {/* Top left corner */}
            <View className="items-start">
              <Text style={{ fontSize: dims.fontSize, color: suitColor, fontWeight: "700", lineHeight: dims.fontSize * 1.1 }}>
                {card.rank}
              </Text>
              <Text style={{ fontSize: dims.suitSize * 0.8, color: suitColor, marginTop: -2 }}>{symbol}</Text>
            </View>
            
            {/* Center suit */}
            <View className="items-center justify-center flex-1">
              <Text style={{ fontSize: dims.suitSize * 1.4, color: suitColor }}>
                {symbol}
              </Text>
            </View>
            
            {/* Bottom right corner (rotated) */}
            <View
              className="items-end"
              style={{ transform: [{ rotate: "180deg" }] }}
            >
              <Text style={{ fontSize: dims.fontSize, color: suitColor, fontWeight: "700", lineHeight: dims.fontSize * 1.1 }}>
                {card.rank}
              </Text>
              <Text style={{ fontSize: dims.suitSize * 0.8, color: suitColor, marginTop: -2 }}>{symbol}</Text>
            </View>
          </View>
        ) : (
          // Card back - elegant design
          <View
            className="flex-1"
            style={{ 
              backgroundColor: colors.card.back,
              borderRadius: borderRadius.md - 1,
              margin: 2,
            }}
          >
            {/* Inner border pattern */}
            <View 
              className="flex-1 m-1.5 items-center justify-center"
              style={{
                borderWidth: 1,
                borderColor: colors.gold.dark + "40",
                borderRadius: borderRadius.sm,
              }}
            >
              {/* Diamond pattern in center */}
              <View style={{ transform: [{ rotate: "45deg" }] }}>
                <View 
                  style={{
                    width: dims.width * 0.3,
                    height: dims.width * 0.3,
                    borderWidth: 1,
                    borderColor: colors.gold.dark + "60",
                    backgroundColor: colors.gold.dark + "20",
                  }}
                />
              </View>
            </View>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}
