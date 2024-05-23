import { Pixel, PixelStatus } from "@systemic-games/pixels-core-connect";
import React from "react";

import { useForceUpdate } from "./useForceUpdate";

/**
 * React Hook that updates when the status of the given Pixel changes.
 * @param pixel The Pixel for which to watch the status.
 * @returns The status of the given Pixel.
 */
export function usePixelStatus(pixel?: Pixel): PixelStatus | undefined {
  const forceUpdate = useForceUpdate();

  // Subscribe to status event to trigger a React update on status change
  React.useEffect(() => {
    pixel?.addEventListener("status", forceUpdate);
    return () => {
      pixel?.removeEventListener("status", forceUpdate);
    };
  }, [forceUpdate, pixel]);

  // Return the latest status
  return pixel?.status;
}
