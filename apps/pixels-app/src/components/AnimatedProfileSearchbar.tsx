import React from "react";
import { Searchbar } from "react-native-paper";
import Animated, {
  SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";

export const profileSearchbarMinHeight = 56;

export function AnimatedProfileSearchbar({
  filter,
  setFilter,
  positionY,
  headerHeight,
}: {
  filter: string;
  setFilter: (filter: string) => void;
  positionY: SharedValue<number>;
  headerHeight: number;
}) {
  const animStyle = useAnimatedStyle(() => {
    const v = 1 - Math.min(1, Math.max(0, positionY.value / headerHeight));
    return {
      height: headerHeight * v,
      transform: [{ translateY: headerHeight * (1 - v) * 0.75 }],
      opacity: v,
    };
  }, [headerHeight, positionY]);
  return (
    <Animated.View style={[animStyle, { overflow: "hidden", gap: 10 }]}>
      <Searchbar
        placeholder="Filter by die type, name or description"
        onChangeText={setFilter}
        value={filter}
      />
    </Animated.View>
  );
}
