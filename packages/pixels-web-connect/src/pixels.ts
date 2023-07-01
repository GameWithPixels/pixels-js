import { Pixel } from "@systemic-games/pixels-core-connect";

import BleSession from "./BleSession";
import PixelsDevices from "./PixelsDevices";

const _pixels = new Map<string, Pixel>();

/**
 * Request the user to select a Pixels die to connect to.
 * When supported the browser will display the list of Pixels dice
 * that are advertising.
 * The same {@link Pixel} instance is returned if the a die is selected
 * again.
 * @returns A promise that resolves to a {@link Pixel} instance.
 * @category Pixel
 */
export async function requestPixel(): Promise<Pixel> {
  const device = await PixelsDevices.requestDevice();
  return getPixelFromDevice(device);
}

/**
 * Returns the {@link Pixel} instance associated with the given Bluetooth
 * device.
 * @param device A Bluetooth device which should be a Pixels die.
 * @returns A {@link Pixel} instance for the given device.
 * @category Pixel
 */
export function getPixelFromDevice(device: BluetoothDevice): Pixel {
  // Keep Pixel instances
  let pixel = _pixels.get(device.id);
  if (!pixel) {
    const session = new BleSession(device.id);
    pixel = new Pixel(session);
    _pixels.set(device.id, pixel);
  }
  return pixel;
}

/**
 * Returns the {@link Pixel} instance corresponding to the given system id.
 * The latter is assigned by the system to Bluetooth devices,
 * see {@link Pixel.systemId}.
 *
 * This function doesn't check the actual availability nor the connection state
 * of the die. The later might be turned off, available or already connected.
 *
 * As of Chrome 114, only Pixels dice authorized by the user during the current
 * browser session may be returned.
 *
 * With the "Use the new permissions backend for Web Bluetooth" flag enabled in
 * Chrome, Pixels dice authorized by the user in previous browser sessions (and
 * not revoked since) may also be returned.
 *
 * The returned promise will resolve to undefined when there is no authorized
 * Pixels die with the given system id.
 *
 * @param systemId A string assigned by the system that uniquely identifies
 *                 a Pixel die.
 * @returns A promise that resolves to a {@link Pixel} instance if the Bluetooth
 *          device was previously authorized, or undefined.
 * @category Pixel
 */
export async function getPixel(systemId: string): Promise<Pixel | undefined> {
  const pixel = _pixels.get(systemId);
  if (pixel) {
    return pixel;
  } else {
    const device = await PixelsDevices.getDevice(systemId);
    return device ? getPixelFromDevice(device) : undefined;
  }
}
