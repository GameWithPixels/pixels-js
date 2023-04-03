import type { PixelInfo } from "@systemic-games/pixels-core-connect";

/** Data periodically emitted by a Pixel when not connected to a device. */
export default interface ScannedPixel extends PixelInfo {
  readonly address: number; // Not available on iOS
}
