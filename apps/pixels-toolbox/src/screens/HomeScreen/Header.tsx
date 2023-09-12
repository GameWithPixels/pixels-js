import Ionicons from "@expo/vector-icons/Ionicons";
import { BaseHStack } from "@systemic-games/react-native-base-components";
import Constants from "expo-constants";
import { Pressable, StyleSheet } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function getVersion(): string {
  const version = Constants.expoConfig?.version;
  if (version?.length) {
    // We want at least a major.minor version number,
    // and we remove any extra 0 sub versions.
    const parts = version.split(".");
    try {
      while (parts.length > 2 && Number(parts.at(-1)) === 0) {
        parts.pop();
      }
      if (parts.length <= 1) {
        parts.push("0");
      }
      return parts.join(".");
    } catch {
      return version;
    }
  } else {
    return "0.1";
  }
}

export function Header({ onPress }: { onPress?: () => void }) {
  const { top } = useSafeAreaInsets();
  const theme = useTheme();
  return (
    <BaseHStack mt={top}>
      <Pressable style={styles.icon} onPress={onPress}>
        <Ionicons name="menu" size={40} color={theme.colors.onBackground} />
      </Pressable>
      <Text style={styles.text} variant="headlineMedium">
        {`Toolbox ${__DEV__ ? " 🚧" : getVersion()}`}
      </Text>
    </BaseHStack>
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
