import type { PixelInfo } from "@systemic-games/pixels-core-connect";

/** Data periodically emitted by a Pixel when not connected to a device. */
export interface ScannedPixel extends PixelInfo {
  readonly address: number; // Not available on iOS
  readonly timestamp: Date; // Timestamp when the advertisement data was received
}
