import { Fontisto } from "@expo/vector-icons";
import {
  PercentageDisplayComponent,
  IconParams,
} from "@systemic-games/react-native-base-components";
import { Box, Center, HStack, Text, usePropsResolution } from "native-base";
import { SizeType } from "native-base/lib/typescript/components/types";
import React from "react";

interface BatteryLevelProps {
  percentage: number;
  isCharging?: boolean;
  textSize?: SizeType;
  iconSize: number;
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
            icons={icons}
            colors={resolvedProps.colors}
            percentage={batteryLevel}
            size={resolvedProps.iconSize}
          />
        </Box>
        {/* <ZStack alignItems={"center"} justifyItems="center">
          <Box>
            <PercentageDisplayComponent
              icons={icons}
              colors={resolvedProps.colors}
              percentage={batteryLevel}
              size={resolvedProps.iconSize}
            />
          </Box>
          {resolvedProps.isCharging && (
            <Icon
              as={MaterialCommunityIcons}
              name="lightning-bolt"
              color="black"
              size={10}
            />
          )}
        </ZStack> */}
        <Text bold fontSize={resolvedProps.textSize}>
          {batteryLevel + "%"}
        </Text>
      </HStack>
    </Center>
  );
}
