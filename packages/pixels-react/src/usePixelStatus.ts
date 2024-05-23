import { Pixel, PixelStatus } from "@systemic-games/pixels-core-connect";

import { usePixelProp } from "./usePixelProp";

/**
 * React Hook that updates when the status of the given Pixel changes.
 * @param pixel The Pixel for which to watch the status.
 * @returns The status of the given Pixel.
 */
export function usePixelStatus(pixel?: Pixel): PixelStatus | undefined {
  return usePixelProp(pixel, "status");
}
