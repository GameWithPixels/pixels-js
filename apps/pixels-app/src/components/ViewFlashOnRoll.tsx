import {
  Pixel,
  PixelInfoNotifier,
  usePixelInfoProp,
  usePixelStatus,
} from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { ViewProps } from "react-native/types";
import { useTheme } from "react-native-paper";
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { makeTransparent } from "./colors";

export function useFlashAnimationStyle(
  flash: boolean,
  mode: "greyedOut" | "mid-tone" | "transparent" = "transparent"
) {
  const { colors } = useTheme();
  const colorRange = React.useMemo(
    () => [
      makeTransparent(
        colors.background,
        mode === "greyedOut" ? 0.85 : mode === "mid-tone" ? 0.6 : 0
      ),
      makeTransparent(colors.background, 0.3),
    ],
    [colors, mode]
  );
  const animValue = useSharedValue(0);
  const animStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(animValue.value, [0, 1], colorRange),
  }));
  React.useEffect(() => {
    const pingPong = (x0: number, x1: number) =>
      withSequence(
        withTiming(x0, {
          duration: 600,
          easing: Easing.out(Easing.ease),
        }),
        withTiming(x1, { duration: 300, easing: Easing.in(Easing.ease) })
      );
    if (flash) {
      animValue.value = withRepeat(pingPong(0.5, 0), -1);
      return () => {
        animValue.value = pingPong(1, 0);
      };
    }
  }, [animValue, flash]);
  return animStyle;
}

export function useFlashAnimationStyleOnRoll(pixel?: PixelInfoNotifier) {
  const status = usePixelStatus(pixel instanceof Pixel ? pixel : undefined);
  const rollState = usePixelInfoProp(pixel, "rollState");
  return useFlashAnimationStyle(
    status === "ready" && (rollState === "rolling" || rollState === "handling")
  );
}

export function ViewFlashOnRoll({
  children,
  pixel,
  style,
  ...props
}: {
  pixel?: PixelInfoNotifier;
} & ViewProps) {
  const animStyle = useFlashAnimationStyleOnRoll(pixel);
  return (
    <Animated.View style={[animStyle, style]} {...props}>
      {children}
    </Animated.View>
  );
}
