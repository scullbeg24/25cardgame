import { View, Text } from 'react-native';
import { colors, shadows, borderRadius } from '../theme';
import type { RoomPlayer } from '../store/roomStore';

interface PlayerSlotProps {
  player?: RoomPlayer;
  slotNumber: number;
  isHost?: boolean;
}

export default function PlayerSlot({ player, slotNumber, isHost }: PlayerSlotProps) {
  if (!player) {
    // Empty slot
    return (
      <View
        style={{
          backgroundColor: colors.background.surface,
          borderRadius: borderRadius.lg,
          padding: 16,
          marginBottom: 12,
          borderWidth: 2,
          borderColor: colors.background.primary,
          borderStyle: 'dashed',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 80,
        }}
      >
        <Text style={{ fontSize: 32, opacity: 0.3 }}>👤</Text>
        <Text style={{ color: colors.text.muted, fontSize: 14, marginTop: 8 }}>
          Waiting for player...
        </Text>
      </View>
    );
  }

  const teamColor = player.teamId === 1 ? colors.gold.primary : colors.state.info;

  return (
    <View
      style={{
        backgroundColor: colors.background.surface,
        borderRadius: borderRadius.lg,
        padding: 16,
        marginBottom: 12,
        ...shadows.extruded.small,
        borderWidth: 2,
        borderColor: player.isReady ? colors.state.success : colors.gold.dark,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {/* Avatar */}
        <View
          style={{
            width: 50,
            height: 50,
            borderRadius: 25,
            backgroundColor: teamColor + '40',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 12,
            borderWidth: 2,
            borderColor: teamColor,
          }}
        >
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: teamColor }}>
            {(player.displayName || '?').charAt(0).toUpperCase()}
          </Text>
        </View>

        {/* Player Info */}
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: colors.text.primary,
                marginRight: 8,
              }}
            >
              {player.displayName}
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
                <Text style={{ fontSize: 10, fontWeight: 'bold', color: colors.background.primary }}>
                  HOST
                </Text>
              </View>
            )}
          </View>
          
          <Text style={{ fontSize: 14, color: colors.text.secondary, marginBottom: 4 }}>
            @{player.username}
          </Text>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View
              style={{
                backgroundColor: teamColor + '20',
                borderRadius: 10,
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderWidth: 1,
                borderColor: teamColor,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '600', color: teamColor }}>
                Team {player.teamId}
              </Text>
            </View>
            
            <View
              style={{
                backgroundColor: player.isReady ? colors.state.success + '20' : colors.text.muted + '20',
                borderRadius: 10,
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderWidth: 1,
                borderColor: player.isReady ? colors.state.success : colors.text.muted,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: player.isReady ? colors.state.success : colors.text.muted,
                }}
              >
                {player.isReady ? '✓ Ready' : 'Not Ready'}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
