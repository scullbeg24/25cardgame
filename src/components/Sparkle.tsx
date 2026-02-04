/**
 * Sparkle/shine animation effect for special plays
 */

import { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  withRepeat,
  runOnJS,
} from "react-native-reanimated";
import { colors } from "../theme";

interface SparkleParticle {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  color: string;
}

interface SparkleProps {
  visible: boolean;
  onComplete?: () => void;
  color?: string;
  size?: number;
  duration?: number;
}

function SparkleParticleComponent({
  particle,
  duration,
}: {
  particle: SparkleParticle;
  duration: number;
}) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(
      particle.delay,
      withSequence(
        withTiming(1.2, { duration: duration * 0.3, easing: Easing.out(Easing.back()) }),
        withTiming(0, { duration: duration * 0.7, easing: Easing.in(Easing.ease) })
      )
    );

    opacity.value = withDelay(
      particle.delay,
      withSequence(
        withTiming(1, { duration: duration * 0.2 }),
        withDelay(duration * 0.3, withTiming(0, { duration: duration * 0.5 }))
      )
    );

    rotation.value = withDelay(
      particle.delay,
      withTiming(45, { duration: duration })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotation.value}deg` }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: particle.x - particle.size / 2,
          top: particle.y - particle.size / 2,
          width: particle.size,
          height: particle.size,
        },
        animatedStyle,
      ]}
    >
      {/* 4-point star shape */}
      <View
        style={{
          position: "absolute",
          width: particle.size,
          height: particle.size * 0.3,
          backgroundColor: particle.color,
          borderRadius: particle.size * 0.15,
          top: particle.size * 0.35,
        }}
      />
      <View
        style={{
          position: "absolute",
          width: particle.size * 0.3,
          height: particle.size,
          backgroundColor: particle.color,
          borderRadius: particle.size * 0.15,
          left: particle.size * 0.35,
        }}
      />
    </Animated.View>
  );
}

export default function Sparkle({
  visible,
  onComplete,
  color = colors.gold.light,
  size = 100,
  duration = 1000,
}: SparkleProps) {
  const [particles, setParticles] = useState<SparkleParticle[]>([]);

  useEffect(() => {
    if (visible) {
      // Create sparkle particles around the center
      const newParticles: SparkleParticle[] = [];
      const particleCount = 8;

      for (let i = 0; i < particleCount; i++) {
        const angle = (i / particleCount) * 360;
        const distance = size * 0.3 + Math.random() * size * 0.2;
        const rad = (angle * Math.PI) / 180;

        newParticles.push({
          id: i,
          x: size / 2 + Math.cos(rad) * distance,
          y: size / 2 + Math.sin(rad) * distance,
          size: 12 + Math.random() * 8,
          delay: i * 50,
          color: i % 2 === 0 ? color : colors.gold.primary,
        });
      }

      // Add center sparkle
      newParticles.push({
        id: particleCount,
        x: size / 2,
        y: size / 2,
        size: 20,
        delay: 0,
        color: color,
      });

      setParticles(newParticles);

      if (onComplete) {
        setTimeout(onComplete, duration + 200);
      }
    } else {
      setParticles([]);
    }
  }, [visible, color, size, duration, onComplete]);

  if (!visible || particles.length === 0) return null;

  return (
    <View
      style={{
        width: size,
        height: size,
        position: "relative",
      }}
      pointerEvents="none"
    >
      {particles.map((particle) => (
        <SparkleParticleComponent
          key={particle.id}
          particle={particle}
          duration={duration}
        />
      ))}
    </View>
  );
}

/**
 * Continuous shimmer effect for highlighting elements
 */
export function ShimmerEffect({
  visible,
  width = 100,
  height = 100,
  color = colors.gold.light,
}: {
  visible: boolean;
  width?: number;
  height?: number;
  color?: string;
}) {
  const translateX = useSharedValue(-width);

  useEffect(() => {
    if (visible) {
      translateX.value = withRepeat(
        withTiming(width * 2, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        -1,
        false
      );
    } else {
      translateX.value = -width;
    }
  }, [visible, width]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  if (!visible) return null;

  return (
    <View
      style={{
        width,
        height,
        overflow: "hidden",
        position: "absolute",
      }}
      pointerEvents="none"
    >
      <Animated.View
        style={[
          {
            width: width * 0.5,
            height: height * 2,
            backgroundColor: color,
            opacity: 0.3,
            transform: [{ rotate: "20deg" }],
            position: "absolute",
            top: -height * 0.5,
          },
          animatedStyle,
        ]}
      />
    </View>
  );
}

/**
 * Glow pulse effect
 */
export function GlowPulse({
  visible,
  color = colors.gold.primary,
  size = 100,
  children,
}: {
  visible: boolean;
  color?: string;
  size?: number;
  children?: React.ReactNode;
}) {
  const glowOpacity = useSharedValue(0);
  const glowScale = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 600 }),
          withTiming(0.2, { duration: 600 })
        ),
        -1,
        true
      );
      glowScale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 600 }),
          withTiming(1, { duration: 600 })
        ),
        -1,
        true
      );
    } else {
      glowOpacity.value = withTiming(0, { duration: 200 });
      glowScale.value = 1;
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));

  return (
    <View style={{ position: "relative" }}>
      <Animated.View
        style={[
          {
            position: "absolute",
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
            top: -size * 0.25,
            left: -size * 0.25,
          },
          animatedStyle,
        ]}
        pointerEvents="none"
      />
      {children}
    </View>
  );
}
