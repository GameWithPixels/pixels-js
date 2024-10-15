import {
  PixelDieType,
  Profiles,
} from "@systemic-games/react-native-pixels-connect";
import { observer } from "mobx-react-lite";
import React from "react";
import { View } from "react-native";
import { MD3Theme, Text, useTheme } from "react-native-paper";
import Animated, { FadeIn } from "react-native-reanimated";

import { AnimationDieRenderer } from "./AnimationDieRenderer";
import { TouchableCardProps, TouchableCard } from "./TouchableCard";

import GradientIcon from "#/icons/animations/gradient";
import PaletteIcon from "#/icons/animations/palette";
import { AnimationUtils } from "~/features/store/library";

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
