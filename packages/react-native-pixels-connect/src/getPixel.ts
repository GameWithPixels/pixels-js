import { Pixel } from "@systemic-games/pixels-core-connect";
import { assert } from "@systemic-games/pixels-core-utils";

import BleSession from "./BleSession";
import { PixelsMap } from "./PixelsMap";
import { type ScannedPixel } from "./ScannedPixel";
import ScannedPixelsRegistry from "./ScannedPixelsRegistry";

/**
 * Returns a Pixel instance for the corresponding scanned Pixel instance of Pixel id.
 * The same instance is returned when called multiple times for the same Pixel.
 * @param id Identify which Pixel to use.
 *          It can be either an object with a systemId string property,
 *          or the system id as a string
 *          or the Pixel id as a number.
 * @param logFunc Optional function used to log Pixel connection and messaging activity.
 * @param logMessages Optional boolean to request logging messaging activity using the
 *                    passed logger function.
 * @returns A {@link Pixel} instance.
 */
export function getPixel(id: string | number | Partial<ScannedPixel>): Pixel {
  // Get system id from the input data
  const systemId =
    typeof id === "string"
      ? id
      : (typeof id === "number" ? ScannedPixelsRegistry.find(id) : id)
          ?.systemId;
  assert(
    systemId && systemId.length > 0,
    `getPixel(): Invalid argument: ${JSON.stringify(id)}`
  );
  // Check for an existing Pixel object for the given system id
  let pixel = PixelsMap.get(systemId);
  if (!pixel) {
    // Create a new Pixel instance
    pixel = new Pixel(
      new BleSession(systemId),
      typeof id === "object" ? id : undefined
    );
    // And keep track of it
    PixelsMap.set(systemId, pixel);
  }
  return pixel;
}
