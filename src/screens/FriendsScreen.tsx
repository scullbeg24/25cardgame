import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import { useFriendStore } from '../store/friendStore';
import { colors, shadows, borderRadius } from '../theme';
import FriendListItem from '../components/FriendListItem';
import UserSearchBar from '../components/UserSearchBar';

type RootStackParamList = {
  Home: undefined;
  Friends: undefined;
};

type FriendsNavProp = NativeStackNavigationProp<RootStackParamList, 'Friends'>;

type TabType = 'friends' | 'pending' | 'add';

export default function FriendsScreen() {
  const navigation = useNavigation<FriendsNavProp>();
  const { user } = useAuthStore();
  const {
    friends,
    pendingRequests,
    sentRequests,
    loadFriends,
    loadPendingRequests,
    sendRequest,
    acceptRequest,
    declineRequest,
    removeFriend,
    searchUsers,
    subscribeFriends,
  } = useFriendStore();

  const [activeTab, setActiveTab] = useState<TabType>('friends');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      loadFriends(user.uid);
      loadPendingRequests(user.uid);
      
      // Subscribe to real-time updates
      const unsubscribe = subscribeFriends(user.uid);
      return () => unsubscribe();
    }
  }, [user]);

  const handleRefresh = async () => {
    if (!user) return;
    
    setRefreshing(true);
    await Promise.all([
      loadFriends(user.uid),
      loadPendingRequests(user.uid),
    ]);
    setRefreshing(false);
  };

  const handleSendRequest = async (toUserId: string) => {
    if (!user) return;

    try {
      await sendRequest(user.uid, toUserId);
      Alert.alert('Success', 'Friend request sent!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send friend request');
    }
  };

  const handleAcceptRequest = async (friendshipId: string) => {
    try {
      await acceptRequest(friendshipId);
      Alert.alert('Success', 'Friend request accepted!');
      if (user) {
        loadFriends(user.uid);
        loadPendingRequests(user.uid);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to accept request');
    }
  };

  const handleDeclineRequest = async (friendshipId: string) => {
    try {
      await declineRequest(friendshipId);
      if (user) {
        loadPendingRequests(user.uid);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to decline request');
    }
  };

  const handleRemoveFriend = (friendshipId: string, friendName: string) => {
    Alert.alert(
      'Remove Friend',
      `Are you sure you want to remove ${friendName} from your friends?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeFriend(friendshipId);
              if (user) {
                loadFriends(user.uid);
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to remove friend');
            }
          },
        },
      ]
    );
  };

  const handleSearchUsers = async (query: string) => {
    if (!user) return [];
    return searchUsers(query, user.uid);
  };

  const renderTabButton = (tab: TabType, label: string, badge?: number) => (
    <TouchableOpacity
      onPress={() => setActiveTab(tab)}
      style={{
        flex: 1,
        paddingVertical: 12,
        backgroundColor: activeTab === tab ? colors.gold.primary : 'transparent',
        borderRadius: borderRadius.md,
        position: 'relative',
      }}
    >
      <Text
        style={{
          textAlign: 'center',
          fontWeight: '600',
          color: activeTab === tab ? colors.background.primary : colors.text.secondary,
        }}
      >
        {label}
      </Text>
      {badge !== undefined && badge > 0 && (
        <View
          style={{
            position: 'absolute',
            top: 4,
            right: 8,
            backgroundColor: colors.state.error,
            borderRadius: 10,
            minWidth: 20,
            height: 20,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 6,
          }}
        >
          <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>
            {badge}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.primary }}>
      <LinearGradient
        colors={[colors.background.primary, colors.background.secondary, colors.background.primary]}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1, padding: 24 }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
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
              Friends
            </Text>
          </View>

          {/* Tab Bar */}
          <View
            style={{
              backgroundColor: colors.background.surface,
              borderRadius: borderRadius.lg,
              padding: 4,
              flexDirection: 'row',
              marginBottom: 20,
              ...shadows.extruded.small,
            }}
          >
            {renderTabButton('friends', 'Friends', friends.length)}
            {renderTabButton('pending', 'Requests', pendingRequests.length)}
            {renderTabButton('add', 'Add Friends')}
          </View>

          {/* Tab Content */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={colors.gold.primary}
              />
            }
          >
            {/* Friends Tab */}
            {activeTab === 'friends' && (
              <View>
                {friends.length === 0 ? (
                  <View
                    style={{
                      backgroundColor: colors.background.surface,
                      borderRadius: borderRadius.lg,
                      padding: 32,
                      alignItems: 'center',
                      ...shadows.extruded.small,
                    }}
                  >
                    <Text style={{ fontSize: 40, marginBottom: 16 }}>👥</Text>
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: '600',
                        color: colors.text.primary,
                        marginBottom: 8,
                      }}
                    >
                      No Friends Yet
                    </Text>
                    <Text style={{ color: colors.text.secondary, textAlign: 'center' }}>
                      Add friends to challenge them to a game!
                    </Text>
                  </View>
                ) : (
                  friends.map((friend) => (
                    <FriendListItem
                      key={friend.uid}
                      friend={friend}
                      showChallenge
                      onChallenge={() => {
                        // TODO: Implement challenge functionality
                        Alert.alert('Coming Soon', 'Challenge feature will be available soon!');
                      }}
                      onRemove={() => handleRemoveFriend(friend.friendshipId, friend.displayName)}
                    />
                  ))
                )}
              </View>
            )}

            {/* Pending Requests Tab */}
            {activeTab === 'pending' && (
              <View>
                {pendingRequests.length === 0 && sentRequests.length === 0 ? (
                  <View
                    style={{
                      backgroundColor: colors.background.surface,
                      borderRadius: borderRadius.lg,
                      padding: 32,
                      alignItems: 'center',
                      ...shadows.extruded.small,
                    }}
                  >
                    <Text style={{ fontSize: 40, marginBottom: 16 }}>✉️</Text>
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: '600',
                        color: colors.text.primary,
                        marginBottom: 8,
                      }}
                    >
                      No Pending Requests
                    </Text>
                    <Text style={{ color: colors.text.secondary, textAlign: 'center' }}>
                      You don't have any friend requests at the moment
                    </Text>
                  </View>
                ) : (
                  <>
                    {/* Incoming Requests */}
                    {pendingRequests.length > 0 && (
                      <>
                        <Text
                          style={{
                            fontSize: 16,
                            fontWeight: '600',
                            color: colors.text.primary,
                            marginBottom: 12,
                          }}
                        >
                          Incoming Requests
                        </Text>
                        {pendingRequests.map(({ friendship, profile }) => (
                          <View
                            key={friendship.id}
                            style={{
                              backgroundColor: colors.background.surface,
                              borderRadius: borderRadius.lg,
                              padding: 16,
                              marginBottom: 12,
                              ...shadows.extruded.small,
                            }}
                          >
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                              <View
                                style={{
                                  width: 50,
                                  height: 50,
                                  borderRadius: 25,
                                  backgroundColor: colors.gold.dark,
                                  justifyContent: 'center',
                                  alignItems: 'center',
                                  marginRight: 12,
                                }}
                              >
                                <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.gold.primary }}>
                                  {profile.displayName.charAt(0).toUpperCase()}
                                </Text>
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text.primary }}>
                                  {profile.displayName}
                                </Text>
                                <Text style={{ fontSize: 14, color: colors.text.secondary }}>
                                  @{profile.username}
                                </Text>
                              </View>
                            </View>
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                              <TouchableOpacity
                                onPress={() => handleAcceptRequest(friendship.id)}
                                style={{
                                  flex: 1,
                                  backgroundColor: colors.state.success,
                                  borderRadius: borderRadius.md,
                                  paddingVertical: 12,
                                  alignItems: 'center',
                                }}
                              >
                                <Text style={{ color: 'white', fontWeight: '600' }}>Accept</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={() => handleDeclineRequest(friendship.id)}
                                style={{
                                  flex: 1,
                                  backgroundColor: colors.state.error + '20',
                                  borderRadius: borderRadius.md,
                                  paddingVertical: 12,
                                  alignItems: 'center',
                                  borderWidth: 1,
                                  borderColor: colors.state.error,
                                }}
                              >
                                <Text style={{ color: colors.state.error, fontWeight: '600' }}>Decline</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        ))}
                      </>
                    )}

                    {/* Sent Requests */}
                    {sentRequests.length > 0 && (
                      <>
                        <Text
                          style={{
                            fontSize: 16,
                            fontWeight: '600',
                            color: colors.text.primary,
                            marginBottom: 12,
                            marginTop: pendingRequests.length > 0 ? 20 : 0,
                          }}
                        >
                          Sent Requests
                        </Text>
                        {sentRequests.map(({ friendship, profile }) => (
                          <View
                            key={friendship.id}
                            style={{
                              backgroundColor: colors.background.surface,
                              borderRadius: borderRadius.lg,
                              padding: 16,
                              marginBottom: 12,
                              ...shadows.extruded.small,
                              flexDirection: 'row',
                              alignItems: 'center',
                            }}
                          >
                            <View
                              style={{
                                width: 50,
                                height: 50,
                                borderRadius: 25,
                                backgroundColor: colors.gold.dark,
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginRight: 12,
                              }}
                            >
                              <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.gold.primary }}>
                                {profile.displayName.charAt(0).toUpperCase()}
                              </Text>
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text.primary }}>
                                {profile.displayName}
                              </Text>
                              <Text style={{ fontSize: 14, color: colors.text.secondary }}>
                                @{profile.username}
                              </Text>
                            </View>
                            <Text style={{ color: colors.text.muted, fontSize: 12 }}>Pending...</Text>
                          </View>
                        ))}
                      </>
                    )}
                  </>
                )}
              </View>
            )}

            {/* Add Friends Tab */}
            {activeTab === 'add' && (
              <View>
                <UserSearchBar
                  onSearch={handleSearchUsers}
                  onUserSelect={(user) => handleSendRequest(user.uid)}
                />
                <View
                  style={{
                    backgroundColor: colors.background.surface,
                    borderRadius: borderRadius.lg,
                    padding: 24,
                    alignItems: 'center',
                    ...shadows.extruded.small,
                  }}
                >
                  <Text style={{ fontSize: 40, marginBottom: 16 }}>🔍</Text>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: '600',
                      color: colors.text.primary,
                      marginBottom: 8,
                    }}
                  >
                    Search for Friends
                  </Text>
                  <Text style={{ color: colors.text.secondary, textAlign: 'center' }}>
                    Type a username above to find and add friends
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </LinearGradient>
    </View>
  );
}
