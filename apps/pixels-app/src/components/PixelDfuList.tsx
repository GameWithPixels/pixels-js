import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { assertNever } from "@systemic-games/pixels-core-utils";
import { DfuState } from "@systemic-games/react-native-nordic-nrf5-dfu";
import { getBorderRadius } from "@systemic-games/react-native-pixels-components";
import {
  Pixel,
  PixelInfo,
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
import { ViewFlashOnRoll } from "./ViewFlashOnRoll";
import { DieWireframe } from "./icons";

import { DfuAvailability } from "~/features/dice";
import { getPixelStatusLabel } from "~/features/profiles";
import {
  useWatchedPixel,
  usePixelDfuAvailability,
  usePixelDfuState,
  useRollStateLabel,
  useBatteryStateLabel,
} from "~/hooks";
import { useIsDieUpdatingFirmware } from "~/hooks/useIsDieUpdating";

function getDfuStatusText(
  availability: DfuAvailability,
  state?: DfuState,
  progress?: number
): string {
  if (state) {
    const done =
      state === "completed" || state === "aborted" || state === "errored";
    if (!done || availability === "unknown") {
      return `State: ${state}${
        state === "uploading" ? ` ${progress ?? 0}%` : ""
      }`;
    }
  }
  switch (availability) {
    case "unknown":
      return "Not Available";
    case "outdated":
      return "Update Required";
    case "up-to-date":
      return "Up-To-Date";
    default:
      assertNever(availability, `Unsupported availability: ${availability}`);
  }
}

function TextStatus({
  pixel,
  updating,
  ...props
}: { pixel: Pixel; updating?: boolean } & Omit<TextProps<string>, "children">) {
  const status = usePixelStatus(pixel);
  const rollLabel = useRollStateLabel(pixel);
  const batteryLabel = useBatteryStateLabel(pixel);
  return (
    <Text {...props}>
      {updating
        ? "Updating Firmware"
        : status === "ready"
          ? (batteryLabel ?? "") +
            (batteryLabel && rollLabel ? ", " : "") +
            (rollLabel ?? "")
          : getPixelStatusLabel(status)}
    </Text>
  );
}

function PixelStatusInfo({
  pixelId,
  pixel,
  availability,
}: {
  pixelId: number;
  pixel?: Pixel;
  availability: DfuAvailability;
}) {
  const { state, progress, error } = usePixelDfuState(pixelId);
  const updating =
    state &&
    state !== "completed" &&
    state !== "aborted" &&
    state !== "errored";
  return (
    <>
      {pixel && (
        <TextStatus
          pixel={pixel}
          updating={updating}
          style={{ marginTop: 2 }}
        />
      )}
      <Text style={{ marginTop: 5 }}>
        {error
          ? String(error)
          : getDfuStatusText(availability, state, progress)}
      </Text>
    </>
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
  const updating = useIsDieUpdatingFirmware(pairedDie.pixelId);
  const { roundness, colors } = useTheme();
  const borderRadius = getBorderRadius(roundness, { tight: true });
  return (
    <ViewFlashOnRoll pixel={pixel} style={{ borderRadius }}>
      <TouchableCard
        contentStyle={[
          {
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 20,
            paddingVertical: 5,
            gap: 20,
          },
          contentStyle,
        ]}
        {...props}
      >
        <DieWireframe dieType={pairedDie.dieType} size={40} />
        <View style={{ flex: 1, flexGrow: 1 }}>
          <Text variant="bodyLarge">{pairedDie.name}</Text>
          <PixelStatusInfo
            pixelId={pairedDie.pixelId}
            pixel={pixel}
            availability={availability}
          />
        </View>
        {updating ? (
          <ActivityIndicator />
        ) : availability === "outdated" ? (
          <FontAwesome5 name="download" size={24} color={colors.onSurface} />
        ) : availability === "up-to-date" ? (
          <Ionicons
            name="checkmark-circle"
            size={24}
            color={colors.onSurface}
          />
        ) : null}
      </TouchableCard>
    </ViewFlashOnRoll>
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
