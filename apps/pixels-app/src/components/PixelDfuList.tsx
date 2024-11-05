import {
  FontAwesome5,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import {
  Pixel,
  PixelInfo,
  PixelInfoNotifier,
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

import { PixelsCentralDfuState } from "~/features/dice";
import {
  useBatteryStateLabel,
  useIsDieUpdatingFirmware,
  usePixelDfuAvailability,
  usePixelDfuState,
  usePixelsCentral,
  useRollStateLabel,
  useRegisteredPixel,
} from "~/hooks";
import { usePixelRssiLabel } from "~/hooks/usePixelRssiLabel";

function TextDfuState({
  state,
  progress,
  ...props
}: { state: PixelsCentralDfuState; progress?: number } & Omit<
  TextProps<string>,
  "children"
>) {
  return (
    <Text {...props}>
      {`Updating: ${state === "uploading" ? `uploading ${progress ?? 0}%` : state}`}
    </Text>
  );
}

function TextStatus({
  pixel,
  ...props
}: {
  pixel: Pixel;
} & Omit<TextProps<string>, "children">) {
  const rollLabel = useRollStateLabel(pixel);
  const batteryLabel = useBatteryStateLabel(pixel);
  const rssiLabel = usePixelRssiLabel(pixel);
  const { colors } = useTheme();
  return (
    <Text {...props}>
      {batteryLabel && (
        <>
          <MaterialCommunityIcons
            name="battery"
            size={16}
            color={colors.onSurface}
          />{" "}
          {batteryLabel}
        </>
      )}
      {rssiLabel && (
        <>
          <MaterialCommunityIcons
            name="signal"
            size={16}
            color={colors.onSurface}
          />{" "}
          {rssiLabel}
        </>
      )}
      {((rssiLabel ?? batteryLabel) && rollLabel ? ", " : "") +
        (rollLabel ?? "")}
    </Text>
  );
}

function TextAvailability({
  notifier,
  ...props
}: {
  notifier?: PixelInfoNotifier;
} & Omit<TextProps<string>, "children">) {
  const rssiLabel = usePixelRssiLabel(notifier);
  const { colors } = useTheme();
  return (
    <Text {...props}>
      {notifier ? (
        <>
          Available
          {rssiLabel && (
            <>
              {" "}
              <MaterialCommunityIcons
                name="signal"
                size={16}
                color={colors.onSurface}
              />{" "}
              {rssiLabel}
            </>
          )}
        </>
      ) : (
        "Unavailable"
      )}
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
  const { state, progress } = usePixelDfuState(pairedDie.pixelId);
  const updating = useIsDieUpdatingFirmware(pairedDie.pixelId);

  // Scanning, we want a reference to the notifier
  const central = usePixelsCentral();
  const [notifier, setNotifier] = React.useState<PixelInfoNotifier>();
  const lastScannedRef = React.useRef(false);
  React.useEffect(() => {
    return central.addListener("scanStatus", (status) => {
      if (status === "starting") {
        lastScannedRef.current = false;
      } else if (status === "stopped" && !lastScannedRef.current) {
        // Remove notifier if not found during this last scan
        setNotifier(undefined);
      }
    });
  }, [central, pairedDie]);
  React.useEffect(() => {
    return central.addListener("onPixelScanned", ({ status, notifier }) => {
      if (notifier.pixelId === pairedDie.pixelId) {
        lastScannedRef.current = status === "scanned";
        setNotifier(lastScannedRef.current ? notifier : undefined);
      }
    });
  }, [central, pairedDie]);

  const connected = status === "ready" || status === "identifying";
  const unavailable = !connected && !state && !notifier;
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
        !updating &&
        status === "ready" &&
        (rollState === "rolling" || rollState === "handling")
      }
      contentStyle={[
        {
          flexDirection: "row",
          alignItems: "stretch",
          paddingHorizontal: 20,
          paddingVertical: 5,
          gap: 10,
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
        <View style={{ flexDirection: "row", flexShrink: 1 }}>
          {state ? (
            <TextDfuState
              state={state}
              progress={progress}
              numberOfLines={1}
              style={{ flex: 1, color }}
            />
          ) : pixel && connected ? (
            <TextStatus
              pixel={pixel}
              numberOfLines={1}
              style={{ flex: 1, color }}
            />
          ) : (
            <TextAvailability
              notifier={notifier}
              numberOfLines={1}
              style={{ flex: 1, color }}
            />
          )}
        </View>
      </View>
      <View style={{ alignSelf: "center" }}>
        {state === "errored" && !updating ? (
          // Show error when done updating
          <FontAwesome5 name="exclamation-triangle" size={24} color="red" />
        ) : state === "uploading" ? (
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
