import { Fontisto } from "@expo/vector-icons";
import {
  PercentageDisplay,
  IconParams,
  FastHStack,
} from "@systemic-games/react-native-base-components";
import {
  Center,
  IFlexProps,
  IIconProps,
  ITextProps,
  Text,
  usePropsResolution,
} from "native-base";
import React from "react";

/**
 * Props for {@link BatteryLevel} component.
 */
interface BatteryLevelProps extends IFlexProps {
  percentage: number; // current battery percentage value (between 0 and 1)
  isCharging?: boolean;
  _text?: Partial<ITextProps>; // parameters for styling battery level text size
  _icon?: Partial<IIconProps>; // parameter fro styling battery icon size
  // TODO size?: keyof typeof PixelTheme["components"]["BatteryLevel"]["sizes"]; // sizes possibilities for BatteryLevel component
}

// Battery icons to display from empty to full as required by PercentageDisplay
const icons: IconParams[] = [
  { category: Fontisto, iconName: "battery-empty" },
  { category: Fontisto, iconName: "battery-quarter" },
  { category: Fontisto, iconName: "battery-half" },
  { category: Fontisto, iconName: "battery-three-quarters" },
  { category: Fontisto, iconName: "battery-full" },
];

/**
 * A battery level component that display current battery level with responsive icons, colors and percentage value.
 * @param props See {@link BatteryLevelProps} for props parameters.
 */
export function BatteryLevel(props: BatteryLevelProps) {
  const { percentage, isCharging, _text, _icon, colors, ...flexProps } =
    usePropsResolution("BatteryLevel", props);
  return (
    <Center {...flexProps}>
      <FastHStack alignItems="center" w="100%">
        <PercentageDisplay
          _icon={_icon}
          icons={icons}
          colors={colors}
          percentage={percentage}
        />
        <Text {..._text} ml={3}>
          {isCharging ? "⚡" : ""}
          {percentage + "%"}
        </Text>
      </FastHStack>
    </Center>
  );
}
