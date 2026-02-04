/**
 * Confetti animation component for celebrations
 */

import { useEffect, useState } from "react";
import { View, Dimensions, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { colors } from "../theme";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface ConfettiPiece {
  id: number;
  x: number;
  delay: number;
  color: string;
  size: number;
  rotation: number;
  shape: "square" | "circle" | "rectangle";
}

const CONFETTI_COLORS = [
  colors.gold.primary,
  colors.gold.light,
  colors.teams.team1.primary,
  colors.teams.team1.light,
  colors.state.success,
  "#f472b6", // pink
  "#a78bfa", // purple
  "#60a5fa", // blue
  "#34d399", // emerald
  "#fbbf24", // amber
];

interface ConfettiProps {
  visible: boolean;
  onComplete?: () => void;
  intensity?: "light" | "medium" | "heavy";
  duration?: number; // Default reduced for less distraction
}

function ConfettiPieceComponent({
  piece,
  onComplete,
  duration,
}: {
  piece: ConfettiPiece;
  onComplete?: () => void;
  duration: number;
}) {
  const translateY = useSharedValue(-50);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    const xVariance = (Math.random() - 0.5) * 100;

    translateY.value = withDelay(
      piece.delay,
      withTiming(SCREEN_HEIGHT + 50, {
        duration: duration,
        easing: Easing.out(Easing.quad),
      })
    );

    translateX.value = withDelay(
      piece.delay,
      withTiming(xVariance, {
        duration: duration,
        easing: Easing.inOut(Easing.sin),
      })
    );

    rotate.value = withDelay(
      piece.delay,
      withTiming(piece.rotation + 720, {
        duration: duration,
        easing: Easing.linear,
      })
    );

    opacity.value = withDelay(
      piece.delay + duration * 0.7,
      withTiming(0, { duration: duration * 0.3 }, (finished) => {
        if (finished && onComplete && piece.id === 0) {
          runOnJS(onComplete)();
        }
      })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  const getShape = () => {
    switch (piece.shape) {
      case "circle":
        return { borderRadius: piece.size / 2 };
      case "rectangle":
        return { width: piece.size * 0.5, height: piece.size };
      default:
        return {};
    }
  };

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: piece.x,
          top: -20,
          width: piece.size,
          height: piece.size,
          backgroundColor: piece.color,
          ...getShape(),
        },
        animatedStyle,
      ]}
    />
  );
}

export default function Confetti({
  visible,
  onComplete,
  intensity = "medium",
  duration = 2000,
}: ConfettiProps) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  const pieceCount = {
    light: 15,
    medium: 25,
    heavy: 40,
  }[intensity];

  useEffect(() => {
    if (visible) {
      const newPieces: ConfettiPiece[] = Array.from(
        { length: pieceCount },
        (_, i) => ({
          id: i,
          x: Math.random() * SCREEN_WIDTH,
          delay: Math.random() * 500,
          color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
          size: 6 + Math.random() * 8,
          rotation: Math.random() * 360,
          shape: (["square", "circle", "rectangle"] as const)[
            Math.floor(Math.random() * 3)
          ],
        })
      );
      setPieces(newPieces);
    } else {
      setPieces([]);
    }
  }, [visible, pieceCount]);

  if (!visible || pieces.length === 0) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {pieces.map((piece) => (
        <ConfettiPieceComponent
          key={piece.id}
          piece={piece}
          onComplete={piece.id === 0 ? onComplete : undefined}
          duration={duration}
        />
      ))}
    </View>
  );
}

/**
 * Burst confetti that explodes from a point
 */
export function ConfettiBurst({
  visible,
  x,
  y,
  onComplete,
}: {
  visible: boolean;
  x: number;
  y: number;
  onComplete?: () => void;
}) {
  const [pieces, setPieces] = useState<
    Array<{
      id: number;
      angle: number;
      distance: number;
      color: string;
      size: number;
    }>
  >([]);

  useEffect(() => {
    if (visible) {
      const newPieces = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        angle: (i / 20) * 360 + Math.random() * 30,
        distance: 50 + Math.random() * 80,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        size: 4 + Math.random() * 6,
      }));
      setPieces(newPieces);

      if (onComplete) {
        setTimeout(onComplete, 1000);
      }
    } else {
      setPieces([]);
    }
  }, [visible, onComplete]);

  if (!visible || pieces.length === 0) return null;

  return (
    <View
      style={[StyleSheet.absoluteFill, { pointerEvents: "none" }]}
    >
      {pieces.map((piece) => (
        <BurstPiece key={piece.id} piece={piece} x={x} y={y} />
      ))}
    </View>
  );
}

function BurstPiece({
  piece,
  x,
  y,
}: {
  piece: { angle: number; distance: number; color: string; size: number };
  x: number;
  y: number;
}) {
  const progress = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    progress.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) });
    opacity.value = withDelay(400, withTiming(0, { duration: 200 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const rad = (piece.angle * Math.PI) / 180;
    const moveX = Math.cos(rad) * piece.distance * progress.value;
    const moveY = Math.sin(rad) * piece.distance * progress.value;

    return {
      transform: [{ translateX: moveX }, { translateY: moveY }],
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: x - piece.size / 2,
          top: y - piece.size / 2,
          width: piece.size,
          height: piece.size,
          borderRadius: piece.size / 2,
          backgroundColor: piece.color,
        },
        animatedStyle,
      ]}
    />
  );
}
