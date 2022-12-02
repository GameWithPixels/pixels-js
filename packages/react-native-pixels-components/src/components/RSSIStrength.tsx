import { MaterialCommunityIcons } from "@expo/vector-icons";
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

import { PixelTheme } from "../theme";

/**
 * Props for {@link RSSIStrength} component.
 */
interface RSSIStrengthProps {
  percentage: number; // current rssi strength value (from 0 to 1)
  _text?: Partial<ITextProps>; // parameters for styling battery level text size
  _icon?: Partial<IIconProps>; // parameter fro styling battery icon size
  size?: keyof typeof PixelTheme["components"]["BatteryLevel"]["sizes"]; // sizes possibilities for RSSIStrength component
  //size?: "sm" | "md" | "lg" | "xl" | "2xl";
}

// RSSI level icons to display from min to max as required by PercentageDisplay
const icons: IconParams[] = [
  { category: MaterialCommunityIcons, iconName: "signal-off" },
  { category: MaterialCommunityIcons, iconName: "signal-cellular-1" },
  { category: MaterialCommunityIcons, iconName: "signal-cellular-2" },
  { category: MaterialCommunityIcons, iconName: "signal-cellular-2" },
  { category: MaterialCommunityIcons, iconName: "signal-cellular-3" },
];

/**
 * A RSSI strength component tha display current rssi strength with responsive icons, colors and percentage value.
 * @param props See {@link RSSIStrengthProps} for props parameters
 */
export function RSSIStrength(props: RSSIStrengthProps) {
  const resolvedProps = usePropsResolution("RSSIStrength", props);
  const rssiStrength = 100 + resolvedProps.percentage;
  return (
    <Center flex={1}>
      <HStack space={2} alignItems="center" w="100%">
        <Box>
          <PercentageDisplay
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
