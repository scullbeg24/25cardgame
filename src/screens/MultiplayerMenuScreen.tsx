import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import { useRoomStore } from '../store/roomStore';
import { colors, shadows, borderRadius } from '../theme';
import Button from '../components/Button';
import NavigationHeader from '../components/NavigationHeader';

type RootStackParamList = {
  Home: undefined;
  MultiplayerMenu: undefined;
  RoomLobby: undefined;
  Friends: undefined;
};

type MultiplayerMenuNavProp = NativeStackNavigationProp<RootStackParamList, 'MultiplayerMenu'>;

export default function MultiplayerMenuScreen() {
  const navigation = useNavigation<MultiplayerMenuNavProp>();
  const { user, userProfile } = useAuthStore();
  const { createRoom, joinRoom, isLoading } = useRoomStore();

  const [roomCode, setRoomCode] = useState('');
  const [showJoinInput, setShowJoinInput] = useState(false);

  const handleCreateRoom = async () => {
    if (!user || !userProfile) return;

    try {
      await createRoom(
        user.uid,
        userProfile.username,
        userProfile.displayName,
        4 // Max 4 players
      );
      navigation.navigate('RoomLobby');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create room');
    }
  };

  const handleJoinRoom = async () => {
    if (!user || !userProfile) return;

    if (!roomCode.trim()) {
      Alert.alert('Error', 'Please enter a room code');
      return;
    }

    try {
      await joinRoom(
        roomCode.trim().toUpperCase(),
        user.uid,
        userProfile.username,
        userProfile.displayName
      );
      navigation.navigate('RoomLobby');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to join room');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.primary }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background.secondary }}>
        <NavigationHeader title="Play Online" />
      </SafeAreaView>
      <LinearGradient
        colors={[colors.background.primary, colors.background.secondary, colors.background.primary]}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ padding: 24 }}>
          {/* Decorative Icon */}
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <View
              style={{
                backgroundColor: colors.background.surface,
                borderRadius: borderRadius.xxl,
                padding: 24,
                ...shadows.extruded.large,
                borderWidth: 2,
                borderColor: colors.gold.dark,
              }}
            >
              <Text style={{ fontSize: 64 }}>🌐</Text>
            </View>
          </View>

          {/* Create Room Button */}
          <View
            style={{
              backgroundColor: colors.background.surface,
              borderRadius: borderRadius.xl,
              padding: 24,
              marginBottom: 16,
              ...shadows.extruded.medium,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: 'bold',
                color: colors.text.primary,
                marginBottom: 8,
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
            <Button
              title="Create Room"
              onPress={handleCreateRoom}
              disabled={isLoading}
            />
          </View>

          {/* Join Room Section */}
          <View
            style={{
              backgroundColor: colors.background.surface,
              borderRadius: borderRadius.xl,
              padding: 24,
              marginBottom: 16,
              ...shadows.extruded.medium,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: 'bold',
                color: colors.text.primary,
                marginBottom: 8,
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
                    fontWeight: 'bold',
                    letterSpacing: 4,
                    textAlign: 'center',
                    borderWidth: 2,
                    borderColor: colors.gold.dark,
                    marginBottom: 12,
                  }}
                  placeholder="ABC123"
                  placeholderTextColor={colors.text.muted}
                  value={roomCode}
                  onChangeText={(text) => setRoomCode(text.toUpperCase())}
                  autoCapitalize="characters"
                  maxLength={6}
                  editable={!isLoading}
                />
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Button
                      title="Cancel"
                      variant="outline"
                      onPress={() => {
                        setShowJoinInput(false);
                        setRoomCode('');
                      }}
                      disabled={isLoading}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Button
                      title="Join"
                      onPress={handleJoinRoom}
                      disabled={isLoading || roomCode.length !== 6}
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

          {/* Play with Friends */}
          <View
            style={{
              backgroundColor: colors.background.surface,
              borderRadius: borderRadius.xl,
              padding: 24,
              ...shadows.extruded.medium,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: 'bold',
                color: colors.text.primary,
                marginBottom: 8,
              }}
            >
              Play with Friends
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: colors.text.secondary,
                marginBottom: 16,
              }}
            >
              View your friends list and challenge them directly
            </Text>
            <Button
              title="View Friends"
              variant="outline"
              onPress={() => navigation.navigate('Friends')}
            />
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}
