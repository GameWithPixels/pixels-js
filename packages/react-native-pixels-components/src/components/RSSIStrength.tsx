import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  PercentageDisplay,
  IconParams,
} from "@systemic-games/react-native-base-components";
import {
  IIconProps,
  ITextProps,
  Text,
  View,
  usePropsResolution,
} from "native-base";
import { IViewProps } from "native-base/lib/typescript/components/basic/View/types";

/**
 * Props for {@link RSSIStrength} component.
 */
interface RSSIStrengthProps extends IViewProps {
  percentage: number; // current rssi strength value (from 0 to 1)
  _text?: Partial<ITextProps>; // parameters for styling battery level text size
  _icon?: Partial<IIconProps>; // parameter fro styling battery icon size
  // TODO size?: keyof typeof PixelTheme["components"]["BatteryLevel"]["sizes"]; // sizes possibilities for RSSIStrength component
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
  const { percentage, _text, _icon, colors, ...flexProps } = usePropsResolution(
    "RSSIStrength",
    props
  );
  const rssiStrength = 100 + percentage;
  return (
    <View
      flexDir="row"
      alignItems="center"
      justifyContent="center"
      {...flexProps}
    >
      <PercentageDisplay
        icons={icons}
        colors={colors}
        percentage={rssiStrength}
        _icon={_icon}
      />
      <Text {..._text} ml={2}>
        {rssiStrength + "%"}
      </Text>
    </View>
  );
}
