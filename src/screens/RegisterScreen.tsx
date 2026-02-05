import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import { colors, shadows, borderRadius } from '../theme';
import Button from '../components/Button';

type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
};

type RegisterNavProp = NativeStackNavigationProp<RootStackParamList, 'Register'>;

export default function RegisterScreen() {
  const navigation = useNavigation<RegisterNavProp>();
  const { signUp, isLoading } = useAuthStore();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const validateForm = () => {
    if (!username.trim()) {
      setError('Please enter a username');
      return false;
    }

    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters');
      return false;
    }

    if (username.trim().length > 20) {
      setError('Username must be less than 20 characters');
      return false;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
      setError('Username can only contain letters, numbers, and underscores');
      return false;
    }

    if (!email.trim()) {
      setError('Please enter an email');
      return false;
    }

    if (!/\S+@\S+\.\S+/.test(email.trim())) {
      setError('Please enter a valid email');
      return false;
    }

    if (!password) {
      setError('Please enter a password');
      return false;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setError('');
      await signUp(email.trim(), password, username.trim());
      // Navigation will happen automatically via auth state listener
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.primary }}>
      <LinearGradient
        colors={[colors.background.primary, colors.background.secondary, colors.background.primary]}
        style={{ flex: 1 }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Logo/Title */}
            <View style={{ alignItems: 'center', marginBottom: 32 }}>
              <View
                style={{
                  backgroundColor: colors.background.surface,
                  borderRadius: borderRadius.xxl,
                  padding: 20,
                  paddingHorizontal: 32,
                  alignItems: 'center',
                  ...shadows.extruded.large,
                  borderWidth: 2,
                  borderColor: colors.gold.dark,
                }}
              >
                <Text
                  style={{
                    fontSize: 56,
                    fontWeight: 'bold',
                    color: colors.gold.primary,
                    textShadowColor: colors.gold.dark,
                    textShadowOffset: { width: 2, height: 2 },
                    textShadowRadius: 4,
                  }}
                >
                  25
                </Text>
                <Text
                  style={{
                    marginTop: 4,
                    fontSize: 14,
                    color: colors.text.primary,
                    fontWeight: '600',
                  }}
                >
                  Create Account
                </Text>
              </View>
            </View>

            {/* Register Form */}
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
                  fontSize: 24,
                  fontWeight: 'bold',
                  color: colors.text.primary,
                  marginBottom: 20,
                  textAlign: 'center',
                }}
              >
                Sign Up
              </Text>

              {error ? (
                <View
                  style={{
                    backgroundColor: colors.state.error + '20',
                    borderRadius: borderRadius.md,
                    padding: 12,
                    marginBottom: 16,
                    borderWidth: 1,
                    borderColor: colors.state.error,
                  }}
                >
                  <Text style={{ color: colors.state.error, textAlign: 'center' }}>
                    {error}
                  </Text>
                </View>
              ) : null}

              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{
                    color: colors.text.secondary,
                    marginBottom: 8,
                    fontSize: 14,
                    fontWeight: '600',
                  }}
                >
                  Username
                </Text>
                <TextInput
                  style={{
                    backgroundColor: colors.background.primary,
                    borderRadius: borderRadius.md,
                    padding: 12,
                    color: colors.text.primary,
                    fontSize: 16,
                    borderWidth: 1,
                    borderColor: colors.gold.dark,
                  }}
                  placeholder="Choose a username"
                  placeholderTextColor={colors.text.muted}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoComplete="username"
                  editable={!isLoading}
                />
              </View>

              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{
                    color: colors.text.secondary,
                    marginBottom: 8,
                    fontSize: 14,
                    fontWeight: '600',
                  }}
                >
                  Email
                </Text>
                <TextInput
                  style={{
                    backgroundColor: colors.background.primary,
                    borderRadius: borderRadius.md,
                    padding: 12,
                    color: colors.text.primary,
                    fontSize: 16,
                    borderWidth: 1,
                    borderColor: colors.gold.dark,
                  }}
                  placeholder="Enter your email"
                  placeholderTextColor={colors.text.muted}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  editable={!isLoading}
                />
              </View>

              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{
                    color: colors.text.secondary,
                    marginBottom: 8,
                    fontSize: 14,
                    fontWeight: '600',
                  }}
                >
                  Password
                </Text>
                <TextInput
                  style={{
                    backgroundColor: colors.background.primary,
                    borderRadius: borderRadius.md,
                    padding: 12,
                    color: colors.text.primary,
                    fontSize: 16,
                    borderWidth: 1,
                    borderColor: colors.gold.dark,
                  }}
                  placeholder="At least 6 characters"
                  placeholderTextColor={colors.text.muted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoComplete="password"
                  editable={!isLoading}
                />
              </View>

              <View style={{ marginBottom: 24 }}>
                <Text
                  style={{
                    color: colors.text.secondary,
                    marginBottom: 8,
                    fontSize: 14,
                    fontWeight: '600',
                  }}
                >
                  Confirm Password
                </Text>
                <TextInput
                  style={{
                    backgroundColor: colors.background.primary,
                    borderRadius: borderRadius.md,
                    padding: 12,
                    color: colors.text.primary,
                    fontSize: 16,
                    borderWidth: 1,
                    borderColor: colors.gold.dark,
                  }}
                  placeholder="Re-enter password"
                  placeholderTextColor={colors.text.muted}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  autoComplete="password"
                  editable={!isLoading}
                />
              </View>

              <Button
                title={isLoading ? 'Creating Account...' : 'Create Account'}
                onPress={handleRegister}
                disabled={isLoading}
              />

              <View style={{ marginTop: 16, alignItems: 'center' }}>
                <Text style={{ color: colors.text.secondary, fontSize: 14 }}>
                  Already have an account?{' '}
                  <Text
                    style={{
                      color: colors.gold.primary,
                      fontWeight: 'bold',
                    }}
                    onPress={() => !isLoading && navigation.navigate('Login')}
                  >
                    Sign In
                  </Text>
                </Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}
