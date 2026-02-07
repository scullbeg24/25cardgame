import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';
import { colors, shadows, borderRadius } from '../theme';
import Button from '../components/Button';
import NavigationHeader from '../components/NavigationHeader';

export default function ProfileScreen() {
  const { userProfile, signOut, updateProfile, isLoading } = useAuthStore();

  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');

  const handleSave = async () => {
    if (!displayName.trim()) {
      Alert.alert('Error', 'Display name cannot be empty');
      return;
    }

    try {
      await updateProfile({ displayName: displayName.trim() });
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out');
            }
          },
        },
      ]
    );
  };

  if (!userProfile) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background.primary, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: colors.text.primary }}>Loading profile...</Text>
      </View>
    );
  }

  const winRate = userProfile.stats.winRate.toFixed(1);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.primary }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background.secondary }}>
        <NavigationHeader title="Profile" />
      </SafeAreaView>
      <LinearGradient
        colors={[colors.background.primary, colors.background.secondary, colors.background.primary]}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ padding: 24 }}>

          {/* Profile Info Card */}
          <View
            style={{
              backgroundColor: colors.background.surface,
              borderRadius: borderRadius.xl,
              padding: 24,
              marginBottom: 24,
              ...shadows.extruded.large,
            }}
          >
            {/* Avatar Circle */}
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <View
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 50,
                  backgroundColor: colors.gold.dark,
                  justifyContent: 'center',
                  alignItems: 'center',
                  ...shadows.extruded.medium,
                }}
              >
                <Text style={{ fontSize: 48, fontWeight: 'bold', color: colors.gold.primary }}>
                  {(userProfile.displayName || userProfile.username || '?').charAt(0).toUpperCase()}
                </Text>
              </View>
            </View>

            {/* Username */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: colors.text.secondary, fontSize: 12, marginBottom: 4 }}>
                Username
              </Text>
              <Text
                style={{
                  color: colors.text.primary,
                  fontSize: 18,
                  fontWeight: '600',
                }}
              >
                @{userProfile.username}
              </Text>
            </View>

            {/* Display Name */}
            <View style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <Text style={{ color: colors.text.secondary, fontSize: 12 }}>
                  Display Name
                </Text>
                {!isEditing && (
                  <TouchableOpacity onPress={() => setIsEditing(true)}>
                    <Text style={{ color: colors.gold.primary, fontSize: 14, fontWeight: '600' }}>
                      Edit
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              {isEditing ? (
                <View>
                  <TextInput
                    style={{
                      backgroundColor: colors.background.primary,
                      borderRadius: borderRadius.md,
                      padding: 12,
                      color: colors.text.primary,
                      fontSize: 16,
                      borderWidth: 1,
                      borderColor: colors.gold.dark,
                      marginBottom: 8,
                    }}
                    value={displayName}
                    onChangeText={setDisplayName}
                    autoFocus
                  />
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <View style={{ flex: 1 }}>
                      <Button
                        title="Cancel"
                        variant="outline"
                        onPress={() => {
                          setDisplayName(userProfile.displayName || userProfile.username || '');
                          setIsEditing(false);
                        }}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Button
                        title="Save"
                        onPress={handleSave}
                        disabled={isLoading}
                      />
                    </View>
                  </View>
                </View>
              ) : (
                <Text
                  style={{
                    color: colors.text.primary,
                    fontSize: 18,
                    fontWeight: '600',
                  }}
                >
                  {userProfile.displayName || userProfile.username || 'Player'}
                </Text>
              )}
            </View>

            {/* Email */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: colors.text.secondary, fontSize: 12, marginBottom: 4 }}>
                Email
              </Text>
              <Text
                style={{
                  color: colors.text.primary,
                  fontSize: 16,
                }}
              >
                {userProfile.email}
              </Text>
            </View>

            {/* Member Since */}
            <View>
              <Text style={{ color: colors.text.secondary, fontSize: 12, marginBottom: 4 }}>
                Member Since
              </Text>
              <Text
                style={{
                  color: colors.text.primary,
                  fontSize: 16,
                }}
              >
                {userProfile.createdAt.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>
          </View>

          {/* Stats Card */}
          <View
            style={{
              backgroundColor: colors.background.surface,
              borderRadius: borderRadius.xl,
              padding: 24,
              marginBottom: 24,
              ...shadows.extruded.large,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: 'bold',
                color: colors.text.primary,
                marginBottom: 16,
              }}
            >
              Statistics
            </Text>

            <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 32, fontWeight: 'bold', color: colors.gold.primary }}>
                  {userProfile.stats.gamesPlayed}
                </Text>
                <Text style={{ color: colors.text.secondary, fontSize: 14, marginTop: 4 }}>
                  Games Played
                </Text>
              </View>

              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 32, fontWeight: 'bold', color: colors.state.success }}>
                  {userProfile.stats.gamesWon}
                </Text>
                <Text style={{ color: colors.text.secondary, fontSize: 14, marginTop: 4 }}>
                  Games Won
                </Text>
              </View>

              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 32, fontWeight: 'bold', color: colors.gold.light }}>
                  {winRate}%
                </Text>
                <Text style={{ color: colors.text.secondary, fontSize: 14, marginTop: 4 }}>
                  Win Rate
                </Text>
              </View>
            </View>
          </View>

          {/* Sign Out Button */}
          <Button
            title="Sign Out"
            variant="outline"
            onPress={handleSignOut}
          />
        </ScrollView>
      </LinearGradient>
    </View>
  );
}
