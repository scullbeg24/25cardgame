import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
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

type LoginNavProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export default function LoginScreen() {
  const navigation = useNavigation<LoginNavProp>();
  const { signIn, isLoading } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter email and password');
      return;
    }

    try {
      setError('');
      await signIn(email.trim(), password);
      // Navigation will happen automatically via auth state listener
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
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
            <View style={{ alignItems: 'center', marginBottom: 48 }}>
              <View
                style={{
                  backgroundColor: colors.background.surface,
                  borderRadius: borderRadius.xxl,
                  padding: 24,
                  paddingHorizontal: 40,
                  alignItems: 'center',
                  ...shadows.extruded.large,
                  borderWidth: 2,
                  borderColor: colors.gold.dark,
                }}
              >
                <Text
                  style={{
                    fontSize: 64,
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
                    fontSize: 16,
                    color: colors.text.primary,
                    fontWeight: '600',
                  }}
                >
                  Welcome Back
                </Text>
              </View>
            </View>

            {/* Login Form */}
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
                  marginBottom: 24,
                  textAlign: 'center',
                }}
              >
                Sign In
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

              <View style={{ marginBottom: 24 }}>
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
                  placeholder="Enter your password"
                  placeholderTextColor={colors.text.muted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoComplete="password"
                  editable={!isLoading}
                />
              </View>

              <Button
                title={isLoading ? 'Signing In...' : 'Sign In'}
                onPress={handleLogin}
                disabled={isLoading}
              />

              <View style={{ marginTop: 16, alignItems: 'center' }}>
                <Text style={{ color: colors.text.secondary, fontSize: 14 }}>
                  Don't have an account?{' '}
                  <Text
                    style={{
                      color: colors.gold.primary,
                      fontWeight: 'bold',
                    }}
                    onPress={() => !isLoading && navigation.navigate('Register')}
                  >
                    Sign Up
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
