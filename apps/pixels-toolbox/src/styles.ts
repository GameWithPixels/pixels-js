import React from "react";
import { StyleSheet, ViewStyle } from "react-native";
import { useTheme } from "react-native-paper";

// Global style
const gs = StyleSheet.create({
  // One prop styles
  empty: {},
  flex: {
    flex: 1,
  },
  fullWidth: {
    width: "100%",
  },
  mv3: {
    marginVertical: 3,
  },
  bold: {
    fontWeight: "bold",
  },
  italic: {
    fontStyle: "italic",
  },
  underlined: {
    textDecorationLine: "underline",
  },
  // Containers
  container: {
    flex: 1,
    alignItems: "center",
  },
  containerHorizontal: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  containerFooter: {
    alignItems: "center",
  },
  listContentContainer: {
    flexGrow: 1,
    gap: 8,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default gs;

export function useModalStyle(): ViewStyle {
  const theme = useTheme();
  return React.useMemo(
    () => ({
      margin: 10,
      padding: 10,
      borderWidth: 2,
      borderRadius: (theme.isV3 ? 5 : 1) * theme.roundness,
      backgroundColor: theme.colors.background,
      borderColor: theme.colors.onBackground,
    }),
    [theme]
  );
}
