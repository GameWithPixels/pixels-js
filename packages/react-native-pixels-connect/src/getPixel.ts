import { Pixel } from "@systemic-games/pixels-core-connect";
import { assert } from "@systemic-games/pixels-core-utils";

import BleSession from "./BleSession";
import { PixelsMap } from "./PixelsMap";
import { ScannedPixelsRegistry } from "./ScannedPixelsRegistry";

/**
 * Returns a Pixel instance for the corresponding scanned Pixel instance of Pixel id.
 * The same instance is returned when called multiple times for the same Pixel.
 * @param id Identify which Pixel to use.
 *           It can be either the system id as a string or the Pixel id as a number.
 * @param logFunc Optional function used to log Pixel connection and messaging activity.
 * @param logMessages Optional boolean to request logging messaging activity using the
 *                    passed logger function.
 * @returns A {@link Pixel} instance.
 */
export function getPixel(id: string | number): Pixel {
  // Get system id from the input data
  const systemId =
    typeof id === "string"
      ? id
      : (typeof id === "number" ? ScannedPixelsRegistry.find(id) : id)
          ?.systemId;
  assert(
    systemId && systemId.length > 0,
    `getPixel(): Invalid argument: ${id}`
  );
  // Check for an existing Pixel object for the given system id
  const exitingPixel = PixelsMap.get(systemId);
  // Or create a new Pixel instance
  const pixel = exitingPixel ?? new Pixel(new BleSession(systemId));
  if (!exitingPixel) {
    // Keep track of this new instance
    PixelsMap.set(systemId, pixel);
  }
  return pixel;
}
