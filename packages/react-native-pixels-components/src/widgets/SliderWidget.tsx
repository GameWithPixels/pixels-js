import Slider, { SliderProps } from "@react-native-community/slider";
import {
  BaseStyles,
  FastFlexProps,
  FastHStack,
  FastVStack,
  RoundedBox,
} from "@systemic-games/react-native-base-components";
import React from "react";
import { Text, useTheme } from "react-native-paper";

export interface SliderWidgetProps
  extends Pick<SliderProps, "minimumValue" | "maximumValue" | "step">,
    FastFlexProps {
  title: string;
  value: number;
  unitType?: string;
  onValueChange?: (value: number) => void;
}

export function SliderWidget({
  title,
  value,
  step,
  minimumValue,
  maximumValue,
  unitType,
  onValueChange,
  ...flexProps
}: SliderWidgetProps) {
  const valueStr = step && step < 1 ? value.toFixed(3) : value.toString();
  const theme = useTheme();
  return (
    <FastVStack {...flexProps}>
      <Text variant="titleMedium">{title}</Text>
      <FastHStack alignItems="center">
        <Slider
          style={BaseStyles.spacer}
          thumbTintColor={theme.colors.primary}
          minimumTrackTintColor={theme.colors.secondaryContainer}
          maximumTrackTintColor={theme.colors.primaryContainer}
          step={step}
          minimumValue={minimumValue}
          maximumValue={maximumValue}
          value={value}
          onValueChange={onValueChange}
        />
        <RoundedBox border p={10} minWidth={100} alignItems="center">
          <Text>{unitType ? valueStr + unitType : valueStr}</Text>
        </RoundedBox>
      </FastHStack>
    </FastVStack>
  );
}
