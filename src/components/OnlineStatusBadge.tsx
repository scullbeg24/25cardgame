import { View } from 'react-native';
import { colors } from '../theme';

interface OnlineStatusBadgeProps {
  isOnline: boolean;
  size?: number;
}

export default function OnlineStatusBadge({ isOnline, size = 12 }: OnlineStatusBadgeProps) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: isOnline ? colors.state.success : colors.text.muted,
        borderWidth: 2,
        borderColor: colors.background.surface,
      }}
    />
  );
}
