import { LinearGradient } from "expo-linear-gradient";
import { StyleProp, View, ViewProps, ViewStyle } from "react-native";
import { useTheme } from "react-native-paper";

import { darken, makeTransparent } from "./colors";

import { getBorderRadius } from "~/features/getBorderRadius";

export type CardProps = ViewProps & {
  row?: boolean;
  disabled?: boolean;
  noBorder?: boolean;
  frameless?: boolean;
  vivid?: boolean;
  transparent?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
};

export function Card({
  children,
  row,
  disabled,
  noBorder,
  frameless,
  vivid,
  transparent,
  style,
  contentStyle,
  onLayout,
  ...props
}: CardProps) {
  const gradientAlpha = transparent
    ? 0
    : !frameless
      ? 0.1
      : disabled
        ? 0.2
        : vivid
          ? 1
          : 2; // Just need to be higher than one
  const { colors, roundness } = useTheme();
  const borderRadius = getBorderRadius(roundness, { tight: true });
  return (
    <LinearGradient
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      colors={[
        gradientAlpha <= 1
          ? makeTransparent(colors.primary, gradientAlpha)
          : darken(colors.primary, 0.5),
        gradientAlpha <= 1
          ? makeTransparent(colors.tertiary, gradientAlpha)
          : darken(colors.tertiary, 0.5),
      ]}
      style={[{ borderRadius }, style]}
      onLayout={onLayout}
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
