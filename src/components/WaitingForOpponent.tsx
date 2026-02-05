import { View, Text, ActivityIndicator } from 'react-native';
import { colors, shadows, borderRadius } from '../theme';

interface WaitingForOpponentProps {
  playerName: string;
  visible: boolean;
}

export default function WaitingForOpponent({ playerName, visible }: WaitingForOpponentProps) {
  if (!visible) {
    return null;
  }

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: colors.background.primary + 'DD',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 50,
      }}
    >
      <View
        style={{
          backgroundColor: colors.background.surface,
          borderRadius: borderRadius.xl,
          padding: 32,
          alignItems: 'center',
          ...shadows.extruded.large,
          minWidth: 200,
        }}
      >
        <ActivityIndicator size="large" color={colors.gold.primary} />
        <Text
          style={{
            marginTop: 16,
            fontSize: 18,
            fontWeight: '600',
            color: colors.text.primary,
            textAlign: 'center',
          }}
        >
          Waiting for {playerName}...
        </Text>
        <Text
          style={{
            marginTop: 8,
            fontSize: 14,
            color: colors.text.secondary,
            textAlign: 'center',
          }}
        >
          They're making their move
        </Text>
      </View>
    </View>
  );
}
