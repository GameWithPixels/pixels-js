import { assertNever } from "@systemic-games/pixels-core-utils";
import { PixelDieType } from "@systemic-games/react-native-pixels-connect";
import { Image } from "expo-image";
import { ColorValue, View } from "react-native";
import { useTheme } from "react-native-paper";

import { getIconColor } from "./colors";

import BarsFullIcon from "#/icons/dice/bars-full";
import BarsLowIcon from "#/icons/dice/bars-low";
import BarsMidIcon from "#/icons/dice/bars-mid";
import BarsWeakIcon from "#/icons/dice/bars-weak";
import BatteryEmptyIcon from "#/icons/dice/battery-empty";
import BatteryEmptyChargingIcon from "#/icons/dice/battery-empty-charging";
import BatteryFullIcon from "#/icons/dice/battery-full";
import BatteryFullChargingIcon from "#/icons/dice/battery-full-charging";
import BatteryHalfIcon from "#/icons/dice/battery-half";
import BatteryHalfChargingIcon from "#/icons/dice/battery-half-charging";
import BatteryLowIcon from "#/icons/dice/battery-low";
import BatteryLowChargingIcon from "#/icons/dice/battery-low-charging";
import BatteryQuarterIcon from "#/icons/dice/battery-quarter";
import BatteryQuarterChargingIcon from "#/icons/dice/battery-quarter-charging";
import BatteryThreeQuartersIcon from "#/icons/dice/battery-three-quarters";
import BatteryThreeQuartersChargingIcon from "#/icons/dice/battery-three-quarters-charging";

export interface IconProps {
  size: number;
  disabled?: boolean;
  color?: ColorValue;
}

export function RssiIcon({
  value,
  size,
  disabled,
  color,
}: IconProps & { value?: number }) {
  const { colors } = useTheme();
  const Icon =
    !value || value < -70
      ? BarsWeakIcon
      : value < -60
        ? BarsLowIcon
        : value < -50
          ? BarsMidIcon
          : BarsFullIcon;
  return (
    <Icon
      size={size}
      color={
        color ??
        (!value || value < -70 ? "red" : getIconColor(colors, disabled))
      }
      shadedColor={colors.onSurfaceDisabled}
    />
  );
}

function getBatteryIcon(value?: number) {
  return !value
    ? BatteryEmptyIcon
    : value < 20
      ? BatteryLowIcon
      : value < 40
        ? BatteryQuarterIcon
        : value < 70
          ? BatteryHalfIcon
          : value < 95
            ? BatteryThreeQuartersIcon
            : BatteryFullIcon;
}

function getChargingBatteryIcon(value?: number) {
  return !value
    ? BatteryEmptyChargingIcon
    : value < 20
      ? BatteryLowChargingIcon
      : value < 40
        ? BatteryQuarterChargingIcon
        : value < 70
          ? BatteryHalfChargingIcon
          : value < 95
            ? BatteryThreeQuartersChargingIcon
            : BatteryFullChargingIcon;
}

export function BatteryIcon({
  value,
  charging,
  size,
  disabled,
  color,
}: IconProps & { value?: number; charging?: boolean }) {
  const { colors } = useTheme();
  const Icon = charging ? getChargingBatteryIcon(value) : getBatteryIcon(value);
  return (
    <Icon
      size={size}
      color={
        color ??
        (disabled
          ? getIconColor(colors, true)
          : !value || value < 20
            ? "red"
            : getIconColor(colors))
      }
      lightningColor="gold"
    />
  );
}

export function DieWireframe({
  dieType,
  size,
  disabled,
}: {
  dieType: PixelDieType;
  size?: number;
  disabled?: boolean;
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
  return (
    <View style={{ width: size, height: size }}>
      <Image
        contentFit="cover"
        style={{ flex: 1 }}
        source={getImage()}
        blurRadius={disabled ? 1.5 : undefined}
      />
    </View>
  );
}
