import { Pixel } from "@systemic-games/pixels-core-connect";

import BleSession from "./BleSession";
import type ScannedPixel from "./ScannedPixel";
export { type ScannedPixel };

const _pixels = new Map<string, Pixel>();

/**
 * Returns a Pixel instance for the corresponding scanned Pixel instance of Pixel id.
 * The same instance is returned when called multiple times for the same Pixel.
 * @param scannedPixelOrSystemId The {@link ScannedPixel} instance or the BLE system id
 *                               of the die to connect to.
 * @param logFunc Optional function used to log Pixel connection and messaging activity.
 * @param logMessages Optional boolean to request logging messaging activity using the
 *                    passed logger function.
 * @returns A {@link Pixel} instance.
 */
export default function (
  // TODO take pixelId
  scannedPixelOrSystemId: ScannedPixel | string,
  logFunc?: (msg: unknown) => void,
  logMessages?: boolean
): Pixel {
  const systemdId =
    typeof scannedPixelOrSystemId === "string"
      ? scannedPixelOrSystemId
      : scannedPixelOrSystemId.systemId;
  // Keep Pixel instances
  let pixel = _pixels.get(systemdId);
  if (!pixel) {
    pixel = new Pixel(new BleSession(systemdId), logFunc, logMessages);
    _pixels.set(systemdId, pixel);
  }
  return pixel;
}
