import React from "react";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
} from "react-native-reanimated";

export function BouncingView({ children }: { children: React.ReactNode }) {
  const translateY = useSharedValue(0);
  // Start bouncing animation
  React.useEffect(() => {
    translateY.value = withRepeat(
      withSpring(1, {
        duration: 1500,
        dampingRatio: 0.2,
      }),
      -1 // true
    );
  }, [translateY]);
  const animStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: (translateY.value - 0.5) * 10 }, // 10 pixels
      ],
    };
  });
  return <Animated.View style={animStyle}>{children}</Animated.View>;
}
