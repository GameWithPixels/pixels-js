import { range } from "@systemic-games/pixels-core-utils";
import { createDataSetForAnimation } from "@systemic-games/pixels-edit-animation";
import {
  PixelDieType,
  Profiles,
} from "@systemic-games/react-native-pixels-connect";
import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import React from "react";
import { View, ViewProps } from "react-native";
import { MD3Theme, Text, useTheme } from "react-native-paper";
import Animated, { FadeIn } from "react-native-reanimated";

import { TouchableCardProps, TouchableCard } from "./TouchableCard";
import { getTextColorStyle } from "./colors";

import { DieRendererWithFocus } from "~/features/render3d/DieRenderer";

const AnimationName = observer(function AnimationName({
  animation,
  colors,
  disabled,
}: {
  animation: Readonly<Profiles.Animation>;
  colors: MD3Theme["colors"];
  disabled?: boolean;
}) {
  const textStyle = getTextColorStyle(colors, disabled);
  return (
    <Text numberOfLines={1} style={textStyle} variant="titleMedium">
      {animation.name}
    </Text>
  );
});

export const AnimationDieRenderer = observer(function ActionDieRenderer({
  animation,
  dieType,
}: {
  animation: Readonly<Profiles.Animation>;
  dieType: PixelDieType;
}) {
  const animationsData = React.useMemo(
    () =>
      computed(() => {
        const dataSet = createDataSetForAnimation(animation).toDataSet();
        return {
          animations: dataSet.animations,
          bits: dataSet.animationBits,
        };
      }),
    [animation]
  ).get();
  return (
    <DieRendererWithFocus
      dieType={dieType}
      colorway="onyxBlack"
      animationsData={animationsData}
    />
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
        {/* <FavoriteIcon
          style={{
            position: "absolute",
            top: row ? "auto" : 5,
            right: row ? 10 : 5,
          }}
          size={20}
          color={getIconColor(colors, disabled)}
        /> */}
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
    <View {...props}>
      {animations.map((a, i) => (
        <AnimationCard
          key={a.uuid}
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
    <View style={[{ flex: 1, gap: 10 }, style]} {...props}>
      {animations.map((a, i) => (
        <AnimationCard
          key={a.uuid}
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
