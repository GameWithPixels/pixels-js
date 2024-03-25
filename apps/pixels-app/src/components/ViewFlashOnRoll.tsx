import {
  Pixel,
  PixelInfoNotifier,
  usePixelStatus,
} from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { ViewProps } from "react-native/types";
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

export function useFlashAnimationStyle(flash: boolean) {
  const animValue = useSharedValue(0);
  const animStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      animValue.value,
      [0, 1],
      ["transparent", "dimgray"]
    ),
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
  const [rollState, setRollState] = React.useState(pixel?.rollState);
  React.useEffect(() => {
    setRollState(pixel?.rollState);
    if (pixel) {
      const onRoll = () => setRollState(pixel.rollState);
      pixel.addPropertyListener("rollState", onRoll);
      return () => {
        pixel.removePropertyListener("rollState", onRoll);
      };
    }
  }, [pixel]);
  return useFlashAnimationStyle(
    (rollState === "rolling" || rollState === "handling") &&
      (!status || status === "ready")
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