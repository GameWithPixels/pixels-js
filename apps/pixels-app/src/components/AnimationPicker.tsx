import { Profiles } from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { View, ViewProps } from "react-native";
import { Text } from "react-native-paper";

import { AnimationsGrid } from "./animation";
import { SortMode, SortButton } from "./buttons";

import { useAnimationsList } from "~/hooks";

export function AnimationPicker({
  animation,
  onSelectAnimation,
  ...props
}: {
  animation?: Readonly<Profiles.Animation>;
  onSelectAnimation?: (animation: Readonly<Profiles.Animation>) => void;
} & ViewProps) {
  const animations = useAnimationsList();
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
