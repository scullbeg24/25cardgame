import { View, Text } from "react-native";
import { colors, shadows, borderRadius } from "../theme";
import type { RoomPlayer } from "../store/roomStore";

interface PlayerSlotProps {
  player?: RoomPlayer;
  slotNumber: number;
  isHost?: boolean;
}

export default function PlayerSlot({
  player,
  slotNumber,
  isHost,
}: PlayerSlotProps) {
  if (!player) {
    return (
      <View
        style={{
          backgroundColor: colors.background.surface,
          borderRadius: borderRadius.lg,
          padding: 16,
          marginBottom: 12,
          borderWidth: 2,
          borderColor: colors.background.primary,
          borderStyle: "dashed",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 80,
        }}
      >
        <Text style={{ fontSize: 32, opacity: 0.3 }}>👤</Text>
        <Text
          style={{ color: colors.text.muted, fontSize: 14, marginTop: 8 }}
        >
          Waiting for player...
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{
        backgroundColor: colors.background.surface,
        borderRadius: borderRadius.lg,
        padding: 16,
        marginBottom: 12,
        ...shadows.extruded.small,
        borderWidth: 2,
        borderColor: player.ready ? colors.state.success : colors.gold.dark,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        {/* Avatar */}
        <View
          style={{
            width: 50,
            height: 50,
            borderRadius: 25,
            backgroundColor: colors.gold.primary + "40",
            justifyContent: "center",
            alignItems: "center",
            marginRight: 12,
            borderWidth: 2,
            borderColor: colors.gold.primary,
          }}
        >
          <Text
            style={{
              fontSize: 24,
              fontWeight: "bold",
              color: colors.gold.primary,
            }}
          >
            {player.name.charAt(0).toUpperCase()}
          </Text>
        </View>

        {/* Player Info */}
        <View style={{ flex: 1 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 4,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: colors.text.primary,
                marginRight: 8,
              }}
            >
              {player.name}
            </Text>
            {isHost && (
              <View
                style={{
                  backgroundColor: colors.gold.primary,
                  borderRadius: 12,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: "bold",
                    color: colors.background.primary,
                  }}
                >
                  HOST
                </Text>
              </View>
            )}
          </View>

          <View
            style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
          >
            <View
              style={{
                backgroundColor: colors.gold.primary + "20",
                borderRadius: 10,
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderWidth: 1,
                borderColor: colors.gold.primary,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color: colors.gold.primary,
                }}
              >
                Slot {player.slot + 1}
              </Text>
            </View>

            <View
              style={{
                backgroundColor: player.ready
                  ? colors.state.success + "20"
                  : colors.text.muted + "20",
                borderRadius: 10,
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderWidth: 1,
                borderColor: player.ready
                  ? colors.state.success
                  : colors.text.muted,
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
                {player.ready ? "✓ Ready" : "Not Ready"}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
