import { range } from "@systemic-games/pixels-core-utils";
import React from "react";
import { View } from "react-native";

import { AnimationCard } from "./AnimationCard";
import { AnimationsListProps } from "./AnimationsList";

function AnimationsColumn({
  animations,
  dieType,
  selected,
  onSelectAnimation,
  style,
  ...props
}: AnimationsListProps) {
  return (
    <View key="anim-column" style={[{ flex: 1, gap: 10 }, style]} {...props}>
      {animations.map((a, i) => (
        <AnimationCard
          key={i} // Using the index rather than the UUID lets react re-use the component when switching animations
          animation={a}
          dieType={dieType ?? "d20"}
          selected={a === selected}
          fadeInDuration={300}
          fadeInDelay={i * 50}
          onPress={() => onSelectAnimation?.(a)}
        />
      ))}
    </View>
  );
}

export function AnimationsGrid({
  animations,
  dieType,
  numColumns = 2,
  selected,
  onSelectAnimation,
  style,
  ...props
}: {
  numColumns?: number;
} & AnimationsListProps) {
  return (
    <View style={[{ flexDirection: "row", gap: 10 }, style]} {...props}>
      {range(numColumns).map((col) => (
        <AnimationsColumn
          key={col}
          animations={animations.filter((_, i) => i % numColumns === col)}
          dieType={dieType}
          selected={selected}
          onSelectAnimation={onSelectAnimation}
        />
      ))}
    </View>
  );
}
