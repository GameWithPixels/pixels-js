import React from "react";
import { StyleSheet, ViewStyle } from "react-native";
import { useTheme } from "react-native-paper";

import { getBorderRadius } from "~/features/getBorderRadius";

export const BaseStylesObject = {
  // One prop styles
  empty: {},
  flex: {
    flex: 1,
  },
  spacer: {
    flexGrow: 1,
  },
  fullWidth: {
    width: "100%",
  },
  selfCentered: {
    alignSelf: "center",
  },
  // Containers
  fullSize: {
    width: "100%",
    height: "100%",
  },
  fullSizeFlex: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
  },
  centeredFlex: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  // Text
  textCentered: {
    textAlign: "center",
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
} as const;

// App styles
export const AppStyles = StyleSheet.create({
  ...BaseStylesObject,
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
