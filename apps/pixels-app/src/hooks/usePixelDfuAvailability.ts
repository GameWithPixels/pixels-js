import { PixelInfo } from "@systemic-games/react-native-pixels-connect";
import React from "react";

import { useDfuNotifier } from "./useDfuNotifier";

import {
  DfuAvailability,
  DfuNotifierAvailabilityEvent,
} from "~/features/dfu/DfuNotifier";

export function usePixelDfuAvailability(
  pixel: Pick<PixelInfo, "pixelId"> | number
): DfuAvailability {
  const pixelId = typeof pixel === "number" ? pixel : pixel.pixelId;
  const dfuNotifier = useDfuNotifier();
  const [dfuAvailability, setDfuAvailability] = React.useState(
    dfuNotifier.getDfuAvailability(pixelId)
  );
  React.useEffect(() => {
    setDfuAvailability(dfuNotifier.getDfuAvailability(pixelId));
    if (pixelId) {
      const onDfuAvailability = ({
        pixel,
        dfuAvailability,
      }: DfuNotifierAvailabilityEvent) =>
        pixelId === pixel.pixelId && setDfuAvailability(dfuAvailability);
      dfuNotifier.addEventListener("dfuAvailability", onDfuAvailability);
      return () => {
        dfuNotifier.removeEventListener("dfuAvailability", onDfuAvailability);
      };
    }
  }, [dfuNotifier, pixelId]);
  return dfuAvailability;
}

export function useHasFirmwareUpdate(
  pixel: Pick<PixelInfo, "pixelId"> | number
): boolean {
  return usePixelDfuAvailability(pixel) === "outdated";
}
