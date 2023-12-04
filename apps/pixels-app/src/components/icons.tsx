import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { PixelDieType } from "@systemic-games/pixels-core-connect";
import { assertNever } from "@systemic-games/pixels-core-utils";
import { Image } from "expo-image";
import { ColorValue, TextProps, View, ViewProps } from "react-native";
import { useTheme } from "react-native-paper";

import { getIconColor } from "./utils";

import BarsFullIcon from "#/icons/dice/bars-full";
import BarsLowIcon from "#/icons/dice/bars-low";
import BarsMidIcon from "#/icons/dice/bars-mid";
import BarsWeakIcon from "#/icons/dice/bars-weak";
import BatteryEmptyIcon from "#/icons/dice/battery-empty";
import BatteryFullIcon from "#/icons/dice/battery-full";
import BatteryHalfIcon from "#/icons/dice/battery-half";
import BatteryLowIcon from "#/icons/dice/battery-low";
import BatteryQuarterIcon from "#/icons/dice/battery-quarter";
import BatteryThreeQuartersIcon from "#/icons/dice/battery-three-quarters";

export interface IconProps {
  size: number;
  disabled?: boolean;
  color?: ColorValue;
}

export function DieIcon({
  dieType,
  size,
  disabled,
  color,
  ...props
}: {
  dieType: PixelDieType;
} & IconProps &
  ViewProps) {
  const getIconName = () => {
    switch (dieType) {
      case "d4":
        return "dice-d4-outline";
      case "d6":
      case "d6pipped":
      case "d6fudge":
        return "dice-d6-outline";
      case "d8":
        return "dice-d8-outline";
      case "d00":
      case "d10":
        return "dice-d10-outline";
      case "d12":
        return "dice-d12-outline";
      case "d20":
        return "dice-d20-outline";
      default:
        return "crosshairs-question";
    }
  };
  const { colors } = useTheme();
  return (
    <MaterialCommunityIcons
      name={getIconName()}
      size={size}
      color={color ?? getIconColor(colors, disabled)}
      {...props}
    />
  );
}
export function RssiIcon({
  value,
  size,
  disabled,
  color,
}: IconProps & { value: number }) {
  const { colors } = useTheme();
  const Icon =
    value >= -50
      ? BarsFullIcon
      : value >= -60
      ? BarsMidIcon
      : value >= -70
      ? BarsLowIcon
      : BarsWeakIcon;
  return <Icon size={size} color={color ?? getIconColor(colors, disabled)} />;
}

export function BatteryIcon({
  value,
  size,
  disabled,
  color,
}: IconProps & { value: number }) {
  const { colors } = useTheme();
  const Icon =
    value >= 90
      ? BatteryFullIcon
      : value >= 70
      ? BatteryThreeQuartersIcon
      : value >= 40
      ? BatteryHalfIcon
      : value >= 20
      ? BatteryQuarterIcon
      : value >= 1
      ? BatteryLowIcon
      : BatteryEmptyIcon;
  return <Icon size={size} color={color ?? getIconColor(colors, disabled)} />;
}

export function getFavoriteIcon(isFavorite = true) {
  return ({
    size,
    color,
    ...props
  }: { size?: number; color?: string } & TextProps) => (
    <MaterialIcons
      name={isFavorite ? "favorite" : "favorite-outline"}
      size={size}
      color={color}
      {...props}
    />
  );
}

export function DieWireframe({
  size,
  dieType,
}: {
  size: number;
  dieType: PixelDieType;
}) {
  const getImage = () => {
    switch (dieType) {
      case "d4":
        return require("#/wireframes/d4.png");
      case "d6":
        return require("#/wireframes/d6.png");
      case "d6pipped":
        return require("#/wireframes/d6pipped.png");
      case "d6fudge":
        return require("#/wireframes/d6fudge.png");
      case "d8":
        return require("#/wireframes/d8.png");
      case "d10":
        return require("#/wireframes/d10.png");
      case "d00":
        return require("#/wireframes/d00.png");
      case "d12":
        return require("#/wireframes/d12.png");
      case "unknown":
      case "d20":
        return require("#/wireframes/d20.png");
      default:
        assertNever(dieType);
    }
  };
  const { colors } = useTheme();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size,
        backgroundColor: colors.onBackground,
      }}
    >
      <Image contentFit="cover" style={{ flex: 1 }} source={getImage()} />
    </View>
  );
}
