import { View, Text, TouchableOpacity } from 'react-native';
import { colors, shadows, borderRadius } from '../theme';
import type { FriendProfile } from '../store/friendStore';

interface FriendListItemProps {
  friend: FriendProfile;
  onPress?: () => void;
  showChallenge?: boolean;
  onChallenge?: () => void;
  onRemove?: () => void;
}

export default function FriendListItem({
  friend,
  onPress,
  showChallenge = false,
  onChallenge,
  onRemove,
}: FriendListItemProps) {
  const isOnline = friend.isOnline ?? false;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: colors.background.surface,
        borderRadius: borderRadius.lg,
        padding: 16,
        marginBottom: 12,
        ...shadows.extruded.small,
        flexDirection: 'row',
        alignItems: 'center',
      }}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {/* Avatar */}
      <View style={{ marginRight: 12, position: 'relative' }}>
        <View
          style={{
            width: 50,
            height: 50,
            borderRadius: 25,
            backgroundColor: colors.gold.dark,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.gold.primary }}>
            {(friend.displayName || '?').charAt(0).toUpperCase()}
          </Text>
        </View>
        {/* Online Status Badge */}
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: 14,
            height: 14,
            borderRadius: 7,
            backgroundColor: isOnline ? colors.state.success : colors.text.muted,
            borderWidth: 2,
            borderColor: colors.background.surface,
          }}
        />
      </View>

      {/* Friend Info */}
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: '600',
            color: colors.text.primary,
            marginBottom: 2,
          }}
        >
          {friend.displayName}
        </Text>
        <Text style={{ fontSize: 14, color: colors.text.secondary }}>
          @{friend.username}
        </Text>
        <View style={{ flexDirection: 'row', marginTop: 4, gap: 12 }}>
          <Text style={{ fontSize: 12, color: colors.text.muted }}>
            {friend.stats.gamesPlayed} games
          </Text>
          <Text style={{ fontSize: 12, color: colors.text.muted }}>
            {friend.stats.winRate.toFixed(0)}% wins
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {showChallenge && onChallenge && (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onChallenge();
            }}
            style={{
              backgroundColor: colors.gold.primary,
              borderRadius: borderRadius.md,
              paddingVertical: 8,
              paddingHorizontal: 12,
            }}
          >
            <Text style={{ color: colors.background.primary, fontWeight: '600', fontSize: 14 }}>
              Challenge
            </Text>
          </TouchableOpacity>
        )}
        
        {onRemove && (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            style={{
              backgroundColor: colors.state.error + '20',
              borderRadius: borderRadius.md,
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderWidth: 1,
              borderColor: colors.state.error,
            }}
          >
            <Text style={{ color: colors.state.error, fontWeight: '600', fontSize: 14 }}>
              Remove
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}
