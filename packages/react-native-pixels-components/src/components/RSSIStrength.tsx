import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  PercentageDisplayComponent,
  IconParams,
} from "@systemic-games/react-native-base-components";
import { Box, Center, HStack, Text, usePropsResolution } from "native-base";
import { SizeType } from "native-base/lib/typescript/components/types";

interface RSSIStrengthProps {
  percentage: number;
  textSize?: SizeType;
  iconSize: number;
}

// RSSI level icons to display from min to max as required by PercentageDisplay
const icons: IconParams[] = [
  { category: MaterialCommunityIcons, iconName: "signal-off" },
  { category: MaterialCommunityIcons, iconName: "signal-cellular-1" },
  { category: MaterialCommunityIcons, iconName: "signal-cellular-2" },
  { category: MaterialCommunityIcons, iconName: "signal-cellular-2" },
  { category: MaterialCommunityIcons, iconName: "signal-cellular-3" },
];

export function RSSIStrength(props: RSSIStrengthProps) {
  const resolvedProps = usePropsResolution("RSSIStrength", props);
  const rssiStrength = 100 + resolvedProps.percentage;
  return (
    <Center flex={1}>
      <HStack space={2} alignItems="center" w="100%">
        <Box>
          <PercentageDisplayComponent
            icons={icons}
            colors={resolvedProps.colors}
            percentage={rssiStrength}
            size={resolvedProps.iconSize}
          />
        </Box>
        <Text bold fontSize={resolvedProps.textSize}>
          {rssiStrength + "%"}
        </Text>
      </HStack>
    </Center>
  );
}
