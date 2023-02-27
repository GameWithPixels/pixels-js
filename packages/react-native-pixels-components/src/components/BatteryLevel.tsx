import { Fontisto } from "@expo/vector-icons";
import {
  PercentageDisplay,
  IconParams,
} from "@systemic-games/react-native-base-components";
import {
  Box,
  Center,
  HStack,
  IIconProps,
  ITextProps,
  Text,
  usePropsResolution,
} from "native-base";
import React from "react";

import { PixelTheme } from "../theme";

/**
 * Props for {@link BatteryLevel} component.
 */
interface BatteryLevelProps {
  percentage: number; // current battery percentage value (between 0 and 1)
  isCharging?: boolean;
  _text?: Partial<ITextProps>; // parameters for styling battery level text size
  _icon?: Partial<IIconProps>; // parameter fro styling battery icon size
  size?: keyof typeof PixelTheme["components"]["BatteryLevel"]["sizes"]; // sizes possibilities for BatteryLevel component
  // size?: "sm" | "md" | "lg" | "xl" | "2xl";
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
  const resolvedProps = usePropsResolution("BatteryLevel", props);
  return (
    <Center>
      <HStack space={3} alignItems="center" w="100%">
        <Box>
          <PercentageDisplay
            _icon={resolvedProps._icon}
            icons={icons}
            colors={resolvedProps.colors}
            percentage={resolvedProps.percentage}
          />
        </Box>
        <Text {...resolvedProps._text}>
          {resolvedProps.isCharging ? "⚡" : ""}
          {resolvedProps.percentage + "%"}
        </Text>
      </HStack>
    </Center>
  );
}
