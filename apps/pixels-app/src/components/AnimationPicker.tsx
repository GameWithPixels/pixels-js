import { PixelAnimation } from "@systemic-games/pixels-core-connect";
import React from "react";
import { View, ViewProps } from "react-native";
import { Text } from "react-native-paper";

import { AnimationsGrid } from "./animation";
import { SortMode, SortButton } from "./buttons";

import { useAnimations } from "@/hooks";

export function AnimationPicker({
  animation,
  onSelectAnimation,
  ...props
}: {
  animation?: PixelAnimation;
  onSelectAnimation?: (animation: PixelAnimation) => void;
} & ViewProps) {
  const { animations } = useAnimations();
  const [sortMode, setSortMode] = React.useState<SortMode>("a-z");
  return (
    <View {...props}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingBottom: 10,
        }}
      >
        <Text variant="titleLarge">Animations</Text>
        <SortButton mode={sortMode} onChange={setSortMode} />
      </View>
      <AnimationsGrid
        animations={animations}
        numColumns={2}
        selected={animation}
        onSelectAnimation={onSelectAnimation}
      />
    </View>
  );
}
