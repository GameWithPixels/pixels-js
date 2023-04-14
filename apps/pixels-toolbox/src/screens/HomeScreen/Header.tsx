import Ionicons from "@expo/vector-icons/Ionicons";
import { FastHStack } from "@systemic-games/react-native-base-components";
import Constants from "expo-constants";
import { Pressable, StyleSheet } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function Header({ onPress }: { onPress?: () => void }) {
  const { top } = useSafeAreaInsets();
  const theme = useTheme();
  return (
    <FastHStack mt={top}>
      <Pressable style={styles.icon} onPress={onPress}>
        <Ionicons name="menu" size={40} color={theme.colors.onBackground} />
      </Pressable>
      <Text style={styles.text} variant="headlineMedium">
        {`Toolbox ${__DEV__ ? " 🚧" : Constants.manifest?.version}`}
      </Text>
    </FastHStack>
  );
}

const styles = StyleSheet.create({
  icon: {
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    flex: 1,
    flexGrow: 1,
    textAlign: "center",
    alignSelf: "center",
  },
});
