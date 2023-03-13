import { Fontisto } from "@expo/vector-icons";
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
import React from "react";

/**
 * Props for {@link BatteryLevel} component.
 */
interface BatteryLevelProps extends IViewProps {
  percentage: number; // current battery percentage value (between 0 and 1)
  isCharging?: boolean;
  _text?: Partial<ITextProps>; // parameters for styling battery level text size
  _icon?: Partial<IIconProps>; // parameter fro styling battery icon size
  // TODO size?: keyof typeof PixelTheme["components"]["BatteryLevel"]["sizes"]; // sizes possibilities for BatteryLevel component
}

// Battery icons to display from empty to full as required by PercentageDisplay
const icons: IconParams[] = [
  { category: Fontisto, iconName: "battery-empty" },
  { category: Fontisto, iconName: "battery-quarter" },
  { category: Fontisto, iconName: "battery-half" },
  { category: Fontisto, iconName: "battery-three-quarters" },
  { category: Fontisto, iconName: "battery-full" },
];

/**
 * A battery level component that display current battery level with responsive icons, colors and percentage value.
 * @param props See {@link BatteryLevelProps} for props parameters.
 */
export function BatteryLevel(props: BatteryLevelProps) {
  const { percentage, isCharging, _text, _icon, colors, ...flexProps } =
    usePropsResolution("BatteryLevel", props);
  return (
    <View
      flexDir="row"
      alignItems="center"
      justifyContent="center"
      {...flexProps}
    >
      <PercentageDisplay
        _icon={_icon}
        icons={icons}
        colors={colors}
        percentage={percentage}
      />
      <Text {..._text} ml={3}>
        {isCharging ? "⚡" : ""}
        {percentage + "%"}
      </Text>
    </View>
  );
}
