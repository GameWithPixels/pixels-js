import { Fontisto } from "@expo/vector-icons";
import {
  PercentageDisplayComponent,
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

interface BatteryLevelProps {
  percentage: number;
  isCharging?: boolean;
  _text?: Partial<ITextProps>;
  _icon?: Partial<IIconProps>;
  // size?: keyof typeof PixelTheme["components"]["BatteryLevel"]["sizes"];
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
}

// Battery icons to display from empty to full as required by PercentageDisplay
const icons: IconParams[] = [
  { category: Fontisto, iconName: "battery-empty" },
  { category: Fontisto, iconName: "battery-quarter" },
  { category: Fontisto, iconName: "battery-half" },
  { category: Fontisto, iconName: "battery-three-quarters" },
  { category: Fontisto, iconName: "battery-full" },
];

export function BatteryLevel(props: BatteryLevelProps) {
  const resolvedProps = usePropsResolution("BatteryLevel", props);
  const batteryLevel = resolvedProps.percentage * 100;
  return (
    <Center>
      <HStack space={3} alignItems="center" w="100%">
        <Box>
          <PercentageDisplayComponent
            _icon={resolvedProps._icon}
            icons={icons}
            colors={resolvedProps.colors}
            percentage={batteryLevel}
          />
        </Box>
        <Text {...resolvedProps._text}>{batteryLevel + "%"}</Text>
      </HStack>
    </Center>
  );
}
