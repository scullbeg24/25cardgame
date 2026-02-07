import { useState, useEffect, useRef } from "react";
import { View, Text, StatusBar, Animated, Easing, Dimensions, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Button from "../components/Button";
import { useGameStore } from "../store/gameStore";
import { useAuthStore } from "../store/authStore";
import { colors, shadows, borderRadius } from "../theme";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export type RootStackParamList = {
  Home: undefined;
  Profile: undefined;
  Friends: undefined;
  MultiplayerMenu: undefined;
  GameSetup: undefined;
  Game: undefined;
  Rules: undefined;
  Settings: undefined;
  GameOver: undefined;
};

type HomeNavProp = NativeStackNavigationProp<RootStackParamList, "Home">;

// Decorative floating card component
function FloatingCard({ 
  suit, 
  rank, 
  initialX, 
  initialY, 
  delay, 
  duration 
}: { 
  suit: string; 
  rank: string; 
  initialX: number; 
  initialY: number; 
  delay: number;
  duration: number;
}) {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      delay,
      useNativeDriver: true,
    }).start();

    // Floating animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Subtle rotation
    Animated.loop(
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: duration * 1.5,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: duration * 1.5,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const translateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20],
  });

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["-8deg", "8deg"],
  });

  const suitColor = suit === "♥" || suit === "♦" ? colors.suits.hearts : colors.suits.spades;

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: initialX,
        top: initialY,
        opacity: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.15] }),
        transform: [{ translateY }, { rotate }],
      }}
    >
      <View
        style={{
          width: 50,
          height: 70,
          backgroundColor: colors.card.face,
          borderRadius: 6,
          justifyContent: "center",
          alignItems: "center",
          ...shadows.card,
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: "bold", color: suitColor }}>
          {rank}
        </Text>
        <Text style={{ fontSize: 20, color: suitColor }}>{suit}</Text>
      </View>
    </Animated.View>
  );
}

// Shamrock decoration component
function Shamrock({ x, y, size, delay }: { x: number; y: number; size: number; delay: number }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0.12,
        duration: 1000,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: x,
        top: y,
        opacity: fadeAnim,
        transform: [{ scale: scaleAnim }],
      }}
    >
      <Text style={{ fontSize: size, color: colors.state.success }}>☘</Text>
    </Animated.View>
  );
}

// Sparkle/shimmer effect
function Sparkle({ x, y, delay }: { x: number; y: number; delay: number }) {
  const sparkleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      Animated.sequence([
        Animated.timing(sparkleAnim, {
          toValue: 1,
          duration: 600,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(sparkleAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.delay(Math.random() * 2000 + 1000),
      ]).start(() => animate());
    };
    animate();
  }, []);

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: x,
        top: y,
        opacity: sparkleAnim,
        transform: [{ scale: sparkleAnim }],
      }}
    >
      <Text style={{ fontSize: 12, color: colors.gold.light }}>✦</Text>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const navigation = useNavigation<HomeNavProp>();
  const { userProfile } = useAuthStore();
  const [hasSavedGame, setHasSavedGame] = useState(false);
  const loadGame = useGameStore((s) => s.loadGame);
  const hasSavedGameFn = useGameStore((s) => s.hasSavedGame);

  // Animated values for title
  const titleGlow = useRef(new Animated.Value(0)).current;
  const titleScale = useRef(new Animated.Value(0.9)).current;
  const subtitleFade = useRef(new Animated.Value(0)).current;
  const buttonsSlide = useRef(new Animated.Value(50)).current;
  const buttonsFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Title entrance animation
    Animated.parallel([
      Animated.spring(titleScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(subtitleFade, {
        toValue: 1,
        duration: 800,
        delay: 300,
        useNativeDriver: true,
      }),
      Animated.timing(buttonsSlide, {
        toValue: 0,
        duration: 600,
        delay: 500,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      Animated.timing(buttonsFade, {
        toValue: 1,
        duration: 600,
        delay: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulsing glow effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(titleGlow, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(titleGlow, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  useFocusEffect(() => {
    hasSavedGameFn().then(setHasSavedGame).catch(() => setHasSavedGame(false));
  });

  const handleContinue = async () => {
    const loaded = await loadGame();
    if (loaded) navigation.navigate("Game");
  };

  // Decorative cards data
  const floatingCards = [
    { suit: "♠", rank: "5", x: 20, y: 80, delay: 0, duration: 3000 },
    { suit: "♥", rank: "A", x: SCREEN_WIDTH - 70, y: 120, delay: 500, duration: 3500 },
    { suit: "♣", rank: "J", x: 40, y: SCREEN_HEIGHT - 200, delay: 300, duration: 2800 },
    { suit: "♦", rank: "K", x: SCREEN_WIDTH - 80, y: SCREEN_HEIGHT - 250, delay: 700, duration: 3200 },
    { suit: "♠", rank: "Q", x: SCREEN_WIDTH / 2 - 100, y: 60, delay: 400, duration: 3400 },
    { suit: "♥", rank: "5", x: SCREEN_WIDTH / 2 + 60, y: SCREEN_HEIGHT - 180, delay: 600, duration: 2900 },
  ];

  // Shamrocks data
  const shamrocks = [
    { x: 30, y: 150, size: 40, delay: 200 },
    { x: SCREEN_WIDTH - 60, y: 200, size: 32, delay: 400 },
    { x: 50, y: SCREEN_HEIGHT - 300, size: 36, delay: 600 },
    { x: SCREEN_WIDTH - 70, y: SCREEN_HEIGHT - 350, size: 44, delay: 300 },
  ];

  // Sparkles data
  const sparkles = [
    { x: 60, y: 200, delay: 0 },
    { x: SCREEN_WIDTH - 80, y: 180, delay: 500 },
    { x: SCREEN_WIDTH / 2 - 80, y: 100, delay: 1000 },
    { x: SCREEN_WIDTH / 2 + 60, y: 120, delay: 1500 },
    { x: 100, y: SCREEN_HEIGHT - 280, delay: 800 },
    { x: SCREEN_WIDTH - 100, y: SCREEN_HEIGHT - 300, delay: 1200 },
  ];

  const glowOpacity = titleGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.primary }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background.primary} />
      
      <LinearGradient
        colors={[colors.background.primary, colors.background.secondary, colors.background.primary]}
        style={{ flex: 1 }}
      >
        {/* Background decorations */}
        {floatingCards.map((card, i) => (
          <FloatingCard
            key={i}
            suit={card.suit}
            rank={card.rank}
            initialX={card.x}
            initialY={card.y}
            delay={card.delay}
            duration={card.duration}
          />
        ))}
        
        {shamrocks.map((s, i) => (
          <Shamrock key={i} x={s.x} y={s.y} size={s.size} delay={s.delay} />
        ))}
        
        {sparkles.map((s, i) => (
          <Sparkle key={i} x={s.x} y={s.y} delay={s.delay} />
        ))}

        <View className="flex-1 justify-center items-center px-6">
          {/* User Profile Header */}
          {userProfile && (
            <View
              style={{
                position: 'absolute',
                top: 20,
                left: 20,
                right: 20,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <TouchableOpacity
                onPress={() => navigation.navigate('Profile')}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: colors.background.surface,
                  borderRadius: borderRadius.round,
                  padding: 8,
                  paddingRight: 16,
                  ...shadows.extruded.medium,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: colors.gold.dark,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 10,
                  }}
                >
                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.gold.primary }}>
                    {(userProfile.displayName || userProfile.username || '?').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text.primary }}>
                  {userProfile.displayName || userProfile.username || 'Player'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate('Friends')}
                style={{
                  backgroundColor: colors.background.surface,
                  borderRadius: borderRadius.round,
                  width: 44,
                  height: 44,
                  justifyContent: 'center',
                  alignItems: 'center',
                  ...shadows.extruded.medium,
                }}
              >
                <Text style={{ fontSize: 24 }}>👥</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Logo/Title area with soft UI card */}
          <Animated.View
            style={{
              backgroundColor: colors.background.surface,
              borderRadius: borderRadius.xxl,
              padding: 32,
              paddingHorizontal: 48,
              alignItems: "center",
              ...shadows.extruded.large,
              borderWidth: 2,
              borderColor: colors.gold.dark,
              marginBottom: 48,
              transform: [{ scale: titleScale }],
            }}
          >
            {/* Glow effect behind title */}
            <Animated.View
              style={{
                position: "absolute",
                width: 120,
                height: 120,
                borderRadius: 60,
                backgroundColor: colors.gold.primary,
                opacity: glowOpacity,
                top: 10,
              }}
            />
            
            <Text
              style={{
                fontSize: 80,
                fontWeight: "bold",
                color: colors.gold.primary,
                textShadowColor: colors.gold.dark,
                textShadowOffset: { width: 3, height: 3 },
                textShadowRadius: 6,
                includeFontPadding: false,
              }}
            >
              25
            </Text>
            
            <Animated.View style={{ opacity: subtitleFade }}>
              <Text
                style={{
                  marginTop: 4,
                  fontSize: 14,
                  color: colors.gold.muted,
                  letterSpacing: 4,
                  textTransform: "uppercase",
                  fontWeight: "600",
                }}
              >
                The Classic
              </Text>
              <Text
                style={{
                  marginTop: 4,
                  fontSize: 20,
                  color: colors.text.primary,
                  letterSpacing: 3,
                  textTransform: "uppercase",
                  fontWeight: "bold",
                  textAlign: "center",
                }}
              >
                Irish Card Game
              </Text>
            </Animated.View>

            {/* Decorative line */}
            <View
              style={{
                marginTop: 16,
                width: 60,
                height: 2,
                backgroundColor: colors.gold.dark,
                borderRadius: 1,
              }}
            />
            
            {/* Shamrock accent */}
            <Text style={{ marginTop: 8, fontSize: 20, color: colors.state.success }}>
              ☘
            </Text>
          </Animated.View>

          {/* Menu buttons */}
          <Animated.View 
            className="gap-4 w-full max-w-xs"
            style={{
              opacity: buttonsFade,
              transform: [{ translateY: buttonsSlide }],
            }}
          >
            <Button
              title="🌐 Play Online"
              onPress={() => navigation.navigate("MultiplayerMenu")}
            />
            <Button
              title="Play vs Bots"
              variant="secondary"
              onPress={() => navigation.navigate("GameSetup")}
            />
            {hasSavedGame && (
              <Button
                title="Continue Game"
                variant="secondary"
                onPress={handleContinue}
              />
            )}
            <Button
              title="How to Play"
              variant="outline"
              onPress={() => navigation.navigate("Rules")}
            />
            <Button
              title="Settings"
              variant="outline"
              onPress={() => navigation.navigate("Settings")}
            />
          </Animated.View>

          {/* Footer tagline */}
          <Animated.View style={{ marginTop: 32, opacity: subtitleFade }}>
            <Text
              style={{
                fontSize: 12,
                color: colors.text.muted,
                letterSpacing: 1,
                textAlign: "center",
              }}
            >
              Challenge your friends • Master the trump
            </Text>
          </Animated.View>
        </View>
      </LinearGradient>
    </View>
  );
}
