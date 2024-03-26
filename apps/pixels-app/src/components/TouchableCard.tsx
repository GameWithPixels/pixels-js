import { getBorderRadius } from "@systemic-games/react-native-base-components";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleProp, ViewStyle } from "react-native";
import {
  TouchableRipple,
  TouchableRippleProps,
  useTheme,
} from "react-native-paper";

import { useFlashAnimationStyle } from "./ViewFlashOnRoll";
import { getBorderColor, makeTransparent } from "./colors";

import { withAnimated } from "~/withAnimated";

export type TouchableCardProps = Omit<
  TouchableRippleProps,
  "children" | "style"
> &
  React.PropsWithChildren<{
    row?: boolean;
    selected?: boolean;
    squaredTopBorder?: boolean;
    squaredBottomBorder?: boolean;
    noBorder?: boolean;
    noTopBorder?: boolean;
    noBottomBorder?: boolean;
    frameless?: boolean;
    gradientBorder?: boolean;
    transparent?: boolean;
    flash?: boolean;
    style?: StyleProp<ViewStyle>;
    contentStyle?: StyleProp<ViewStyle>;
  }>;

const AnimatedTouchableRipple = withAnimated(TouchableRipple);

export function TouchableCard({
  row,
  selected,
  squaredTopBorder,
  squaredBottomBorder,
  noBorder,
  noTopBorder,
  noBottomBorder,
  frameless,
  gradientBorder,
  transparent,
  flash,
  style,
  contentStyle,
  children,
  ...props
}: TouchableCardProps) {
  const { colors, roundness } = useTheme();
  const borderRadius = getBorderRadius(roundness, { tight: true });
  const cornersStyle = {
    borderTopLeftRadius: squaredTopBorder ? 0 : borderRadius,
    borderTopRightRadius: squaredTopBorder ? 0 : borderRadius,
    borderBottomLeftRadius: squaredBottomBorder ? 0 : borderRadius,
    borderBottomRightRadius: squaredBottomBorder ? 0 : borderRadius,
  };
  const gradientAlpha = gradientBorder
    ? 1
    : transparent
      ? 0
      : !frameless
        ? 0.1
        : props.disabled
          ? 0.2
          : 1;
  const animStyle = useFlashAnimationStyle(flash ?? false);
  return (
    <LinearGradient
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      colors={[
        makeTransparent(colors.primary, gradientAlpha),
        makeTransparent(colors.secondary, gradientAlpha),
      ]}
      style={[{ ...cornersStyle, overflow: "hidden" }, style]}
    >
      <AnimatedTouchableRipple
        style={[
          {
            flexDirection: row ? "row" : "column",
            alignItems: "center",
            margin: gradientBorder ? 2 : 0,
            padding: gradientBorder ? 3 : 5,
            backgroundColor: gradientBorder ? colors.background : undefined,
            // Borders (having issues on iOS with those borders applied on the LinearGradient)
            borderWidth: noBorder ?? gradientBorder ? 0 : 1,
            borderTopWidth: noBorder ?? gradientBorder ?? noTopBorder ? 0 : 1,
            borderBottomWidth:
              noBorder ?? gradientBorder ?? noBottomBorder ? 0 : 1,
            borderColor: getBorderColor(colors, selected),
            // Corners
            ...cornersStyle,
          },
          contentStyle,
          animStyle,
        ]}
        {...props}
      >
        <>{children}</>
      </AnimatedTouchableRipple>
    </LinearGradient>
  );
}
