import React from "react";

import { usePixelsCentral } from "./usePixelsCentral";

export function useConnectToMissingPixels(): (
  pixelsIds?: number[] | number
) => void {
  const central = usePixelsCentral();
  // Don't stop scanning on unmount to not interfere with other scans
  // It will automatically stop after a little while anyways
  return React.useCallback(
    (pixelsIds?: number[] | number) => {
      central.connectToMissingPixels(
        typeof pixelsIds === "number"
          ? [pixelsIds]
          : pixelsIds ?? central.watchedPixelsIds
      );
    },
    [central]
  );
}
