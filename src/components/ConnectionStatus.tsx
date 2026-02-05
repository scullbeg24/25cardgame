import { View, Text } from 'react-native';
import { colors, borderRadius } from '../theme';

interface ConnectionStatusProps {
  isConnected: boolean;
  playerName?: string;
}

export default function ConnectionStatus({ isConnected, playerName }: ConnectionStatusProps) {
  if (isConnected) {
    return null; // Don't show anything when connected
  }

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: colors.state.warning + 'EE',
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
    >
      <View
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: colors.state.error,
          marginRight: 8,
        }}
      />
      <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>
        {playerName ? `${playerName} disconnected` : 'Connection lost'}
      </Text>
    </View>
  );
}
