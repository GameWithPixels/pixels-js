import { getBorderRadius } from "@systemic-games/react-native-base-components";
import { LinearGradient } from "expo-linear-gradient";
import { StyleProp, View, ViewProps, ViewStyle } from "react-native";
import { useTheme } from "react-native-paper";

import { makeTransparent } from "./utils";

export type CardProps = ViewProps & {
  row?: boolean;
  transparent?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
};

export function Card({
  row,
  transparent,
  style,
  contentStyle,
  children,
  ...props
}: CardProps) {
  const { colors, roundness } = useTheme();
  const borderRadius = getBorderRadius(roundness, { tight: true });
  return (
    <LinearGradient
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      colors={[
        makeTransparent(colors.primary, transparent ? 0 : 0.1),
        makeTransparent(colors.secondary, transparent ? 0 : 0.1),
      ]}
      style={[{ borderRadius }, style]}
    >
      <View
        style={[
          {
            flexDirection: row ? "row" : "column",
            alignItems: "center",
            padding: 5,
            // Borders (having issues on iOS with those borders applied on the LinearGradient)
            borderWidth: 1,
            borderColor: colors.outline,
            borderRadius,
          },
          contentStyle,
        ]}
        {...props}
      >
        <>{children}</>
      </View>
    </LinearGradient>
  );
}
