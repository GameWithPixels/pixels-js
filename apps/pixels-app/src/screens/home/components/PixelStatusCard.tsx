import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  PixelStatus,
  Pixel,
  usePixelValue,
  usePixelStatus,
} from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { PixelBattery } from "~/components/PixelBattery";
import { PixelRssi } from "~/components/PixelRssi";
import { TouchableCard, TouchableCardProps } from "~/components/TouchableCard";
import { getTextColorStyle } from "~/components/utils";
import { getDieTypeAndColorwayLabel } from "~/descriptions";
import { usePixelDataTransfer } from "~/hooks";

function AnimatedConnectionIcon({
  size,
  color,
}: {
  size: number;
  color?: string;
}) {
  const progress = useSharedValue(0);
  React.useEffect(() => {
    progress.value = withRepeat(withTiming(360, { duration: 3000 }), -1);
  }, [progress]);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: progress.value + "deg" }],
  }));
  return (
    <Animated.View style={animStyle}>
      <MaterialCommunityIcons
        name="bluetooth-connect"
        size={size}
        color={color}
      />
    </Animated.View>
  );
}

function PixelConnectionStatus({
  status,
  size,
  color,
}: {
  status?: PixelStatus;
  size: number;
  color?: string;
}) {
  if (status === "ready") {
    return (
      <MaterialCommunityIcons name="bluetooth" size={size} color={color} />
    );
  } else if (status === "connecting" || status === "identifying") {
    return <AnimatedConnectionIcon size={size} color={color} />;
  } else {
    return (
      <MaterialCommunityIcons name="bluetooth-off" size={size} color={color} />
    );
  }
}

function AnimatedChargingIcon({
  size,
  color,
}: {
  size: number;
  color?: string;
}) {
  const progress = useSharedValue(0);
  React.useEffect(() => {
    progress.value = withRepeat(withTiming(2, { duration: 3000 }), -1);
  }, [progress]);
  const animStyle = useAnimatedStyle(() => ({
    opacity: progress.value < 1 ? progress.value : 2 - progress.value,
  }));
  return (
    <Animated.View style={animStyle}>
      <MaterialCommunityIcons
        name="power-plug-outline"
        size={size}
        color={color}
      />
    </Animated.View>
  );
}

function PixelStatusDetails({
  pixel,
  disabled,
}: {
  pixel: Pixel;
  disabled?: boolean;
}) {
  const [battery] = usePixelValue(pixel, "battery");
  const needCharging = (battery?.level ?? 100) < 10;
  const transferProgress = usePixelDataTransfer(pixel);
  const transferring = transferProgress >= 0 && transferProgress < 100;
  const { colors } = useTheme();
  const textStyle = getTextColorStyle(colors, disabled);
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <Text style={textStyle}>
        {transferring
          ? `Activating Profile: ${transferProgress}%`
          : battery?.isCharging
            ? "Charging..."
            : needCharging
              ? "Need charging!"
              : getDieTypeAndColorwayLabel(pixel)}
      </Text>
      {!transferring && battery?.isCharging ? (
        <AnimatedChargingIcon size={16} color={colors.onSurface} />
      ) : (
        needCharging && (
          <MaterialCommunityIcons
            name="power-plug-off-outline"
            size={16}
            color={colors.onSurface}
          />
        )
      )}
    </View>
  );
}

export function PixelStatusCard({
  pixel,
  disabled,
  ...props
}: {
  pixel: Pixel;
  disabled: boolean;
} & Omit<TouchableCardProps, "contentStyle">) {
  const status = usePixelStatus(pixel);
  const { colors } = useTheme();
  return (
    <TouchableCard
      contentStyle={{
        flexGrow: 1,
        padding: 10,
        paddingBottom: 0,
        alignItems: "flex-start",
        justifyContent: "space-around",
        gap: 5,
      }}
      {...props}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Text>Status:</Text>
        <PixelConnectionStatus
          status={status}
          size={20}
          color={colors.onSurface}
        />
        <View style={{ flexGrow: 1 }} />
        <PixelRssi pixel={pixel} size={16} disabled={disabled} />
        <PixelBattery pixel={pixel} size={16} disabled={disabled} />
      </View>
      <PixelStatusDetails pixel={pixel} disabled={disabled} />
      <Text
        variant="labelSmall"
        style={{ alignSelf: "flex-end", color: colors.onSurfaceDisabled }}
      >
        Tap for more details
      </Text>
    </TouchableCard>
  );
}
