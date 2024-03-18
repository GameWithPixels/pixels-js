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
import { Text, TextProps, useTheme } from "react-native-paper";

import { TouchableCard, TouchableCardProps } from "./TouchableCard";
import { ViewFlashOnRoll } from "./ViewFlashOnRoll";
import { DieWireframe } from "./icons";

import { DfuAvailability } from "~/features/dfu/DfuNotifier";
import { getPixelStatusLabel } from "~/features/profiles";
import {
  useWatchedPixel,
  usePixelDfuAvailability,
  usePixelDfuState,
} from "~/hooks";
import { useRollStateLabel } from "~/hooks/useRollStateLabel";

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
    // case "updating":
    //   return !state
    //     ? "Preparing to update"
    //     : `State: ${state}${state === "uploading" ? ` ${progress ?? 0}%` : ""}`;
    default:
      assertNever(availability, `Unsupported availability: ${availability}`);
  }
}

// function usePixelFirmwareDate(pixel?: PixelInfoNotifier): string | undefined {
//   const [firmwareDate, setFirmwareDate] = React.useState(
//     pixel?.firmwareDate.toLocaleString()
//   );
//   React.useEffect(() => {
//     if (pixel) {
//       const onDate = () => setFirmwareDate(pixel.firmwareDate.toLocaleString());
//       onDate();
//       pixel.addPropertyListener("firmwareDate", onDate);
//       return () => pixel.removePropertyListener("firmwareDate", onDate);
//     } else {
//       setFirmwareDate(undefined);
//     }
//   }, [pixel]);
//   return firmwareDate;
// }

function TextStatus({
  pixel,
  updating,
  ...props
}: { pixel: Pixel; updating?: boolean } & Omit<TextProps<string>, "children">) {
  const status = usePixelStatus(pixel);
  const rollLabel = useRollStateLabel(pixel);
  return (
    <Text {...props}>
      {updating
        ? "Updating Firmware"
        : status === "ready"
          ? rollLabel
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
  const { roundness } = useTheme();
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
