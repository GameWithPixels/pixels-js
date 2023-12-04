import {
  BaseStyles,
  getBorderRadius,
} from "@systemic-games/react-native-base-components";
import React from "react";
import { StyleSheet, ViewStyle } from "react-native";
import { useTheme } from "react-native-paper";

// App styles
export const AppStyles = StyleSheet.create({
  ...BaseStyles,
  // One prop styles
  mv3: {
    marginVertical: 3,
  },
  // Containers
  listContentContainer: {
    flexGrow: 1,
    gap: 8,
  },
});

export function useModalStyle(): ViewStyle {
  const theme = useTheme();
  return React.useMemo(
    () => ({
      margin: 10,
      padding: 10,
      borderWidth: 1,
      borderRadius: getBorderRadius(theme),
      backgroundColor: theme.colors.background,
      borderColor: theme.colors.outline,
    }),
    [theme]
  );
}
