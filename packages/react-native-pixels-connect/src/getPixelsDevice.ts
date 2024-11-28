import {
  Charger,
  MPC,
  Pixel,
  PixelConnect,
} from "@systemic-games/pixels-core-connect";
import { assertNever } from "@systemic-games/pixels-core-utils";

import BleSession from "./BleSession";
import { ScannedDevice } from "./PixelScanner";
import { ScannedBootloader } from "./ScannedBootloader";
import { ScannedDevicesRegistry } from "./ScannedDevicesRegistry";
import { DevicesMap } from "./static";

function createInstance(
  sp: Exclude<ScannedDevice, ScannedBootloader>
): PixelConnect {
  const { type, systemId, name } = sp;
  switch (type) {
    case "die":
      return new Pixel(new BleSession("die", systemId, name), sp);
    case "charger":
      return new Charger(new BleSession("charger", systemId, name), sp);
    case "mpc":
      return new MPC(new BleSession("mpc", systemId, name), sp);
    default:
      assertNever(type, `No PixelConnect class for device of type: ${type}`);
  }
}

/**
 * Returns a Pixel instance for the corresponding scanned Pixel instance of Pixel id.
 * The same instance is returned when called multiple times for the same Pixel.
 * @param id Identify which Pixel to use.
 *           It can be either the system id as a string or the Pixel id as a number.
 * @returns A {@link Pixel} instance or undefined.
 */
export function getPixelsDevice(id: string | number): PixelConnect | undefined {
  if (typeof id === "number" ? id !== 0 : id?.length > 0) {
    const sp = ScannedDevicesRegistry.find(id);
    // Get system id from the input data
    const systemId = typeof id === "string" ? id : sp?.systemId;
    if (systemId?.length) {
      // Check for an existing Pixels instance for the given system id
      const dev = DevicesMap.get(systemId);
      if (dev instanceof Pixel) {
        return dev;
      } else if (sp && sp.type !== "bootloader") {
        // Create a new PixelConnect instance
        const newDev = createInstance(sp);
        // Keep track of this new instance
        DevicesMap.set(systemId, newDev);
        return newDev;
      }
    }
  }
}
