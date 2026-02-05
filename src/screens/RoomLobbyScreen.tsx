import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import { useRoomStore } from '../store/roomStore';
import { colors, shadows, borderRadius } from '../theme';
import Button from '../components/Button';
import RoomCodeDisplay from '../components/RoomCodeDisplay';
import PlayerSlot from '../components/PlayerSlot';

type RootStackParamList = {
  Home: undefined;
  MultiplayerMenu: undefined;
  RoomLobby: undefined;
  Game: undefined;
};

type RoomLobbyNavProp = NativeStackNavigationProp<RootStackParamList, 'RoomLobby'>;

export default function RoomLobbyScreen() {
  const navigation = useNavigation<RoomLobbyNavProp>();
  const { user } = useAuthStore();
  const {
    currentRoom,
    isHost,
    leaveRoom,
    setReady,
    startGame,
    subscribeToRoom,
    isLoading,
  } = useRoomStore();

  const [myPlayer, setMyPlayer] = useState<any>(null);

  useEffect(() => {
    if (!currentRoom) {
      // No room, go back
      navigation.navigate('MultiplayerMenu');
      return;
    }

    // Subscribe to room updates
    const unsubscribe = subscribeToRoom(currentRoom.id);

    return () => {
      unsubscribe();
    };
  }, [currentRoom?.id]);

  useEffect(() => {
    if (currentRoom && user) {
      const player = currentRoom.players.find(p => p.userId === user.uid);
      setMyPlayer(player);
    }
  }, [currentRoom, user]);

  useEffect(() => {
    // Navigate to game when status changes to playing
    if (currentRoom?.status === 'playing') {
      navigation.navigate('Game');
    }
  }, [currentRoom?.status]);

  useFocusEffect(() => {
    // When leaving the screen, if not in a game, clean up
    return () => {
      if (currentRoom && currentRoom.status !== 'playing' && user) {
        leaveRoom(currentRoom.id, user.uid).catch(console.error);
      }
    };
  });

  const handleLeave = () => {
    Alert.alert(
      'Leave Room',
      'Are you sure you want to leave the room?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            if (currentRoom && user) {
              try {
                await leaveRoom(currentRoom.id, user.uid);
                navigation.navigate('MultiplayerMenu');
              } catch (error) {
                Alert.alert('Error', 'Failed to leave room');
              }
            }
          },
        },
      ]
    );
  };

  const handleReady = async () => {
    if (!currentRoom || !user) return;

    try {
      const newReadyState = !myPlayer?.isReady;
      await setReady(currentRoom.id, user.uid, newReadyState);
    } catch (error) {
      Alert.alert('Error', 'Failed to update ready status');
    }
  };

  const handleStartGame = async () => {
    if (!currentRoom) return;

    // Check if we have enough players
    if (currentRoom.players.length < 2) {
      Alert.alert('Not Enough Players', 'You need at least 2 players to start the game');
      return;
    }

    // Check if all players are ready
    const allReady = currentRoom.players.every(p => p.isReady);
    if (!allReady) {
      Alert.alert('Not Ready', 'All players must be ready before starting');
      return;
    }

    try {
      await startGame(currentRoom.id);
      // Navigation will happen automatically via status change
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to start game');
    }
  };

  if (!currentRoom) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background.primary, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: colors.text.primary }}>Loading room...</Text>
      </View>
    );
  }

  const allReady = currentRoom.players.every(p => p.isReady);
  const canStart = isHost && allReady && currentRoom.players.length >= 2;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.primary }}>
      <LinearGradient
        colors={[colors.background.primary, colors.background.secondary, colors.background.primary]}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ padding: 24 }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
            <TouchableOpacity
              onPress={handleLeave}
              style={{
                backgroundColor: colors.background.surface,
                borderRadius: borderRadius.full,
                width: 40,
                height: 40,
                justifyContent: 'center',
                alignItems: 'center',
                ...shadows.pressed.medium,
              }}
            >
              <Text style={{ color: colors.text.primary, fontSize: 20 }}>←</Text>
            </TouchableOpacity>
            <Text
              style={{
                flex: 1,
                textAlign: 'center',
                fontSize: 24,
                fontWeight: 'bold',
                color: colors.text.primary,
                marginRight: 40,
              }}
            >
              Game Lobby
            </Text>
          </View>

          {/* Room Code Display */}
          <RoomCodeDisplay roomCode={currentRoom.roomCode} />

          {/* Status Info */}
          <View
            style={{
              backgroundColor: colors.background.surface,
              borderRadius: borderRadius.lg,
              padding: 16,
              marginTop: 20,
              marginBottom: 20,
              ...shadows.extruded.small,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                color: colors.text.secondary,
                textAlign: 'center',
              }}
            >
              {currentRoom.players.length} / {currentRoom.maxPlayers} players
              {allReady ? ' • All Ready!' : ''}
            </Text>
          </View>

          {/* Players */}
          <Text
            style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: colors.text.primary,
              marginBottom: 12,
            }}
          >
            Players
          </Text>

          {currentRoom.players.map((player) => (
            <PlayerSlot
              key={player.userId}
              player={player}
              slotNumber={player.slot}
              isHost={player.userId === currentRoom.hostUserId}
            />
          ))}

          {/* Empty slots */}
          {Array.from({ length: currentRoom.maxPlayers - currentRoom.players.length }).map((_, index) => (
            <PlayerSlot
              key={`empty-${index}`}
              slotNumber={currentRoom.players.length + index}
            />
          ))}

          {/* Action Buttons */}
          <View style={{ marginTop: 24, gap: 12 }}>
            {/* Ready Button for non-hosts or Start Game for host */}
            {isHost ? (
              <Button
                title={canStart ? 'Start Game' : 'Waiting for Players...'}
                onPress={handleStartGame}
                disabled={!canStart || isLoading}
              />
            ) : (
              <Button
                title={myPlayer?.isReady ? '✓ Ready' : 'Ready Up'}
                onPress={handleReady}
                variant={myPlayer?.isReady ? 'secondary' : 'primary'}
                disabled={isLoading}
              />
            )}

            <Button
              title="Leave Room"
              variant="outline"
              onPress={handleLeave}
            />
          </View>

          {/* Info Messages */}
          {isHost && !allReady && (
            <View
              style={{
                backgroundColor: colors.gold.primary + '20',
                borderRadius: borderRadius.md,
                padding: 12,
                marginTop: 16,
                borderWidth: 1,
                borderColor: colors.gold.primary,
              }}
            >
              <Text style={{ color: colors.gold.primary, textAlign: 'center', fontSize: 14 }}>
                Waiting for all players to ready up
              </Text>
            </View>
          )}

          {!isHost && (
            <View
              style={{
                backgroundColor: colors.state.info + '20',
                borderRadius: borderRadius.md,
                padding: 12,
                marginTop: 16,
                borderWidth: 1,
                borderColor: colors.state.info,
              }}
            >
              <Text style={{ color: colors.state.info, textAlign: 'center', fontSize: 14 }}>
                {myPlayer?.isReady
                  ? 'Waiting for host to start the game...'
                  : 'Click Ready when you\'re set to play!'}
              </Text>
            </View>
          )}
        </ScrollView>
      </LinearGradient>
    </View>
  );
}
