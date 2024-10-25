import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import { DfuState } from "@systemic-games/react-native-nordic-nrf5-dfu";
import {
  Pixel,
  PixelInfo,
  usePixelProp,
  usePixelStatus,
} from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { View, ViewProps } from "react-native";
import {
  ActivityIndicator,
  Text,
  TextProps,
  useTheme,
} from "react-native-paper";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
} from "react-native-reanimated";

import { TouchableCard, TouchableCardProps } from "./TouchableCard";
import { DieWireframe } from "./icons";

import { getPixelStatusLabel } from "~/features/profiles";
import {
  useBatteryStateLabel,
  useIsDieUpdatingFirmware,
  usePixelDfuAvailability,
  usePixelDfuState,
  usePixelsCentral,
  useRollStateLabel,
  useRegisteredPixel,
} from "~/hooks";

function TextStatus({
  pixel,
  state,
  progress,
  ...props
}: {
  pixel: Pixel;
  state?: DfuState | "scanning";
  progress?: number;
} & Omit<TextProps<string>, "children">) {
  const status = usePixelStatus(pixel);
  const rollLabel = useRollStateLabel(pixel);
  const batteryLabel = useBatteryStateLabel(pixel);
  return (
    <Text {...props}>
      {state
        ? `Updating: ${
            state === "uploading" ? `uploading ${progress ?? 0}%` : state
          }`
        : status === "ready"
          ? (batteryLabel ?? "") +
            (batteryLabel && rollLabel ? ", " : "") +
            (rollLabel ?? "")
          : getPixelStatusLabel(status)}
    </Text>
  );
}

function BouncingView({ children }: { children: React.ReactNode }) {
  const translateY = useSharedValue(0);
  // Start bouncing animation
  React.useEffect(() => {
    translateY.value = withRepeat(
      withSpring(1, {
        duration: 1500,
        dampingRatio: 0.2,
      }),
      -1 // true
    );
  }, [translateY]);
  const animStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: (translateY.value - 0.5) * 10 }, // 10 pixels
      ],
    };
  });
  return <Animated.View style={animStyle}>{children}</Animated.View>;
}

function PixelDfuItem({
  pairedDie,
  contentStyle,
  ...props
}: {
  pairedDie: Pick<PixelInfo, "pixelId" | "name" | "dieType">;
} & Omit<TouchableCardProps, "children" | "selected">) {
  const pixel = useRegisteredPixel(pairedDie.pixelId);
  const status = usePixelStatus(pixel);
  const rollState = usePixelProp(pixel, "rollState");
  // DFU
  const availability = usePixelDfuAvailability(pairedDie.pixelId);
  const { state, progress, error } = usePixelDfuState(pairedDie.pixelId);
  const uploading = state === "starting" || state === "uploading";
  const updating = useIsDieUpdatingFirmware(pairedDie.pixelId);
  // Scanning
  const central = usePixelsCentral();
  const [scanned, setScanned] = React.useState(false);
  const [scanning, setScanning] = React.useState(
    central.scanStatus === "scanning"
  );
  const lastScannedRef = React.useRef(false);
  React.useEffect(() => {
    return central.addListener("scanStatus", (status) => {
      setScanning(status === "scanning");
      if (status === "starting") {
        lastScannedRef.current = false;
      } else if (status === "stopped" && !lastScannedRef.current) {
        // Mark as not scanned
        setScanned(false);
      }
    });
  }, [central, pairedDie]);
  React.useEffect(() => {
    return central.addListener("onPixelScanned", ({ status, notifier }) => {
      if (notifier.pixelId === pairedDie.pixelId) {
        lastScannedRef.current = status === "scanned";
        setScanned(lastScannedRef.current);
      }
    });
  }, [central, pairedDie]);

  const connected = status === "ready" || status === "identifying";
  const unavailable = !connected && !state && !scanned;
  const { colors } = useTheme();
  const color = unavailable ? colors.onSurfaceDisabled : colors.onSurface;
  return (
    <TouchableCard
      selected={updating}
      gradientBorder={
        unavailable || availability !== "outdated" ? "dark" : "bright"
      }
      thinBorder
      flash={
        status === "ready" &&
        (rollState === "rolling" || rollState === "handling")
      }
      contentStyle={[
        {
          flexDirection: "row",
          alignItems: "stretch",
          paddingHorizontal: 20,
          paddingVertical: 5,
          gap: 20,
        },
        contentStyle,
      ]}
      {...props}
    >
      <DieWireframe
        dieType={pairedDie.dieType}
        disabled={unavailable}
        size={50}
      />
      <View style={{ flexGrow: 1, justifyContent: "space-around" }}>
        <Text variant="bodyLarge" style={unavailable ? { color } : undefined}>
          {pairedDie.name}
        </Text>
        {/* This view makes sure the text properly wraps and leave space for the icon */}
        <View style={{ flexDirection: "row" }}>
          {pixel && (connected || state) && !error ? (
            <TextStatus pixel={pixel} state={state} progress={progress} />
          ) : (
            <Text style={{ flex: 1, color }}>
              {error
                ? String(error)
                : scanned
                  ? "Available"
                  : scanning && updating
                    ? "Looking for die..."
                    : "Unavailable"}
            </Text>
          )}
        </View>
      </View>
      <View style={{ alignSelf: "center" }}>
        {error ? (
          <FontAwesome5 name="exclamation-triangle" size={24} color="red" />
        ) : uploading ? (
          <BouncingView>
            <FontAwesome5 name="download" size={24} color={colors.primary} />
          </BouncingView>
        ) : updating ? (
          <ActivityIndicator />
        ) : availability === "outdated" ? (
          <FontAwesome5 name="download" size={24} color={color} />
        ) : availability === "up-to-date" ? (
          <MaterialIcons
            name="check-circle-outline"
            size={28}
            color="darkgreen"
          />
        ) : (
          <Text>{availability}</Text>
        )}
      </View>
    </TouchableCard>
  );
}

export function PixelDfuList({
  pairedDice,
  style,
  ...props
}: {
  pairedDice: readonly Pick<PixelInfo, "pixelId" | "name" | "dieType">[];
} & ViewProps) {
  return (
    <View style={[{ gap: 10 }, style]} {...props}>
      {pairedDice.map((die) => (
        <PixelDfuItem key={die.pixelId} pairedDie={die} />
      ))}
    </View>
  );
}
