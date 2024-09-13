import {
  AnimatedProp,
  Canvas,
  Color,
  LinearGradient,
  Rect,
  vec,
} from "@shopify/react-native-skia";
import React from "react";
import { View, ViewProps } from "react-native";
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { AppStyles } from "~/app/styles";

export function RotatingGradient({
  children,
  style,
  colors,
  onLayout,
  ...props
}: ViewProps & { colors: AnimatedProp<Color[]> }) {
  // Rotate the gradient
  const angle = useSharedValue(0);
  React.useEffect(() => {
    angle.value = withRepeat(
      withTiming(2 * Math.PI, {
        duration: 3000,
        easing: Easing.linear,
        reduceMotion: ReduceMotion.Never,
      }),
      -1 // true
    );
  }, [angle]);
  const rotation = useAnimatedStyle(() => ({
    transformOrigin: ["50%", "50%", 0],
    transform: [{ rotate: `${angle.value}rad` }],
  }));

  // Size of the view
  const [size, setSize] = React.useState({ width: 0, height: 0 });
  const { r, dx, dy } = React.useMemo(() => {
    const r = Math.sqrt(2 * Math.max(size.width, size.height) ** 2);
    const dx = (r - size.width) / 2;
    const dy = (r - size.height) / 2;
    return { r, dx, dy };
  }, [size]);

  return (
    <View
      style={style}
      onLayout={(ev) => {
        onLayout?.(ev);
        setSize({
          width: ev.nativeEvent.layout.width,
          height: ev.nativeEvent.layout.height,
        });
      }}
      {...props}
    >
      <Animated.View
        style={[
          {
            position: "absolute",
            left: -dx,
            right: -dx,
            top: -dy,
            bottom: -dy,
          },
          rotation,
        ]}
      >
        <Canvas style={AppStyles.fullSize}>
          <Rect x={0} y={0} width={r} height={r}>
            <LinearGradient
              start={vec(dx, dy)}
              end={vec(dx + size.width, dy + size.height)}
              colors={colors}
            />
          </Rect>
        </Canvas>
      </Animated.View>
      {children}
    </View>
  );
}
