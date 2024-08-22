import {
  AnimatedProp,
  Canvas,
  Color,
  LinearGradient,
  RoundedRect,
  vec,
} from "@shopify/react-native-skia";
import React from "react";
import { StyleSheet, View, ViewProps } from "react-native";
import {
  Easing,
  ReduceMotion,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

export function RotatingGradient({
  children,
  style,
  colors,
  ...props
}: ViewProps & { colors: AnimatedProp<Color[]> }) {
  // Size of the view
  const size = useSharedValue({ width: 0, height: 0 });
  const width = useDerivedValue(() => size.value.width);
  const height = useDerivedValue(() => size.value.height);

  // Rotate the gradient
  const angle = useSharedValue(0);
  React.useEffect(() => {
    angle.value = withRepeat(
      withTiming(2 * Math.PI, {
        duration: 2000,
        easing: Easing.linear,
        reduceMotion: ReduceMotion.Never,
      }),
      -1 // true
    );
  }, [angle]);

  // Calculate the start and end points of the gradient
  const start = useDerivedValue(() =>
    vec(
      0.5 * width.value * (1 + Math.cos(angle.value)),
      0.5 * height.value * (1 + Math.sin(angle.value))
    )
  );
  const end = useDerivedValue(() =>
    vec(
      0.5 * width.value * (1 + Math.cos(angle.value + Math.PI)),
      0.5 * height.value * (1 + Math.sin(angle.value + Math.PI))
    )
  );

  // Extract the borderRadius from the style
  const flatStyle = React.useMemo(() => StyleSheet.flatten(style), [style]);
  const radius = useSharedValue(
    typeof flatStyle.borderRadius === "number" ? flatStyle.borderRadius : 0
  );
  React.useEffect(() => {
    if (typeof flatStyle.borderRadius === "object") {
      const animatedRadius = flatStyle.borderRadius;
      const id = animatedRadius.addListener(
        ({ value }: { value: number }) => (radius.value = value)
      );
      return () => animatedRadius.removeListener(id);
    }
  }, [flatStyle.borderRadius, radius]);

  return (
    <View style={style} {...props}>
      <Canvas
        style={{ position: "absolute", width: "100%", height: "100%" }}
        onSize={size}
      >
        <RoundedRect x={0} y={0} width={width} height={height} r={radius}>
          <LinearGradient start={start} end={end} colors={colors} />
        </RoundedRect>
      </Canvas>
      {children}
    </View>
  );
}
