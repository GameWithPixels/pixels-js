import type { PixelInfo } from "@systemic-games/pixels-core-connect";

/**
 * Data periodically emitted by a Pixel when not connected to a device.
 *
 * @remarks
 * Even though the roll state and roll face are included, this data is not
 * emitted in a reliable way.
 *
 * To get reliably notified for rolls, first connect to the die and listen
 * for roll events.
 **/
export interface ScannedPixel extends PixelInfo {
  readonly address: number; // Not available on iOS
  readonly timestamp: Date; // Timestamp when the advertisement data was received
}
