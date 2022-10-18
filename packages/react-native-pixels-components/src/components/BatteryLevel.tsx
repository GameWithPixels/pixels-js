import { Fontisto } from "@expo/vector-icons";
import {
  PercentageDisplayComponent,
  IconParams,
} from "@systemic-games/react-native-base-components";
import { Center, usePropsResolution } from "native-base";
import { SizeType } from "native-base/lib/typescript/components/types";

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
      <PercentageDisplayComponent
        icons={icons}
        colors={resolvedProps.colors}
        percentage={resolvedProps.percentage}
        size={resolvedProps.iconSize}
      />
    </Center>
  );
}
