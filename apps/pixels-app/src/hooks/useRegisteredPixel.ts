import { Pixel } from "@systemic-games/react-native-pixels-connect";
import React from "react";

import { useRegisteredPixels } from "./useRegisteredPixels";

import { PairedDie } from "~/app/PairedDie";

export function useRegisteredPixel(
  pixelOrPixelId: Pick<PairedDie, "pixelId"> | number | undefined
): Pixel | undefined {
  const pixelId =
    !pixelOrPixelId || typeof pixelOrPixelId === "number"
      ? pixelOrPixelId
      : pixelOrPixelId.pixelId;
  const pixels = useRegisteredPixels();
  return React.useMemo(
    () => pixels.find((p) => p.pixelId === pixelId),
    [pixelId, pixels]
  );
}
