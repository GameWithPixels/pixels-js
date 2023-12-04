import React from "react";
import { LayoutChangeEvent, View, ViewProps } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

// https://dev.to/dimaportenko/collapsible-card-with-react-native-reanimated-495a
export function CollapsableContainer({
  visible,
  collapsedMarginBottom,
  onLayout,
  ...props
}: {
  visible?: boolean;
  collapsedMarginBottom?: number;
} & ViewProps) {
  const [height, setHeight] = React.useState(0);
  const animatedHeight = useSharedValue(-1);
  const onCustomLayout = React.useCallback(
    (ev: LayoutChangeEvent) => {
      const layoutHeight = ev.nativeEvent.layout.height;
      if (layoutHeight > 0) {
        setHeight(layoutHeight);
      }
      onLayout?.(ev);
    },
    [onLayout]
  );
  const collapsableStyle = useAnimatedStyle(() => {
    if (height > 0) {
      animatedHeight.value = visible
        ? animatedHeight.value === -1
          ? height // No animation if immediately visible
          : withTiming(height)
        : withTiming(0);
    }
    return {
      height: animatedHeight.value !== -1 ? animatedHeight.value : undefined,
      marginBottom: animatedHeight.value > 0 ? 0 : collapsedMarginBottom ?? 0,
    };
  }, [animatedHeight, collapsedMarginBottom, height, visible]);
  // <LayoutAnimationConfig skipEntering> // TODO v3.6
  return (
    <Animated.View style={[collapsableStyle, { overflow: "hidden" }]}>
      <View onLayout={onCustomLayout} {...props} />
    </Animated.View>
  );
}
