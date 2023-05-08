import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  PercentageDisplay,
  FastHStack,
  IconComponent,
  IconComponentProps,
  FastFlexProps,
} from "@systemic-games/react-native-base-components";
import { Text, TextProps } from "react-native-paper";

/**
 * Props for {@link RSSIStrength} component.
 */
interface RSSIStrengthProps extends FastFlexProps {
  strength: number;
  iconSize?: number;
  showText?: boolean;
  _text?: Omit<TextProps<string>, "children">; // parameters for styling battery level text size
}

// RSSI level icons to display from min to max as required by PercentageDisplay
const icons: IconComponent[] = [
  (p: IconComponentProps) => (
    <MaterialCommunityIcons {...p} name="signal-off" />
  ),
  (p: IconComponentProps) => (
    <MaterialCommunityIcons {...p} name="signal-cellular-1" />
  ),
  (p: IconComponentProps) => (
    <MaterialCommunityIcons {...p} name="signal-cellular-2" />
  ),
  (p: IconComponentProps) => (
    <MaterialCommunityIcons {...p} name="signal-cellular-2" />
  ),
  (p: IconComponentProps) => (
    <MaterialCommunityIcons {...p} name="signal-cellular-3" />
  ),
];

/**
 * A RSSI strength component tha display current rssi strength with responsive icons, colors and percentage value.
 * @param props See {@link RSSIStrengthProps} for props parameters
 */
export function RSSIStrength({
  strength,
  iconSize,
  showText,
  _text,
  ...flexProps
}: RSSIStrengthProps) {
  const percent = 100 + strength;
  return showText ? (
    <FastHStack
      alignItems="center"
      justifyContent="center"
      gap={3}
      {...flexProps}
    >
      <PercentageDisplay percent={percent} icons={icons} iconSize={iconSize} />
      <Text {..._text}>{percent + "%"}</Text>
    </FastHStack>
  ) : (
    <PercentageDisplay percent={percent} icons={icons} iconSize={iconSize} />
  );
}
