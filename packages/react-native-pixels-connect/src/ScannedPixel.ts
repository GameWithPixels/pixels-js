import type { IPixel } from "@systemic-games/pixels-core-connect";

export default interface ScannedPixel extends IPixel {
  readonly address: number; // Not available on iOS
}
