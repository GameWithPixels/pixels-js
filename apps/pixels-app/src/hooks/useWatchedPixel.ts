import { Pixel } from "@systemic-games/react-native-pixels-connect";
import React from "react";

import { useWatchedPixels } from "./useWatchedPixels";

import { PairedDie } from "~/app/PairedDie";

export function useWatchedPixel(
  pixelOrPixelId: Pick<PairedDie, "pixelId"> | number | undefined
): Pixel | undefined {
  const pixelId =
    !pixelOrPixelId || typeof pixelOrPixelId === "number"
      ? pixelOrPixelId
      : pixelOrPixelId.pixelId;
  const pixels = useWatchedPixels();
  return React.useMemo(
    () => pixels.find((p) => p.pixelId === pixelId),
    [pixelId, pixels]
  );
}
