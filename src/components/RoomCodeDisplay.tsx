import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { colors, shadows, borderRadius } from '../theme';
import { formatRoomCode } from '../utils/roomCode';

interface RoomCodeDisplayProps {
  roomCode: string;
}

export default function RoomCodeDisplay({ roomCode }: RoomCodeDisplayProps) {
  const handleCopyCode = () => {
    // In a real app, you'd use Clipboard API
    // For now, just show an alert
    Alert.alert('Room Code', `Share this code with friends:\n\n${roomCode}`);
  };

  return (
    <TouchableOpacity
      onPress={handleCopyCode}
      activeOpacity={0.8}
      style={{
        backgroundColor: colors.background.surface,
        borderRadius: borderRadius.xl,
        padding: 24,
        alignItems: 'center',
        ...shadows.extruded.large,
        borderWidth: 2,
        borderColor: colors.gold.dark,
      }}
    >
      <Text
        style={{
          fontSize: 14,
          color: colors.text.secondary,
          marginBottom: 8,
          fontWeight: '600',
          letterSpacing: 1,
        }}
      >
        ROOM CODE
      </Text>
      
      <Text
        style={{
          fontSize: 48,
          fontWeight: 'bold',
          color: colors.gold.primary,
          letterSpacing: 8,
          textShadowColor: colors.gold.dark,
          textShadowOffset: { width: 2, height: 2 },
          textShadowRadius: 4,
        }}
      >
        {formatRoomCode(roomCode)}
      </Text>
      
      <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ fontSize: 20, marginRight: 8 }}>📋</Text>
        <Text
          style={{
            fontSize: 14,
            color: colors.gold.primary,
            fontWeight: '600',
          }}
        >
          Tap to share
        </Text>
      </View>
    </TouchableOpacity>
  );
}
