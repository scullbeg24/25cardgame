import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import type { ReactNode } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors, shadows, borderRadius } from "../theme";

type RootStackParamList = {
  Home: undefined;
  [key: string]: undefined;
};

interface NavigationHeaderProps {
  title?: string;
  showBack?: boolean;
  showHome?: boolean;
  onBackPress?: () => void;
  /** Optional content to render before the Home button (e.g. Hand History button) */
  rightAction?: ReactNode;
}

export default function NavigationHeader({
  title,
  showBack = true,
  showHome = true,
  onBackPress,
  rightAction,
}: NavigationHeaderProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const handleHome = () => {
    navigation.navigate("Home");
  };

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <View style={styles.leftContainer}>
        {showBack && navigation.canGoBack() && (
          <TouchableOpacity
            onPress={handleBack}
            style={styles.button}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Text style={styles.buttonIcon}>←</Text>
            <Text style={styles.buttonText}>Back</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Title */}
      <View style={styles.centerContainer}>
        {title && (
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        )}
      </View>

      {/* Right side: optional action + Home Button */}
      <View style={styles.rightContainer}>
        {rightAction}
        {showHome && (
          <TouchableOpacity
            onPress={handleHome}
            style={styles.button}
            accessibilityLabel="Go to home"
            accessibilityRole="button"
          >
            <Text style={styles.buttonIcon}>🏠</Text>
            <Text style={styles.buttonText}>Home</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.softUI.border,
  },
  leftContainer: {
    flex: 1,
    alignItems: "flex-start",
  },
  centerContainer: {
    flex: 2,
    alignItems: "center",
  },
  rightContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background.surface,
    borderRadius: borderRadius.round,
    paddingHorizontal: 14,
    paddingVertical: 8,
    ...shadows.extruded.medium,
  },
  buttonIcon: {
    fontSize: 16,
    color: colors.text.primary,
    marginRight: 6,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text.primary,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.gold.primary,
  },
});
