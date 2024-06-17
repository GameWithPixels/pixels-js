import { MaterialCommunityIcons } from "@expo/vector-icons";
import { PixelStatus } from "@systemic-games/react-native-pixels-connect";
import React from "react";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

function AnimatedConnectionIcon({
  size,
  color,
}: {
  size: number;
  color?: string;
}) {
  const progress = useSharedValue(0);
  React.useEffect(() => {
    progress.value = withRepeat(withTiming(360, { duration: 3000 }), -1);
  }, [progress]);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: progress.value + "deg" }],
  }));
  return (
    <Animated.View style={animStyle}>
      <MaterialCommunityIcons
        name="bluetooth-connect"
        size={size}
        color={color}
      />
    </Animated.View>
  );
}

export function PixelConnectionStatus({
  status,
  size,
  color,
}: {
  status?: PixelStatus;
  size: number;
  color?: string;
}) {
  if (status === "ready") {
    return (
      <MaterialCommunityIcons name="bluetooth" size={size} color={color} />
    );
  } else if (status === "connecting" || status === "identifying") {
    return <AnimatedConnectionIcon size={size} color={color} />;
  } else {
    return (
      <MaterialCommunityIcons name="bluetooth-off" size={size} color={color} />
    );
  }
}
