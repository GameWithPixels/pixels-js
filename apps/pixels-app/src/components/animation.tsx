import { range } from "@systemic-games/pixels-core-utils";
import {
  PixelDieType,
  Profiles,
} from "@systemic-games/react-native-pixels-connect";
import { observer } from "mobx-react-lite";
import React from "react";
import { View, ViewProps } from "react-native";
import { MD3Theme, Text, useTheme } from "react-native-paper";
import Animated, { FadeIn } from "react-native-reanimated";

import { AnimationDieRenderer } from "./AnimationDieRenderer";
import { TouchableCardProps, TouchableCard } from "./TouchableCard";

import GradientIcon from "#/icons/animations/gradient";
import PaletteIcon from "#/icons/animations/palette";
import { AnimationUtils } from "~/features/store/library/AnimationUtils";

const AnimationName = observer(function AnimationName({
  animation,
  colors,
  disabled,
}: {
  animation: Readonly<Profiles.Animation>;
  colors: MD3Theme["colors"];
  disabled?: boolean;
}) {
  const color = disabled ? colors.onSurfaceDisabled : colors.onSurface;
  return (
    <Text numberOfLines={1} style={{ color }} variant="titleMedium">
      {animation.name}
    </Text>
  );
});

export function AnimationCard({
  animation,
  dieType,
  row,
  disabled,
  fadeInDuration,
  fadeInDelay,
  style,
  contentStyle,
  ...props
}: {
  animation: Readonly<Profiles.Animation>;
  dieType: PixelDieType;
  row?: boolean;
  fadeInDuration?: number;
  fadeInDelay?: number;
} & Omit<TouchableCardProps, "children">) {
  const iconStyle = {
    position: "absolute",
    top: row ? "auto" : 5,
    left: row ? 10 : 5,
  } as const;
  const { colors } = useTheme();
  return (
    <Animated.View
      entering={FadeIn.duration(fadeInDuration ?? 250).delay(fadeInDelay ?? 0)}
    >
      <TouchableCard
        row={row}
        disabled={disabled}
        style={style}
        contentStyle={[{ paddingTop: 0, gap: row ? 20 : 0 }, contentStyle]}
        {...props}
      >
        <View style={{ width: row ? 70 : 100, aspectRatio: 1, padding: 10 }}>
          <AnimationDieRenderer animation={animation} dieType={dieType} />
        </View>
        <AnimationName
          animation={animation}
          colors={colors}
          disabled={disabled}
        />
        {AnimationUtils.hasEditableColor(animation) ? (
          <PaletteIcon size={20} color={colors.onSurface} style={iconStyle} />
        ) : AnimationUtils.hasEditableGradient(animation) ? (
          <GradientIcon size={20} color={colors.onSurface} style={iconStyle} />
        ) : null}
      </TouchableCard>
    </Animated.View>
  );
}

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
