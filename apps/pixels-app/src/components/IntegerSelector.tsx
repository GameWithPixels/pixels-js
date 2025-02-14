import { range } from "@systemic-games/pixels-core-utils";
import React from "react";
import { View, ViewProps } from "react-native";

import { NumberInputButton } from "./SliderWithValue";
import { ToggleButton } from "./buttons";

export function IntegerSelector({
  value,
  onValueChange,
  minimumValue = 0,
  maximumValue,
  buttonsStartValue,
  buttonsEndValue,
  style,
  ...props
}: {
  value: number;
  minimumValue?: number;
  maximumValue?: number;
  buttonsStartValue: number;
  buttonsEndValue: number;
  onValueChange?: (value: number) => void;
} & ViewProps) {
  const start = Math.max(minimumValue, buttonsStartValue);
  const end = maximumValue
    ? Math.min(maximumValue, buttonsEndValue)
    : Math.max(start + 1, buttonsEndValue);
  return (
    <View
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        },
        style,
      ]}
      {...props}
    >
      {range(start, end).map((i) => (
        <ToggleButton
          key={i}
          selected={value === i}
          style={{ minWidth: `${100 / (end - start + 2)}%` }}
          labelStyle={{ marginHorizontal: 0 }}
          onPress={() => onValueChange?.(i)}
        >
          {i}
        </ToggleButton>
      ))}
      <NumberInputButton
        value={value}
        minimumValue={minimumValue}
        maximumValue={maximumValue}
        onEndEditing={
          onValueChange
            ? (v) => {
                v !== value && onValueChange(v);
              }
            : undefined
        }
        button={({ label, onPress }) => (
          <ToggleButton
            selected={value >= end}
            style={{ minWidth: `${100 / (end - start + 2)}%` }}
            labelStyle={{ marginHorizontal: 0 }}
            onPress={onPress}
          >
            {value >= end ? label : `${end}+`}
          </ToggleButton>
        )}
      />
    </View>
  );
}
