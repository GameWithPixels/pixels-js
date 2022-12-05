import { Pixel, PixelStatus } from "@systemic-games/pixels-core-connect";
import { useEffect, useReducer } from "react";

/**
 * React Hook that updates when the status of the given Pixel changes.
 * @param pixel The Pixel for which to watch the status.
 * @returns The status of the given Pixel.
 */
export default function (pixel?: Pixel): PixelStatus | undefined {
  const [_, forceUpdate] = useReducer((b) => !b, false);

  // Subscribe to status event to trigger a React update on status change
  useEffect(() => {
    pixel?.addEventListener("status", forceUpdate);
    return () => {
      pixel?.removeEventListener("status", forceUpdate);
    };
  }, [pixel]);

  // Return the latest status
  return pixel?.status;
}
