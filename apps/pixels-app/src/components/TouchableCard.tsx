import React from "react";
import { StyleProp, ViewStyle } from "react-native";
import {
  TouchableRipple,
  TouchableRippleProps,
  useTheme,
} from "react-native-paper";

import { RotatingGradient } from "./RotatingGradient";
import { getBorderColor, makeTransparent } from "./colors";

import { getBorderRadius } from "~/features/getBorderRadius";
import { withAnimated } from "~/features/withAnimated";
import { useFlashAnimationStyle } from "~/hooks";

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
    gradientBorder?: "bright" | "dark";
    thinBorder?: boolean;
    rotatingBorder?: boolean;
    selectable?: boolean;
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
  thinBorder,
  rotatingBorder,
  selectable,
  transparent,
  flash,
  style,
  contentStyle,
  children,
  ...props
}: TouchableCardProps) {
  const { colors, roundness } = useTheme();
  const borderRadius =
    getBorderRadius(roundness, { tight: !gradientBorder }) /
    (thinBorder ? 2 : 1);
  const cornersStyle = {
    borderTopLeftRadius: squaredTopBorder ? 0 : borderRadius,
    borderTopRightRadius: squaredTopBorder ? 0 : borderRadius,
    borderBottomLeftRadius: squaredBottomBorder ? 0 : borderRadius,
    borderBottomRightRadius: squaredBottomBorder ? 0 : borderRadius,
  };
  const innerCornersStyle = {
    borderTopLeftRadius: squaredTopBorder ? 0 : borderRadius - 2,
    borderTopRightRadius: squaredTopBorder ? 0 : borderRadius - 2,
    borderBottomLeftRadius: squaredBottomBorder ? 0 : borderRadius - 2,
    borderBottomRightRadius: squaredBottomBorder ? 0 : borderRadius - 2,
  };
  const gradientAlpha = gradientBorder
    ? gradientBorder === "bright"
      ? 1
      : 0.5
    : transparent
      ? 0
      : !frameless
        ? 0.1
        : props.disabled
          ? 0.2
          : 1;
  const animStyle = useFlashAnimationStyle(
    !!flash,
    gradientBorder && !selected
      ? selectable
        ? "mid-tone"
        : "greyedOut"
      : "transparent"
  );
  return (
    <RotatingGradient
      disabled={!rotatingBorder}
      colors={[
        makeTransparent(colors.primary, gradientAlpha),
        makeTransparent(colors.tertiary, gradientAlpha),
      ]}
      style={[cornersStyle, style]}
    >
      <AnimatedTouchableRipple
        style={[
          {
            flexDirection: row ? "row" : "column",
            alignItems: "center",
            margin: gradientBorder ? (thinBorder ? 2 : 3) : 0,
            padding: gradientBorder ? 3 : 5,
            // Borders (having issues on iOS with those borders applied on the LinearGradient)
            borderWidth: noBorder || gradientBorder ? 0 : 1,
            borderTopWidth: noBorder || gradientBorder || noTopBorder ? 0 : 1,
            borderBottomWidth:
              noBorder || gradientBorder || noBottomBorder ? 0 : 1,
            borderColor: getBorderColor(colors, selected),
            // Corners
            ...innerCornersStyle,
          },
          contentStyle,
          animStyle,
        ]}
        {...props}
      >
        <>{children}</>
      </AnimatedTouchableRipple>
    </RotatingGradient>
  );
}
