import { Pixel } from "@systemic-games/pixels-core-connect";

import BleSession from "./BleSession";
import { ScannedDevicesRegistry } from "./ScannedDevicesRegistry";
import { DevicesMap } from "./static";

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
 * @returns A {@link Pixel} instance or undefined.
 */
export function getPixel(id: string | number): Pixel | undefined {
  if (typeof id === "number" ? id !== 0 : id?.length > 0) {
    const sp = ScannedDevicesRegistry.findPixel(id);
    // Get system id from the input data
    const systemId = typeof id === "string" ? id : sp?.systemId;
    if (systemId?.length) {
      // Check for an existing Pixel object for the given system id
      const dev = DevicesMap.get(systemId);
      if (dev instanceof Pixel) {
        return dev;
      } else {
        // Create a new Pixel instance
        const pixel = new Pixel(new BleSession("die", systemId, sp?.name), sp);
        // Keep track of this new instance
        DevicesMap.set(systemId, pixel);
        return pixel;
      }
    }
  }
}

/**
 * Calls {@link getPixel} and throws an error if the Pixel instance cannot be found.
 * @param id Identify which Pixel to use.
 *           It can be either the system id as a string or the Pixel id as a number.
 * @returns A {@link Pixel} instance.
 */
export function getPixelOrThrow(id: string | number): Pixel {
  const pixel = getPixel(id);
  if (!pixel) {
    throw new GetPixelError(`No scanned Pixels die with ${id}`);
  }
  return pixel;
}
