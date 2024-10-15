import {
  PixelDieType,
  Profiles,
} from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { View, ViewProps } from "react-native";

import { AnimationCard } from "./AnimationCard";

export interface AnimationsListProps extends ViewProps {
  animations: Readonly<Profiles.Animation>[];
  dieType?: PixelDieType;
  selected?: Readonly<Profiles.Animation>;
  onSelectAnimation?: (animation: Readonly<Profiles.Animation>) => void;
}

export function AnimationsList({
  animations,
  dieType,
  selected,
  onSelectAnimation,
  ...props
}: AnimationsListProps) {
  return (
    <View key="anim-list" {...props}>
      {animations.map((a, i) => (
        <AnimationCard
          key={i} // Using the index rather than the UUID lets react re-use the component when switching animations
          row
          animation={a}
          dieType={dieType ?? "d20"}
          selected={a === selected}
          noTopBorder={i > 0}
          squaredTopBorder={i > 0}
          squaredBottomBorder={i < animations.length - 1}
          fadeInDelay={i * 30}
          onPress={() => onSelectAnimation?.(a)}
        />
      ))}
    </View>
  );
}
