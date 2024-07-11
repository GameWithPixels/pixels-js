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

import { TouchableCard, TouchableCardProps } from "./TouchableCard";
import { DieWireframe } from "./icons";

import { getPixelStatusLabel } from "~/features/profiles";
import {
  useBatteryStateLabel,
  usePixelDfuAvailability,
  usePixelDfuState,
  useRollStateLabel,
  useWatchedPixel,
} from "~/hooks";

function TextStatus({
  pixel,
  state,
  progress,
  ...props
}: {
  pixel: Pixel;
  state?: DfuState;
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

function PixelDfuItem({
  pairedDie,
  contentStyle,
  ...props
}: {
  pairedDie: Pick<PixelInfo, "pixelId" | "name" | "dieType">;
  selected?: boolean;
} & Omit<TouchableCardProps, "children">) {
  const availability = usePixelDfuAvailability(pairedDie.pixelId);
  const pixel = useWatchedPixel(pairedDie.pixelId);
  const status = usePixelStatus(pixel);
  const rollState = usePixelProp(pixel, "rollState");
  const { state, progress, error } = usePixelDfuState(pairedDie.pixelId);
  const updating =
    state &&
    state !== "completed" &&
    state !== "errored" &&
    state !== "aborted";
  const unavailable = status !== "ready" && !state;
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
        {unavailable || !pixel || error ? (
          <Text style={{ color: colors.onSurfaceDisabled }}>
            {error ? String(error) : "Not Connected"}
          </Text>
        ) : (
          <TextStatus pixel={pixel} state={state} progress={progress} />
        )}
      </View>
      <View style={{ alignSelf: "center" }}>
        {updating ? (
          <ActivityIndicator />
        ) : availability === "outdated" ? (
          <FontAwesome5 name="download" size={24} color={color} />
        ) : availability === "up-to-date" ? (
          <MaterialIcons name="check-circle-outline" size={28} color={color} />
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
