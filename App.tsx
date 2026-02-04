import "./global.css";
import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeScreen from "./src/screens/HomeScreen";
import GameSetupScreen from "./src/screens/GameSetupScreen";
import { useSettingsStore } from "./src/store/settingsStore";
import GameScreen from "./src/screens/GameScreen";
import RulesScreen from "./src/screens/RulesScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
import GameOverScreen from "./src/screens/GameOverScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  useEffect(() => {
    useSettingsStore.getState().load();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="Home"
            screenOptions={{
              headerShown: false,
            }}
          >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="GameSetup" component={GameSetupScreen} />
        <Stack.Screen name="Game" component={GameScreen} />
        <Stack.Screen name="Rules" component={RulesScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="GameOver" component={GameOverScreen} />
          </Stack.Navigator>
          <StatusBar style="light" />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
