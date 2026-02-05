import "./global.css";
import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeScreen from "./src/screens/HomeScreen";
import GameSetupScreen from "./src/screens/GameSetupScreen";
import LoginScreen from "./src/screens/LoginScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import FriendsScreen from "./src/screens/FriendsScreen";
import MultiplayerMenuScreen from "./src/screens/MultiplayerMenuScreen";
import RoomLobbyScreen from "./src/screens/RoomLobbyScreen";
import { useSettingsStore } from "./src/store/settingsStore";
import { useAuthStore } from "./src/store/authStore";
import { setSoundEnabled } from "./src/utils/sounds";
import GameScreen from "./src/screens/GameScreen";
import RulesScreen from "./src/screens/RulesScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
import GameOverScreen from "./src/screens/GameOverScreen";
import { initializeFirebase } from "./src/config/firebase.config";
import { colors } from "./src/theme";

const Stack = createNativeStackNavigator();

export default function App() {
  // Sync sound settings with sound manager
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const { isAuthenticated, isLoading, initialize } = useAuthStore();
  
  useEffect(() => {
    setSoundEnabled(soundEnabled);
  }, [soundEnabled]);

  useEffect(() => {
    // Initialize Firebase
    initializeFirebase();
    // Initialize auth listener
    const unsubscribe = initialize();
    // Load settings
    useSettingsStore.getState().load();
    
    return () => {
      unsubscribe();
    };
  }, []);

  // Show loading spinner while checking auth state
  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background.primary, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.gold.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
            }}
          >
            {!isAuthenticated ? (
              // Auth Stack
              <>
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Register" component={RegisterScreen} />
              </>
            ) : (
              // Main App Stack
              <>
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen name="Profile" component={ProfileScreen} />
                <Stack.Screen name="Friends" component={FriendsScreen} />
                <Stack.Screen name="MultiplayerMenu" component={MultiplayerMenuScreen} />
                <Stack.Screen name="RoomLobby" component={RoomLobbyScreen} />
                <Stack.Screen name="GameSetup" component={GameSetupScreen} />
                <Stack.Screen name="Game" component={GameScreen} />
                <Stack.Screen name="Rules" component={RulesScreen} />
                <Stack.Screen name="Settings" component={SettingsScreen} />
                <Stack.Screen name="GameOver" component={GameOverScreen} />
              </>
            )}
          </Stack.Navigator>
          <StatusBar style="light" />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
