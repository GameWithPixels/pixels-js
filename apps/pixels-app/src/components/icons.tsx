import { FontAwesome6, MaterialCommunityIcons } from "@expo/vector-icons";
import { assertNever } from "@systemic-games/pixels-core-utils";
import { PixelDieType } from "@systemic-games/react-native-pixels-connect";
import { Image } from "expo-image";
import { ColorValue, View, ViewProps } from "react-native";
import { useTheme } from "react-native-paper";
import Animated, {
  AnimatedProps,
  useAnimatedStyle,
} from "react-native-reanimated";

import { getIconColor } from "./colors";

import DDDiceIcon from "#/icons/actions/dddice";
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
import SpeakIcon from "#/icons/profiles/speak";
import { AppActionType } from "~/features/store";

export interface IconProps {
  size: number;
  disabled?: boolean;
  color?: ColorValue;
  style?: ViewProps["style"];
}

export function RssiIcon({
  value,
  disabled,
  color,
  ...props
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
      color={
        color ??
        (!value || value < -70 ? "red" : getIconColor(colors, disabled))
      }
      shadedColor={colors.onSurfaceDisabled}
      {...props}
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
  disabled,
  color,
  ...props
}: IconProps & { value?: number; charging?: boolean }) {
  const { colors } = useTheme();
  const Icon = charging ? getChargingBatteryIcon(value) : getBatteryIcon(value);
  return (
    <Icon
      color={
        color ??
        (disabled
          ? getIconColor(colors, true)
          : !value || value < 20
            ? "red"
            : getIconColor(colors))
      }
      lightningColor="gold"
      {...props}
    />
  );
}

function getDieImage(dieType: PixelDieType, mode?: "normal" | "empty") {
  if (mode === "empty") {
    switch (dieType) {
      case "d4":
        return require("#/wireframes/empty/d4.png");
      case "d6":
        return require("#/wireframes/empty/d6.png");
      case "d6pipped":
      case "d6fudge":
        return require("#/wireframes/empty/d6-round.png");
      case "d8":
        return require("#/wireframes/empty/d8.png");
      case "d10":
      case "d00":
        return require("#/wireframes/empty/d10.png");
      case "d12":
        return require("#/wireframes/empty/d12.png");
      case "unknown":
      case "d20":
        return require("#/wireframes/empty/d20.png");
      default:
        assertNever(dieType);
    }
  } else {
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
  }
}

type DieImageProps = {
  dieType: PixelDieType;
  disabled?: boolean;
  mode?: "normal" | "empty";
};

function DieImage({ dieType, disabled, mode }: DieImageProps) {
  return (
    <Image
      contentFit="cover"
      style={{ flex: 1, opacity: disabled ? 0.5 : 1 }}
      source={getDieImage(dieType, mode)}
      blurRadius={disabled ? 1.5 : undefined}
    />
  );
}

export function DieWireframe({
  dieType,
  disabled,
  mode,
  size,
  style,
  ...props
}: {
  size?: number;
} & DieImageProps &
  Omit<ViewProps, "children">) {
  return (
    <View style={[{ width: size, aspectRatio: 1 }, style]} {...props}>
      <DieImage dieType={dieType} disabled={disabled} mode={mode} />
    </View>
  );
}

export function AnimatedDieWireframe({
  dieType,
  disabled,
  mode,
  size,
  style,
  ...props
}: DieImageProps &
  AnimatedProps<
    {
      size?: number;
    } & Omit<ViewProps, "children">
  >) {
  const animStyle = useAnimatedStyle(() => ({
    width: typeof size === "object" ? size.value : size,
    aspectRatio: 1,
  }));
  return (
    <Animated.View style={[animStyle, style]} {...props}>
      <DieImage dieType={dieType} disabled={disabled} mode={mode} />
    </Animated.View>
  );
}

export function AppActionTypeIcon({
  appActionType: type,
  ...props
}: {
  appActionType: AppActionType;
} & IconProps) {
  switch (type) {
    case "speak":
      return <SpeakIcon {...props} />;
    case "url":
      return <FontAwesome6 name="link" {...props} />;
    case "json":
      return <MaterialCommunityIcons name="code-json" {...props} />;
    case "discord":
      return <MaterialCommunityIcons name="discord" {...props} />;
    case "twitch":
      return <MaterialCommunityIcons name="twitch" {...props} />;
    case "dddice":
      return <DDDiceIcon {...props} />;
    case "proxy":
      return <MaterialCommunityIcons name="lan-connect" {...props} />;
    default:
      return assertNever(type, `Unknown appActionType: ${type}`);
  }
}
