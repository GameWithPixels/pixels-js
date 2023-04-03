import { Pixel, PixelStatus } from "@systemic-games/pixels-core-connect";
import { useEffect, useReducer } from "react";

/**
 * React Hook that updates when the status of the given Pixel changes.
 * @param pixel The Pixel for which to watch the status.
 * @returns The status of the given Pixel.
 */
export default function (pixel?: Pixel): PixelStatus | undefined {
  const [_, triggerRender] = useReducer((b) => !b, false);

  // Subscribe to status event to trigger a React update on status change
  useEffect(() => {
    pixel?.addEventListener("status", triggerRender);
    return () => {
      pixel?.removeEventListener("status", triggerRender);
    };
  }, [pixel]);

  // Return the latest status
  return pixel?.status;
}
