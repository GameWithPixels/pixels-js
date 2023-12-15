import { getBorderRadius } from "@systemic-games/react-native-base-components";
import { LinearGradient } from "expo-linear-gradient";
import { StyleProp, View, ViewProps, ViewStyle } from "react-native";
import { useTheme } from "react-native-paper";

import { makeTransparent } from "./utils";

export type CardProps = ViewProps & {
  row?: boolean;
  noBorder?: boolean;
  frameless?: boolean;
  transparent?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
};

export function Card({
  row,
  noBorder,
  frameless,
  transparent,
  style,
  contentStyle,
  children,
  ...props
}: CardProps) {
  const gradientAlpha = transparent ? 0 : frameless ? 0.4 : 0.1;
  const { colors, roundness } = useTheme();
  const borderRadius = getBorderRadius(roundness, { tight: true });
  return (
    <LinearGradient
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      colors={[
        makeTransparent(colors.primary, gradientAlpha),
        makeTransparent(colors.secondary, gradientAlpha),
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
            borderWidth: noBorder ? 0 : 1,
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
