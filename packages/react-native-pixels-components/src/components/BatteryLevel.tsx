import { Fontisto } from "@expo/vector-icons";
import {
  PercentageDisplay,
  BaseHStack,
  IconComponent,
  IconComponentProps,
  BaseFlexProps,
} from "@systemic-games/react-native-base-components";
import React from "react";
import { Text, TextProps } from "react-native-paper";

/**
 * Props for {@link BatteryLevel} component.
 */
interface BatteryLevelProps extends BaseFlexProps {
  level: number; // current battery percentage value (between 0 and 1)
  isCharging?: boolean;
  iconSize?: number;
  showText?: boolean;
  _text?: Omit<TextProps<string>, "children">; // parameters for styling battery level text size
}

// Battery icons to display from empty to full as required by PercentageDisplay
const icons: IconComponent[] = [
  (p: IconComponentProps) => <Fontisto {...p} name="battery-empty" />,
  (p: IconComponentProps) => <Fontisto {...p} name="battery-quarter" />,
  (p: IconComponentProps) => <Fontisto {...p} name="battery-half" />,
  (p: IconComponentProps) => <Fontisto {...p} name="battery-three-quarters" />,
  (p: IconComponentProps) => <Fontisto {...p} name="battery-full" />,
];

/**
 * A battery level component that display current battery level with responsive icons, colors and percentage value.
 * @param props See {@link BatteryLevelProps} for props parameters.
 */
export function BatteryLevel({
  level,
  isCharging,
  iconSize,
  showText,
  _text,
  ...flexProps
}: BatteryLevelProps) {
  return (
    <BaseHStack
      alignItems="center"
      justifyContent="center"
      gap={3}
      {...flexProps}
    >
      <PercentageDisplay percent={level} icons={icons} iconSize={iconSize} />
      <Text {..._text}>{isCharging ? "⚡" : ""}</Text>
      {showText && <Text {..._text}>{level + "%"}</Text>}
    </BaseHStack>
  );
}
