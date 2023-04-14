import { Pixel, PixelStatus } from "@systemic-games/pixels-core-connect";
import React from "react";

/**
 * React Hook that updates when the status of the given Pixel changes.
 * @param pixel The Pixel for which to watch the status.
 * @returns The status of the given Pixel.
 */
export default function (pixel?: Pixel): PixelStatus | undefined {
  const [_, forceUpdate] = React.useReducer((x) => x + 1, 0);

  // Subscribe to status event to trigger a React update on status change
  React.useEffect(() => {
    pixel?.addEventListener("status", forceUpdate);
    return () => {
      pixel?.removeEventListener("status", forceUpdate);
    };
  }, [pixel]);

  // Return the latest status
  return pixel?.status;
}
