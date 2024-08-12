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
export type ScannedPixel = PixelInfo &
  Readonly<{
    /** Device type is Pixels die. */
    type: "pixel";

    /** Bluetooth MAC address, 48 bits, Not available on iOS. */
    address: number;

    /** Timestamp when the advertisement data was received. */
    timestamp: Date;
  }>;
