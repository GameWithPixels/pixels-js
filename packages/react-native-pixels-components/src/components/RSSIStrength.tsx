import { MaterialCommunityIcons } from "@expo/vector-icons";
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

interface RSSIStrengthProps {
  percentage: number;
  _text?: Partial<ITextProps>;
  _icon?: Partial<IIconProps>;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
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
            _icon={resolvedProps._icon}
          />
        </Box>
        <Text {...resolvedProps._text}>{rssiStrength + "%"}</Text>
      </HStack>
    </Center>
  );
}
