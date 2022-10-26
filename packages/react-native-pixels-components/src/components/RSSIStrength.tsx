import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  PercentageDisplayComponent,
  IconParams,
} from "@systemic-games/react-native-base-components";
import { Center, HStack, Text, usePropsResolution } from "native-base";
import { SizeType } from "native-base/lib/typescript/components/types";

interface PercentageDisplayProps {
  percentage: number;
  iconSize?: SizeType;
}

// RSSI level icons to display from min to max as required by PercentageDisplay
const icons: IconParams[] = [
  { category: MaterialCommunityIcons, iconName: "signal-off" },
  { category: MaterialCommunityIcons, iconName: "signal-cellular-1" },
  { category: MaterialCommunityIcons, iconName: "signal-cellular-2" },
  { category: MaterialCommunityIcons, iconName: "signal-cellular-2" },
  { category: MaterialCommunityIcons, iconName: "signal-cellular-3" },
];

export function RSSIStrength(props: PercentageDisplayProps) {
  const resolvedProps = usePropsResolution("RSSIStrength", props);
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
