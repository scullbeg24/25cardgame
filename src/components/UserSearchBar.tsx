import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { colors, shadows, borderRadius } from '../theme';
import type { UserProfile } from '../store/authStore';

interface UserSearchBarProps {
  onSearch: (query: string) => Promise<UserProfile[]>;
  onUserSelect: (user: UserProfile) => void;
  placeholder?: string;
}

export default function UserSearchBar({
  onSearch,
  onUserSelect,
  placeholder = 'Search by username...',
}: UserSearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = async (text: string) => {
    setQuery(text);
    
    if (text.trim().length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    try {
      setIsSearching(true);
      const users = await onSearch(text);
      setResults(users);
      setShowResults(true);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelect = (user: UserProfile) => {
    onUserSelect(user);
    setQuery('');
    setResults([]);
    setShowResults(false);
  };

  return (
    <View style={{ marginBottom: 16 }}>
      {/* Search Input */}
      <View
        style={{
          backgroundColor: colors.background.surface,
          borderRadius: borderRadius.lg,
          padding: 12,
          flexDirection: 'row',
          alignItems: 'center',
          ...shadows.extruded.small,
          borderWidth: 1,
          borderColor: colors.gold.dark,
        }}
      >
        <Text style={{ fontSize: 18, marginRight: 8, color: colors.text.secondary }}>🔍</Text>
        <TextInput
          style={{
            flex: 1,
            color: colors.text.primary,
            fontSize: 16,
          }}
          placeholder={placeholder}
          placeholderTextColor={colors.text.muted}
          value={query}
          onChangeText={handleSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {isSearching && <ActivityIndicator size="small" color={colors.gold.primary} />}
      </View>

      {/* Search Results */}
      {showResults && results.length > 0 && (
        <View
          style={{
            backgroundColor: colors.background.surface,
            borderRadius: borderRadius.lg,
            marginTop: 8,
            ...shadows.extruded.medium,
            maxHeight: 300,
          }}
        >
          {results.map((user, index) => (
            <TouchableOpacity
              key={user.uid}
              onPress={() => handleSelect(user)}
              style={{
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
                borderBottomWidth: index < results.length - 1 ? 1 : 0,
                borderBottomColor: colors.background.primary,
              }}
            >
              {/* Avatar */}
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: colors.gold.dark,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 12,
                }}
              >
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.gold.primary }}>
                  {(user.displayName || user.username || '?').charAt(0).toUpperCase()}
                </Text>
              </View>

              {/* User Info */}
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text.primary }}>
                  {user.displayName}
                </Text>
                <Text style={{ fontSize: 14, color: colors.text.secondary }}>
                  @{user.username}
                </Text>
              </View>

              {/* Add Icon */}
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: colors.gold.primary,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 20, color: colors.background.primary }}>+</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {showResults && results.length === 0 && !isSearching && query.trim().length >= 2 && (
        <View
          style={{
            backgroundColor: colors.background.surface,
            borderRadius: borderRadius.lg,
            marginTop: 8,
            padding: 16,
            ...shadows.extruded.small,
          }}
        >
          <Text style={{ color: colors.text.secondary, textAlign: 'center' }}>
            No users found
          </Text>
        </View>
      )}
    </View>
  );
}
