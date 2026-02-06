import { useEffect, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Alert,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "./HomeScreen";
import { useAuthStore } from "../store/authStore";
import { useRoomStore } from "../store/roomStore";
import type { RoomPlayer } from "../store/roomStore";
import { colors, shadows, borderRadius } from "../theme";
import Button from "../components/Button";
import NavigationHeader from "../components/NavigationHeader";

type RoomLobbyNavProp = NativeStackNavigationProp<
  RootStackParamList,
  "RoomLobby"
>;
type RoomLobbyRouteProp = RouteProp<RootStackParamList, "RoomLobby">;

// ─── Room Code Display ──────────────────────────────────────────

function RoomCodeCard({ code }: { code: string }) {
  const handleCopy = () => {
    Alert.alert("Room Code", code, [{ text: "OK" }]);
  };

  return (
    <TouchableOpacity
      onPress={handleCopy}
      activeOpacity={0.8}
      style={{
        backgroundColor: colors.background.surface,
        borderRadius: borderRadius.xl,
        padding: 20,
        alignItems: "center",
        ...shadows.extruded.medium,
        borderWidth: 2,
        borderColor: colors.gold.dark,
      }}
    >
      <Text
        style={{
          fontSize: 12,
          fontWeight: "600",
          color: colors.text.secondary,
          textTransform: "uppercase",
          letterSpacing: 2,
          marginBottom: 8,
        }}
      >
        Room Code
      </Text>
      <View style={{ flexDirection: "row", gap: 6 }}>
        {code.split("").map((char, i) => (
          <View
            key={i}
            style={{
              width: 42,
              height: 50,
              borderRadius: borderRadius.md,
              backgroundColor: colors.background.primary,
              borderWidth: 1,
              borderColor: colors.gold.dark,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: 24,
                fontWeight: "bold",
                color: colors.gold.primary,
              }}
            >
              {char}
            </Text>
          </View>
        ))}
      </View>
      <Text
        style={{
          fontSize: 12,
          color: colors.text.muted,
          marginTop: 8,
        }}
      >
        Tap to copy
      </Text>
    </TouchableOpacity>
  );
}

// ─── Player Slot ────────────────────────────────────────────────

function PlayerSlotRow({
  slotIndex,
  player,
  uid,
  isRoomHost,
}: {
  slotIndex: number;
  player: (RoomPlayer & { uid: string }) | null;
  uid: string | null;
  isRoomHost: boolean;
}) {
  if (!player) {
    // Empty slot
    return (
      <View
        style={{
          backgroundColor: colors.background.primary,
          borderRadius: borderRadius.lg,
          padding: 14,
          marginBottom: 8,
          flexDirection: "row",
          alignItems: "center",
          borderWidth: 1,
          borderColor: colors.softUI.border,
          borderStyle: "dashed",
        }}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: colors.background.surface,
            justifyContent: "center",
            alignItems: "center",
            marginRight: 12,
          }}
        >
          <Text style={{ fontSize: 16, color: colors.text.muted }}>
            {slotIndex + 1}
          </Text>
        </View>
        <Text
          style={{
            fontSize: 15,
            color: colors.text.muted,
            fontStyle: "italic",
          }}
        >
          Waiting for player...
        </Text>
      </View>
    );
  }

  const isMe = player.uid === uid;
  const isHost = isRoomHost && player.uid === uid;

  return (
    <View
      style={{
        backgroundColor: isMe
          ? colors.gold.primary + "15"
          : colors.background.surface,
        borderRadius: borderRadius.lg,
        padding: 14,
        marginBottom: 8,
        flexDirection: "row",
        alignItems: "center",
        borderWidth: isMe ? 1 : 0,
        borderColor: colors.gold.primary + "40",
      }}
    >
      {/* Avatar */}
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: player.ready
            ? colors.state.success
            : colors.background.elevated,
          justifyContent: "center",
          alignItems: "center",
          marginRight: 12,
        }}
      >
        <Text
          style={{
            fontSize: 16,
            fontWeight: "bold",
            color: player.ready
              ? "#fff"
              : colors.text.primary,
          }}
        >
          {player.name.charAt(0).toUpperCase()}
        </Text>
      </View>

      {/* Name + badges */}
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: colors.text.primary,
            }}
          >
            {player.name}
          </Text>
          {isMe && (
            <View
              style={{
                backgroundColor: colors.gold.primary + "30",
                borderRadius: borderRadius.sm,
                paddingHorizontal: 6,
                paddingVertical: 1,
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "700",
                  color: colors.gold.primary,
                }}
              >
                YOU
              </Text>
            </View>
          )}
          {isHost && (
            <Text style={{ fontSize: 14 }}>👑</Text>
          )}
        </View>
      </View>

      {/* Ready status */}
      <View
        style={{
          backgroundColor: player.ready
            ? colors.state.success + "20"
            : colors.background.primary,
          borderRadius: borderRadius.sm,
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderWidth: 1,
          borderColor: player.ready
            ? colors.state.success
            : colors.softUI.border,
        }}
      >
        <Text
          style={{
            fontSize: 12,
            fontWeight: "600",
            color: player.ready
              ? colors.state.success
              : colors.text.muted,
          }}
        >
          {player.ready ? "Ready" : "Not Ready"}
        </Text>
      </View>
    </View>
  );
}

// ─── Main Screen ────────────────────────────────────────────────

export default function RoomLobbyScreen() {
  const navigation = useNavigation<RoomLobbyNavProp>();
  const route = useRoute<RoomLobbyRouteProp>();
  const { roomId } = route.params;

  const { user } = useAuthStore();
  const uid = user?.uid ?? null;

  const {
    currentRoom,
    isHost,
    mySlot,
    loading,
    error,
    leaveRoom,
    setReady,
    startGame,
    subscribeToRoom,
  } = useRoomStore();

  // Subscribe to room updates
  useEffect(() => {
    const unsubscribe = subscribeToRoom(roomId);
    return () => {
      unsubscribe();
    };
  }, [roomId, subscribeToRoom]);

  // Navigate to game when status changes to "playing"
  useEffect(() => {
    if (currentRoom?.status === "playing") {
      navigation.navigate("Game", { mode: "online", roomId });
    }
  }, [currentRoom?.status, navigation, roomId]);

  // If room was deleted (e.g., host left), go back
  useEffect(() => {
    if (!loading && !currentRoom && roomId) {
      // Small delay to avoid race with initial subscribe
      const timer = setTimeout(() => {
        if (!useRoomStore.getState().currentRoom) {
          Alert.alert("Room Closed", "The room has been closed.", [
            { text: "OK", onPress: () => navigation.navigate("MultiplayerMenu") },
          ]);
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [currentRoom, loading, roomId, navigation]);

  // Build sorted player list by slot
  const playerList = useMemo(() => {
    if (!currentRoom?.players) return [];

    return Object.entries(currentRoom.players)
      .map(([playerId, player]) => ({
        ...player,
        uid: playerId,
      }))
      .sort((a, b) => a.slot - b.slot);
  }, [currentRoom?.players]);

  // Find my player
  const myPlayer = uid && currentRoom?.players?.[uid];
  const myReady = myPlayer ? myPlayer.ready : false;

  // Player counts
  const currentCount = playerList.length;
  const maxPlayers = currentRoom?.settings.numPlayers ?? 4;
  const emptySlots = maxPlayers - currentCount;

  // Can start?
  const allReady = playerList.length > 0 && playerList.every((p) => p.ready);
  const enoughPlayers = currentCount >= 2;
  const canStart = isHost && allReady && enoughPlayers;

  const handleLeave = () => {
    Alert.alert("Leave Room", "Are you sure you want to leave the room?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Leave",
        style: "destructive",
        onPress: async () => {
          try {
            await leaveRoom();
            navigation.navigate("MultiplayerMenu");
          } catch {
            Alert.alert("Error", "Failed to leave room");
          }
        },
      },
    ]);
  };

  const handleReady = async () => {
    try {
      await setReady(!myReady);
    } catch {
      Alert.alert("Error", "Failed to update ready status");
    }
  };

  const handleStartGame = async () => {
    if (!canStart) return;

    try {
      const ok = await startGame();
      if (!ok && useRoomStore.getState().error) {
        Alert.alert("Error", useRoomStore.getState().error!);
      }
      // Navigation happens automatically via status change
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to start game");
    }
  };

  // Loading state
  if (!currentRoom) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background.primary,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text style={{ color: colors.text.primary, fontSize: 16 }}>
          Loading room...
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.primary }}>
      <SafeAreaView
        edges={["top"]}
        style={{ backgroundColor: colors.background.secondary }}
      >
        <NavigationHeader title="Game Lobby" onBackPress={handleLeave} />
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
          {/* Room Code */}
          <RoomCodeCard code={currentRoom.code} />

          {/* Settings Summary */}
          <View
            style={{
              backgroundColor: colors.background.surface,
              borderRadius: borderRadius.lg,
              padding: 14,
              marginTop: 16,
              marginBottom: 20,
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              gap: 16,
              ...shadows.extruded.small,
            }}
          >
            <View style={{ alignItems: "center" }}>
              <Text
                style={{
                  fontSize: 11,
                  color: colors.text.muted,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                Players
              </Text>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "bold",
                  color: currentCount >= maxPlayers
                    ? colors.state.success
                    : colors.text.primary,
                }}
              >
                {currentCount} / {maxPlayers}
              </Text>
            </View>
            <View
              style={{
                width: 1,
                height: 30,
                backgroundColor: colors.softUI.border,
              }}
            />
            <View style={{ alignItems: "center" }}>
              <Text
                style={{
                  fontSize: 11,
                  color: colors.text.muted,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                Target
              </Text>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "bold",
                  color: colors.gold.primary,
                }}
              >
                {currentRoom.settings.targetScore}
              </Text>
            </View>
            <View
              style={{
                width: 1,
                height: 30,
                backgroundColor: colors.softUI.border,
              }}
            />
            <View style={{ alignItems: "center" }}>
              <Text
                style={{
                  fontSize: 11,
                  color: colors.text.muted,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                Status
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: allReady
                    ? colors.state.success
                    : colors.text.secondary,
                }}
              >
                {allReady ? "All Ready!" : "Waiting..."}
              </Text>
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

          {/* Players Header */}
          <Text
            style={{
              fontSize: 18,
              fontWeight: "bold",
              color: colors.text.primary,
              marginBottom: 12,
            }}
          >
            Players
          </Text>

          {/* Filled player slots */}
          {playerList.map((player) => (
            <PlayerSlotRow
              key={player.uid}
              slotIndex={player.slot}
              player={player}
              uid={uid}
              isRoomHost={currentRoom.hostId === player.uid}
            />
          ))}

          {/* Empty slots */}
          {Array.from({ length: emptySlots }).map((_, i) => {
            // Find next empty slot number
            const takenSlots = new Set(playerList.map((p) => p.slot));
            let slotNum = 0;
            let found = 0;
            while (found <= i) {
              if (!takenSlots.has(slotNum)) {
                if (found === i) break;
                found++;
              }
              slotNum++;
            }
            return (
              <PlayerSlotRow
                key={`empty-${i}`}
                slotIndex={slotNum}
                player={null}
                uid={uid}
                isRoomHost={false}
              />
            );
          })}

          {/* Action Buttons */}
          <View style={{ marginTop: 24, gap: 12 }}>
            {isHost ? (
              <Button
                title={
                  !enoughPlayers
                    ? "Need More Players..."
                    : !allReady
                      ? "Waiting for Players..."
                      : "Start Game"
                }
                onPress={handleStartGame}
                disabled={!canStart || loading}
              />
            ) : (
              <Button
                title={myReady ? "✓ Ready" : "Ready Up"}
                onPress={handleReady}
                variant={myReady ? "secondary" : "primary"}
                disabled={loading}
              />
            )}

            {/* Host also needs a ready button */}
            {isHost && (
              <Button
                title={myReady ? "✓ Ready" : "Ready Up"}
                onPress={handleReady}
                variant={myReady ? "secondary" : "primary"}
                size="medium"
                disabled={loading}
              />
            )}

            <Button
              title="Leave Room"
              variant="outline"
              onPress={handleLeave}
            />
          </View>

          {/* Info Messages */}
          {isHost && !allReady && enoughPlayers && (
            <View
              style={{
                backgroundColor: colors.gold.primary + "20",
                borderRadius: borderRadius.md,
                padding: 12,
                marginTop: 16,
                borderWidth: 1,
                borderColor: colors.gold.primary,
              }}
            >
              <Text
                style={{
                  color: colors.gold.primary,
                  textAlign: "center",
                  fontSize: 14,
                }}
              >
                Waiting for all players to ready up
              </Text>
            </View>
          )}

          {!isHost && (
            <View
              style={{
                backgroundColor: colors.state.info + "20",
                borderRadius: borderRadius.md,
                padding: 12,
                marginTop: 16,
                borderWidth: 1,
                borderColor: colors.state.info,
              }}
            >
              <Text
                style={{
                  color: colors.state.info,
                  textAlign: "center",
                  fontSize: 14,
                }}
              >
                {myReady
                  ? "Waiting for host to start the game..."
                  : "Tap Ready when you're set to play!"}
              </Text>
            </View>
          )}
        </ScrollView>
      </LinearGradient>
    </View>
  );
}
