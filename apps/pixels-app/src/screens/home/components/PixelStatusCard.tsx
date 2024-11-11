import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  usePixelProp,
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

import { PairedDie } from "~/app/PairedDie";
import { PixelBattery } from "~/components/PixelBattery";
import { PixelConnectionStatus } from "~/components/PixelConnectionStatus";
import { PixelRssi } from "~/components/PixelRssi";
import { TouchableCard, TouchableCardProps } from "~/components/TouchableCard";
import { getDieTypeAndColorwayLabel } from "~/features/profiles";
import { usePixelTransferProgress, useRegisteredPixel } from "~/hooks";

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

function PixelStatusDetails({ pairedDie }: { pairedDie: PairedDie }) {
  const pixel = useRegisteredPixel(pairedDie);
  const isReady = usePixelStatus(pixel) === "ready";
  const batteryLevel = usePixelProp(pixel, "batteryLevel");
  const isCharging = usePixelProp(pixel, "isCharging") && isReady;
  const needCharging = (batteryLevel ?? 100) < 10;
  const transferProgress = usePixelTransferProgress(pixel);
  const transferring = isReady && transferProgress >= 0;
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <Text>
        {transferring
          ? `Programming Profile: ${transferProgress}%`
          : isCharging
            ? "Charging..."
            : needCharging
              ? "Need charging!"
              : getDieTypeAndColorwayLabel(pairedDie)}
      </Text>
      {!transferring && isCharging ? (
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
  pairedDie,
  ...props
}: {
  pairedDie: PairedDie;
} & Omit<TouchableCardProps, "contentStyle">) {
  const pixel = useRegisteredPixel(pairedDie);
  const status = usePixelStatus(pixel);
  const { colors } = useTheme();
  return (
    <TouchableCard
      contentStyle={{
        flexGrow: 1,
        padding: 10,
        paddingBottom: 0,
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 10,
      }}
      {...props}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Text>Status</Text>
        <PixelConnectionStatus
          status={status}
          size={20}
          color={colors.onSurface}
        />
        <View style={{ flexGrow: 1 }} />
        {pixel && status === "ready" && (
          <>
            <PixelBattery pixel={pixel} size={18} />
            <PixelRssi pixel={pixel} size={18} />
          </>
        )}
      </View>
      <PixelStatusDetails pairedDie={pairedDie} />
      <Text
        variant="labelSmall"
        style={{ alignSelf: "flex-end", color: colors.onSurfaceDisabled }}
      >
        Tap for more info
      </Text>
    </TouchableCard>
  );
}
