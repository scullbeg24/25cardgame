import { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "./HomeScreen";
import { useAuthStore } from "../store/authStore";
import { useRoomStore } from "../store/roomStore";
import type { PublicRoomInfo } from "../store/roomStore";
import { colors, shadows, borderRadius } from "../theme";
import Button from "../components/Button";
import NavigationHeader from "../components/NavigationHeader";

type MultiplayerMenuNavProp = NativeStackNavigationProp<
  RootStackParamList,
  "MultiplayerMenu"
>;

// ─── Player Count Picker ────────────────────────────────────────

function PlayerCountPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  const counts = [2, 3, 4, 5, 6, 7, 8, 9, 10];
  return (
    <View style={{ marginBottom: 16 }}>
      <Text
        style={{
          fontSize: 14,
          fontWeight: "600",
          color: colors.text.secondary,
          marginBottom: 8,
        }}
      >
        Number of Players
      </Text>
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        {counts.map((n) => {
          const selected = n === value;
          return (
            <TouchableOpacity
              key={n}
              onPress={() => onChange(n)}
              style={{
                width: 42,
                height: 42,
                borderRadius: borderRadius.md,
                backgroundColor: selected
                  ? colors.gold.primary
                  : colors.background.primary,
                borderWidth: 1,
                borderColor: selected
                  ? colors.gold.dark
                  : colors.softUI.border,
                justifyContent: "center",
                alignItems: "center",
                ...(selected ? shadows.extruded.small : {}),
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "bold",
                  color: selected
                    ? colors.text.inverse
                    : colors.text.primary,
                }}
              >
                {n}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Target Score Toggle ────────────────────────────────────────

function TargetScorePicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text
        style={{
          fontSize: 14,
          fontWeight: "600",
          color: colors.text.secondary,
          marginBottom: 8,
        }}
      >
        Target Score
      </Text>
      <View style={{ flexDirection: "row", gap: 12 }}>
        {[25, 45].map((score) => {
          const selected = score === value;
          return (
            <TouchableOpacity
              key={score}
              onPress={() => onChange(score)}
              style={{
                flex: 1,
                height: 48,
                borderRadius: borderRadius.md,
                backgroundColor: selected
                  ? colors.gold.primary
                  : colors.background.primary,
                borderWidth: 1,
                borderColor: selected
                  ? colors.gold.dark
                  : colors.softUI.border,
                justifyContent: "center",
                alignItems: "center",
                ...(selected ? shadows.extruded.small : {}),
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "bold",
                  color: selected
                    ? colors.text.inverse
                    : colors.text.primary,
                }}
              >
                {score}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Public / Private Toggle ────────────────────────────────────

function VisibilityToggle({
  isPublic,
  onChange,
}: {
  isPublic: boolean;
  onChange: (pub: boolean) => void;
}) {
  return (
    <View style={{ marginBottom: 8 }}>
      <Text
        style={{
          fontSize: 14,
          fontWeight: "600",
          color: colors.text.secondary,
          marginBottom: 8,
        }}
      >
        Room Visibility
      </Text>
      <View style={{ flexDirection: "row", gap: 12 }}>
        {[
          { label: "Private", icon: "🔒", val: false },
          { label: "Public", icon: "🌐", val: true },
        ].map((opt) => {
          const selected = isPublic === opt.val;
          return (
            <TouchableOpacity
              key={opt.label}
              onPress={() => onChange(opt.val)}
              style={{
                flex: 1,
                height: 48,
                borderRadius: borderRadius.md,
                backgroundColor: selected
                  ? colors.gold.primary
                  : colors.background.primary,
                borderWidth: 1,
                borderColor: selected
                  ? colors.gold.dark
                  : colors.softUI.border,
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                gap: 6,
                ...(selected ? shadows.extruded.small : {}),
              }}
            >
              <Text style={{ fontSize: 16 }}>{opt.icon}</Text>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "600",
                  color: selected
                    ? colors.text.inverse
                    : colors.text.primary,
                }}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Public Room Card ───────────────────────────────────────────

function PublicRoomCard({
  room,
  onJoin,
  loading,
}: {
  room: PublicRoomInfo;
  onJoin: () => void;
  loading: boolean;
}) {
  return (
    <View
      style={{
        backgroundColor: colors.background.surface,
        borderRadius: borderRadius.lg,
        padding: 14,
        marginBottom: 10,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderWidth: 1,
        borderColor: colors.softUI.border,
      }}
    >
      <View style={{ flex: 1, marginRight: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "bold",
              color: colors.text.primary,
            }}
          >
            {room.hostName}'s Room
          </Text>
          <View
            style={{
              backgroundColor: colors.gold.primary + "30",
              borderRadius: borderRadius.sm,
              paddingHorizontal: 6,
              paddingVertical: 2,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: "600",
                color: colors.gold.primary,
              }}
            >
              {room.code}
            </Text>
          </View>
        </View>
        <Text
          style={{
            fontSize: 13,
            color: colors.text.secondary,
            marginTop: 4,
          }}
        >
          {room.currentPlayers}/{room.numPlayers} players · Target: {room.targetScore}
        </Text>
      </View>
      <TouchableOpacity
        onPress={onJoin}
        disabled={loading}
        style={{
          backgroundColor: colors.gold.primary,
          borderRadius: borderRadius.md,
          paddingHorizontal: 16,
          paddingVertical: 10,
          ...shadows.extruded.small,
        }}
      >
        <Text
          style={{
            fontSize: 14,
            fontWeight: "bold",
            color: colors.text.inverse,
          }}
        >
          Join
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main Screen ────────────────────────────────────────────────

export default function MultiplayerMenuScreen() {
  const navigation = useNavigation<MultiplayerMenuNavProp>();
  const { userProfile } = useAuthStore();
  const {
    createRoom,
    joinRoom,
    fetchPublicRooms,
    publicRooms,
    loading,
    error,
  } = useRoomStore();

  // Create room settings
  const [numPlayers, setNumPlayers] = useState(4);
  const [targetScore, setTargetScore] = useState(25);
  const [isPublic, setIsPublic] = useState(false);
  const [showCreateSettings, setShowCreateSettings] = useState(false);

  // Join room
  const [roomCode, setRoomCode] = useState("");
  const [showJoinInput, setShowJoinInput] = useState(false);

  // Public rooms
  const [showPublicRooms, setShowPublicRooms] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const playerName =
    userProfile?.displayName || userProfile?.username || "Player";

  // Fetch public rooms when that section is opened
  const loadPublicRooms = useCallback(async () => {
    setRefreshing(true);
    await fetchPublicRooms();
    setRefreshing(false);
  }, [fetchPublicRooms]);

  useFocusEffect(
    useCallback(() => {
      if (showPublicRooms) {
        loadPublicRooms();
      }
    }, [showPublicRooms, loadPublicRooms])
  );

  const handleCreateRoom = async () => {
    try {
      const roomId = await createRoom(
        { numPlayers, targetScore, isPublic },
        playerName
      );
      if (roomId) {
        navigation.navigate("RoomLobby", { roomId });
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to create room");
    }
  };

  const handleJoinRoom = async () => {
    const code = roomCode.trim().toUpperCase();
    if (code.length !== 6) {
      Alert.alert("Error", "Please enter a 6-character room code");
      return;
    }

    try {
      const roomId = await joinRoom(code, playerName);
      if (roomId) {
        navigation.navigate("RoomLobby", { roomId });
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to join room");
    }
  };

  const handleJoinPublicRoom = async (code: string) => {
    try {
      const roomId = await joinRoom(code, playerName);
      if (roomId) {
        navigation.navigate("RoomLobby", { roomId });
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to join room");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.primary }}>
      <SafeAreaView
        edges={["top"]}
        style={{ backgroundColor: colors.background.secondary }}
      >
        <NavigationHeader title="Play Online" />
      </SafeAreaView>
      <LinearGradient
        colors={[
          colors.background.primary,
          colors.background.secondary,
          colors.background.primary,
        ]}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
          {/* Decorative Icon */}
          <View style={{ alignItems: "center", marginBottom: 28 }}>
            <View
              style={{
                backgroundColor: colors.background.surface,
                borderRadius: borderRadius.xxl,
                padding: 20,
                ...shadows.extruded.large,
                borderWidth: 2,
                borderColor: colors.gold.dark,
              }}
            >
              <Text style={{ fontSize: 52 }}>🌐</Text>
            </View>
          </View>

          {/* Error Banner */}
          {error && (
            <View
              style={{
                backgroundColor: colors.state.error + "20",
                borderRadius: borderRadius.md,
                padding: 12,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: colors.state.error,
              }}
            >
              <Text
                style={{
                  color: colors.state.error,
                  textAlign: "center",
                  fontSize: 14,
                }}
              >
                {error}
              </Text>
            </View>
          )}

          {/* ─── Create Room ────────────────────────── */}
          <View
            style={{
              backgroundColor: colors.background.surface,
              borderRadius: borderRadius.xl,
              padding: 20,
              marginBottom: 16,
              ...shadows.extruded.medium,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: "bold",
                color: colors.text.primary,
                marginBottom: 6,
              }}
            >
              Create a Room
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: colors.text.secondary,
                marginBottom: 16,
              }}
            >
              Start a new game and invite your friends with a room code
            </Text>

            {showCreateSettings ? (
              <>
                <PlayerCountPicker
                  value={numPlayers}
                  onChange={setNumPlayers}
                />
                <TargetScorePicker
                  value={targetScore}
                  onChange={setTargetScore}
                />
                <VisibilityToggle isPublic={isPublic} onChange={setIsPublic} />

                {/* Summary */}
                <View
                  style={{
                    backgroundColor: colors.background.primary,
                    borderRadius: borderRadius.md,
                    padding: 12,
                    marginTop: 12,
                    marginBottom: 16,
                    borderWidth: 1,
                    borderColor: colors.softUI.border,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      color: colors.text.secondary,
                      textAlign: "center",
                    }}
                  >
                    {numPlayers} players · First to {targetScore} ·{" "}
                    {isPublic ? "Public" : "Private"}
                  </Text>
                </View>

                <View style={{ flexDirection: "row", gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Button
                      title="Cancel"
                      variant="outline"
                      size="medium"
                      onPress={() => setShowCreateSettings(false)}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Button
                      title="Create"
                      size="medium"
                      onPress={handleCreateRoom}
                      disabled={loading}
                    />
                  </View>
                </View>
              </>
            ) : (
              <Button
                title="Create Room"
                onPress={() => setShowCreateSettings(true)}
              />
            )}
          </View>

          {/* ─── Join Room ──────────────────────────── */}
          <View
            style={{
              backgroundColor: colors.background.surface,
              borderRadius: borderRadius.xl,
              padding: 20,
              marginBottom: 16,
              ...shadows.extruded.medium,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: "bold",
                color: colors.text.primary,
                marginBottom: 6,
              }}
            >
              Join a Room
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: colors.text.secondary,
                marginBottom: 16,
              }}
            >
              Enter a room code to join a friend's game
            </Text>

            {showJoinInput ? (
              <>
                <TextInput
                  style={{
                    backgroundColor: colors.background.primary,
                    borderRadius: borderRadius.md,
                    padding: 16,
                    color: colors.text.primary,
                    fontSize: 24,
                    fontWeight: "bold",
                    letterSpacing: 4,
                    textAlign: "center",
                    borderWidth: 2,
                    borderColor: colors.gold.dark,
                    marginBottom: 12,
                  }}
                  placeholder="ABCDEF"
                  placeholderTextColor={colors.text.muted}
                  value={roomCode}
                  onChangeText={(text) =>
                    setRoomCode(text.toUpperCase().replace(/[^A-Z]/g, ""))
                  }
                  autoCapitalize="characters"
                  maxLength={6}
                  editable={!loading}
                  autoFocus
                />
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Button
                      title="Cancel"
                      variant="outline"
                      size="medium"
                      onPress={() => {
                        setShowJoinInput(false);
                        setRoomCode("");
                      }}
                      disabled={loading}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Button
                      title="Join"
                      size="medium"
                      onPress={handleJoinRoom}
                      disabled={loading || roomCode.length !== 6}
                    />
                  </View>
                </View>
              </>
            ) : (
              <Button
                title="Enter Room Code"
                variant="secondary"
                onPress={() => setShowJoinInput(true)}
              />
            )}
          </View>

          {/* ─── Browse Public Rooms ────────────────── */}
          <View
            style={{
              backgroundColor: colors.background.surface,
              borderRadius: borderRadius.xl,
              padding: 20,
              ...shadows.extruded.medium,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: "bold",
                color: colors.text.primary,
                marginBottom: 6,
              }}
            >
              Public Rooms
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: colors.text.secondary,
                marginBottom: 16,
              }}
            >
              Browse open rooms and jump into a game
            </Text>

            {showPublicRooms ? (
              <>
                {/* Refresh button */}
                <TouchableOpacity
                  onPress={loadPublicRooms}
                  disabled={refreshing}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 12,
                    gap: 6,
                  }}
                >
                  {refreshing ? (
                    <ActivityIndicator
                      size="small"
                      color={colors.gold.primary}
                    />
                  ) : (
                    <Text style={{ fontSize: 16 }}>🔄</Text>
                  )}
                  <Text
                    style={{
                      fontSize: 14,
                      color: colors.gold.primary,
                      fontWeight: "600",
                    }}
                  >
                    {refreshing ? "Loading..." : "Refresh"}
                  </Text>
                </TouchableOpacity>

                {publicRooms.length === 0 ? (
                  <View
                    style={{
                      backgroundColor: colors.background.primary,
                      borderRadius: borderRadius.md,
                      padding: 20,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ fontSize: 32, marginBottom: 8 }}>🏜️</Text>
                    <Text
                      style={{
                        fontSize: 14,
                        color: colors.text.muted,
                        textAlign: "center",
                      }}
                    >
                      No public rooms available right now.{"\n"}Why not create
                      one?
                    </Text>
                  </View>
                ) : (
                  publicRooms.map((room) => (
                    <PublicRoomCard
                      key={room.id}
                      room={room}
                      onJoin={() => handleJoinPublicRoom(room.code)}
                      loading={loading}
                    />
                  ))
                )}

                <View style={{ marginTop: 12 }}>
                  <Button
                    title="Close"
                    variant="outline"
                    size="medium"
                    onPress={() => setShowPublicRooms(false)}
                  />
                </View>
              </>
            ) : (
              <Button
                title="Browse Rooms"
                variant="secondary"
                onPress={() => {
                  setShowPublicRooms(true);
                  loadPublicRooms();
                }}
              />
            )}
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}
