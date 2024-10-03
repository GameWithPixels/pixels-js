import { LinearGradient } from "expo-linear-gradient";
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

const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient);

export function RotatingGradient({
  children,
  disabled,
  colors,
  style,
  onLayout,
  ...props
}: ViewProps & { disabled?: boolean; colors: readonly string[] }) {
  // Rotate the gradient
  const angle = useSharedValue(0);
  React.useEffect(() => {
    if (disabled) {
      angle.value = 0;
    } else {
      angle.value = withRepeat(
        withTiming(2 * Math.PI, {
          duration: 3000,
          easing: Easing.linear,
          reduceMotion: ReduceMotion.Never,
        }),
        -1 // true
      );
    }
  }, [angle, disabled]);
  const rotation = useAnimatedStyle(() => ({
    transform: [{ rotate: `${angle.value}rad` }],
  }));

  // Size of the view
  const [size, setSize] = React.useState({ width: 0, height: 0 });
  const { dx, dy } = React.useMemo(() => {
    const r = Math.sqrt(2 * Math.max(size.width, size.height) ** 2);
    const dx = (r - size.width) / 2;
    const dy = (r - size.height) / 2;
    return { dx, dy };
  }, [size]);

  return (
    <View
      style={[style, { overflow: "hidden" }]}
      onLayout={(ev) => {
        onLayout?.(ev);
        setSize({
          width: ev.nativeEvent.layout.width,
          height: ev.nativeEvent.layout.height,
        });
      }}
      {...props}
    >
      <AnimatedGradient
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 0 }}
        colors={colors}
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
      />
      {children}
    </View>
  );
}
