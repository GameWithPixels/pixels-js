import { Pixel } from "@systemic-games/pixels-core-connect";
import { assert } from "@systemic-games/pixels-core-utils";

import BleSession from "./BleSession";
import type ScannedPixel from "./ScannedPixel";
import { getScannedPixel } from "./allScannedPixels";
export { type ScannedPixel };

const _pixels = new Map<string, Pixel>();

/**
 * Returns a Pixel instance for the corresponding scanned Pixel instance of Pixel id.
 * The same instance is returned when called multiple times for the same Pixel.
 * @param pixel Identify which Pixel to use.
 *              It can be either an object with a systemId string property,
 *              or the system id as a string
 *              or the Pixel id as a number.
 * @param logFunc Optional function used to log Pixel connection and messaging activity.
 * @param logMessages Optional boolean to request logging messaging activity using the
 *                    passed logger function.
 * @returns A {@link Pixel} instance.
 */
export default function (
  pixel: string | number | Pick<ScannedPixel, "systemId">
): Pixel {
  const systemdId =
    typeof pixel === "string"
      ? pixel
      : (typeof pixel === "number" ? getScannedPixel(pixel) : pixel)?.systemId;
  assert(
    systemdId && systemdId.length > 0,
    `getPixel(): Invalid argument: ${(pixel as any).systemId ?? pixel}`
  );
  // Keep Pixel instances
  let thePixel = _pixels.get(systemdId);
  if (!thePixel) {
    thePixel = new Pixel(new BleSession(systemdId));
    _pixels.set(systemdId, thePixel);
  }
  return thePixel;
}
