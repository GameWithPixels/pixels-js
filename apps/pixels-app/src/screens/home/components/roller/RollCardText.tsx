import React from "react";
import { Text as RNText, TextProps } from "react-native";
import { useTheme } from "react-native-paper";
import Animated, {
  AnimatedProps,
  useDerivedValue,
} from "react-native-reanimated";

export function RollCardText({
  lineHeight,
  style,
  ...props
}: { lineHeight: number } & TextProps) {
  const { colors } = useTheme();
  return (
    <RNText
      numberOfLines={1}
      adjustsFontSizeToFit
      style={[
        {
          fontFamily: "LTInternet-Bold",
          textAlign: "center",
          fontSize: lineHeight * 0.85,
          lineHeight,
          color: colors.onSurface,
        },
        style,
      ]}
      {...props}
    />
  );
}

export function AnimatedRollCardText({
  lineHeight,
  style,
  ...props
}: AnimatedProps<{ lineHeight: number } & TextProps>) {
  const fontSize = useDerivedValue(
    () =>
      (typeof lineHeight === "number" ? lineHeight : lineHeight.value) * 0.85
  );
  const { colors } = useTheme();
  return (
    <Animated.Text
      numberOfLines={1}
      adjustsFontSizeToFit
      style={[
        {
          fontFamily: "LTInternet-Bold",
          textAlign: "center",
          fontSize,
          lineHeight,
          color: colors.onSurface,
        },
        style,
      ]}
      {...props}
    />
  );
}
