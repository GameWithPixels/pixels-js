import { range } from "@systemic-games/pixels-core-utils";
import {
  PixelDieType,
  Profiles,
} from "@systemic-games/react-native-pixels-connect";
import { View, ViewProps } from "react-native";
import { Text, useTheme } from "react-native-paper";
import Animated, { FadeIn } from "react-native-reanimated";

import { TouchableCardProps, TouchableCard } from "./TouchableCard";
import { getTextColorStyle } from "./utils";

import { DieRenderer } from "~/features/render3d/DieRenderer";
import { useAnimation } from "~/hooks";

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
  animation: Profiles.Animation;
  dieType: PixelDieType;
  row?: boolean;
  fadeInDuration?: number;
  fadeInDelay?: number;
} & Omit<TouchableCardProps, "children">) {
  const { name } = useAnimation(animation);
  const { colors } = useTheme();
  const textStyle = getTextColorStyle(colors, disabled);
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
          <DieRenderer dieType={dieType} colorway="midnightGalaxy" />
        </View>
        <Text numberOfLines={1} style={textStyle} variant="titleMedium">
          {name}
        </Text>
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
  animations: Profiles.Animation[];
  selected?: Profiles.Animation;
  onSelectAnimation?: (animation: Profiles.Animation) => void;
}

export function AnimationsList({
  animations,
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
          dieType="d20"
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
          dieType="d20"
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
          selected={selected}
          onSelectAnimation={onSelectAnimation}
        />
      ))}
    </View>
  );
}
