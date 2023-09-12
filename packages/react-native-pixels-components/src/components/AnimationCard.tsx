import {
  BaseStyles,
  expandShorthandStyle,
  BaseBoxProps,
  BaseHStack,
  BaseVStack,
} from "@systemic-games/react-native-base-components";
import React from "react";
import { View, FlexStyle } from "react-native";
import {
  Text,
  TouchableRipple,
  TouchableRippleProps,
} from "react-native-paper";

export interface AnimationCardProps extends BaseBoxProps {
  title: string;
  name?: string;
  onPress?: TouchableRippleProps["onPress"];
  dieRenderer?: () => React.ReactNode;
  dieViewSize?: FlexStyle["width"];
  contentGap?: FlexStyle["gap"];
  infoGap?: FlexStyle["gap"];
}

export function AnimationCard({
  children,
  title,
  name,
  onPress,
  dieRenderer,
  dieViewSize = "100%",
  contentGap = 10,
  infoGap = 10,
  ...flexProps
}: AnimationCardProps) {
  return (
    <TouchableRipple style={expandShorthandStyle(flexProps)} onPress={onPress}>
      <BaseHStack w="100%" h="100%" gap={contentGap}>
        {/* Die render */}
        {dieRenderer && (
          <View style={{ height: dieViewSize, aspectRatio: 1 }}>
            {dieRenderer()}
          </View>
        )}
        {/* Animation info */}
        <BaseVStack justifyContent="center" gap={infoGap}>
          <Text variant="headlineSmall">{name}</Text>
          <Text style={BaseStyles.italic}>{title}</Text>
        </BaseVStack>
        {children}
      </BaseHStack>
    </TouchableRipple>
  );
}
