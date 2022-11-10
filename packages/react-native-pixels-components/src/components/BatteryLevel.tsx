import { Fontisto } from "@expo/vector-icons";
import {
  PercentageDisplayComponent,
  IconParams,
} from "@systemic-games/react-native-base-components";
import { Center, HStack, Text, usePropsResolution } from "native-base";
import { SizeType } from "native-base/lib/typescript/components/types";
import React from "react";

interface BatteryLevelProps {
  percentage: number;
  iconSize?: SizeType;
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
  return (
    <Center>
      <HStack space={2} alignItems="center">
        <PercentageDisplayComponent
          icons={icons}
          colors={resolvedProps.colors}
          percentage={resolvedProps.percentage}
          size={resolvedProps.iconSize}
        />
        <Text>{resolvedProps.percentage + "%"}</Text>
      </HStack>
    </Center>
  );
}
