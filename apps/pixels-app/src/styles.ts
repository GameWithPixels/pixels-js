import { BaseStylesObject } from "@systemic-games/react-native-pixels-components";
import { StyleSheet } from "react-native";

import { Colors } from "./themes";

export const AppStyles = StyleSheet.create({
  ...BaseStylesObject,
  listContentContainer: {
    flexGrow: 1,
    gap: 10,
  },
  greyedOut: { color: Colors.grey500 },
  menuItemWithIcon: { flex: 1, justifyContent: "space-between" },
});
