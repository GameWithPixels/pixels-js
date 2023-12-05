import { Pixel } from "@systemic-games/pixels-core-connect";

import BleSession from "./BleSession";
import { PixelsMap } from "./PixelsMap";
import { ScannedPixelsRegistry } from "./ScannedPixelsRegistry";

/**
 * Error thrown when a Pixel device can't be found.
 */
class GetPixelError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GetPixelError";
  }
}
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
export function getPixel(id: string | number): Pixel | undefined {
  if (typeof id === "number" ? id !== 0 : id?.length > 0) {
    const sp = ScannedPixelsRegistry.find(id);
    // Get system id from the input data
    const systemId = typeof id === "string" ? id : sp?.systemId;
    if (systemId?.length) {
      // Check for an existing Pixel object for the given system id
      const exitingPixel = PixelsMap.get(systemId);
      // Or create a new Pixel instance
      const pixel =
        exitingPixel ?? new Pixel(new BleSession(systemId, sp?.name), sp);
      if (!exitingPixel) {
        // Keep track of this new instance
        PixelsMap.set(systemId, pixel);
      }
      return pixel;
    }
  }
}

export function getPixelOrThrow(id: string | number): Pixel {
  const pixel = getPixel(id);
  if (!pixel) {
    throw new GetPixelError(`No scanned Pixel with ${id}`);
  }
  return pixel;
}
