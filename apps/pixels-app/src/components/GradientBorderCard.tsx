import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { View, ViewProps } from "react-native";
import { useTheme } from "react-native-paper";

import { RotatingGradient } from "./RotatingGradient";

import { getBorderRadius } from "~/features/getBorderRadius";

export function RotatingGradientBorderCard({
  children,
  style,
  contentStyle,
  ...props
}: ViewProps & {
  contentStyle?: ViewProps["style"];
}) {
  const { colors, roundness } = useTheme();
  const borderRadius = getBorderRadius(roundness);
  return (
    <RotatingGradient
      colors={[colors.primary, colors.tertiary]}
      style={[
        {
          borderRadius,
        },
        style,
      ]}
      {...props}
    >
      <View
        style={[
          {
            margin: 2,
            padding: 5,
            alignItems: "center",
            justifyContent: "center",
            borderRadius,
            backgroundColor: colors.background,
          },
          contentStyle,
        ]}
      >
        {children}
      </View>
    </RotatingGradient>
  );
}

export function GradientBorderCard({
  children,
  style,
  contentStyle,
  ...props
}: ViewProps & {
  contentStyle?: ViewProps["style"];
}) {
  const { colors, roundness } = useTheme();
  const borderRadius = getBorderRadius(roundness);
  return (
    <LinearGradient
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      colors={[colors.primary, colors.tertiary]}
      style={[
        {
          borderRadius,
        },
        style,
      ]}
      {...props}
    >
      <View
        style={[
          {
            margin: 2,
            padding: 5,
            alignItems: "center",
            borderRadius,
            backgroundColor: colors.background,
          },
          contentStyle,
        ]}
      >
        {children}
      </View>
    </LinearGradient>
  );
}
