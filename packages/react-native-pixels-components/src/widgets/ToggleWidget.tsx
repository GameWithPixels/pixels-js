import {
  BaseStyles,
  BaseFlexProps,
  BaseHStack,
} from "@systemic-games/react-native-base-components";
import React from "react";
import { View } from "react-native";
import { Switch, SwitchProps, Text } from "react-native-paper";

/**
 * Props for {@link Toggle} component.
 */
export interface ToggleProps
  extends Pick<SwitchProps, "value" | "onValueChange">,
    BaseFlexProps {
  title?: string; // Text displayed on the left of the toggle
}

/**
 * Toggle component to display a toggle with an icon and/or text.
 * Use OnValueChangeProps in order to get toggle events.
 * @param props See {@link ToggleProps} for props parameters.
 */
export function ToggleWidget({
  title,
  value,
  onValueChange,
  ...flexProps
}: ToggleProps) {
  return (
    <BaseHStack {...flexProps}>
      <Text variant="titleMedium">{title}</Text>
      <View style={BaseStyles.spacer} />
      <Switch value={value} onValueChange={onValueChange} />
    </BaseHStack>
  );
}
