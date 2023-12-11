import { MaterialCommunityIcons } from "@expo/vector-icons";
import { assertNever } from "@systemic-games/pixels-core-utils";
import { getBorderRadius } from "@systemic-games/react-native-base-components";
import React from "react";
import { View, ViewProps } from "react-native";
import { Text, useTheme } from "react-native-paper";

import { SliderWithValue } from "~/components/SliderWithTitle";
import { makeTransparent } from "~/components/utils";
import { useConfirmActionSheet } from "~/hooks";

export interface AnimationOverrides {
  duration: number;
  repeatCount: number;
  color: string;
  fadingSharpness: number;
}

export type AnimationOverrideName = keyof AnimationOverrides;

export const AnimationOverrideNames: readonly AnimationOverrideName[] = [
  "duration",
  "repeatCount",
  "color",
  "fadingSharpness",
] as const;

export function getAnimationOverrideUserName(
  name: AnimationOverrideName
): string {
  switch (name) {
    case "duration":
      return "Duration";
    case "repeatCount":
      return "Repeat Count";
    case "color":
      return "Color";
    case "fadingSharpness":
      return "Fading Sharpness";
    default:
      assertNever(name);
  }
}

export function createAnimationOverride(
  name: AnimationOverrideName
): Partial<AnimationOverrides> {
  switch (name) {
    case "duration":
      return { duration: 3 };
    case "repeatCount":
      return { repeatCount: 1 };
    case "color":
      return { color: "orange" };
    case "fadingSharpness":
      return { fadingSharpness: 0.5 };
    default:
      assertNever(name);
  }
}

export function EditAnimationOverrides({
  overrides,
  onChangeOverrides,
  style,
  ...props
}: {
  overrides: Partial<AnimationOverrides>;
  onChangeOverrides?: (overrides: Partial<AnimationOverrides>) => void;
} & ViewProps) {
  const showConfirmRemove = useConfirmActionSheet("Remove");
  const { colors, roundness } = useTheme();
  const borderRadius = getBorderRadius(roundness, { tight: true });
  return (
    <View style={[{ gap: 10 }, style]} {...props}>
      {AnimationOverrideNames.map((name) => ({
        name,
        value: overrides[name],
      }))
        .filter(({ value }) => !!value)
        .map(({ name, value }) => (
          <View key={name}>
            <Text>{getAnimationOverrideUserName(name)}</Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 20,
              }}
            >
              <View style={{ flexGrow: 1 }}>
                {typeof value === "string" ? (
                  <View
                    style={{
                      height: 40,
                      borderRadius,
                      backgroundColor: "orange",
                    }}
                  />
                ) : (
                  <SliderWithValue
                    value={value}
                    minimumValue={1}
                    maximumValue={15}
                    step={1}
                    onValueChange={() =>
                      onChangeOverrides?.({ ...overrides, [name]: value })
                    }
                  />
                )}
              </View>
              <MaterialCommunityIcons
                name="trash-can-outline"
                size={24}
                color={makeTransparent(colors.onBackground, 0.5)}
                onPress={() =>
                  showConfirmRemove(
                    `Remove ${getAnimationOverrideUserName(name)} Override`,
                    () => {
                      const { [name]: _, ...copy } = overrides;
                      return copy;
                    }
                  )
                }
              />
            </View>
          </View>
        ))}
    </View>
  );
}
