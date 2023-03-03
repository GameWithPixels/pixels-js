import { Pixel } from "@systemic-games/pixels-core-connect";

import BleSession from "./BleSession";
import PixelDevices from "./PixelDevices";

const _pixels = new Map<string, Pixel>();

/**
 * Request user to select a Pixel to connect to.
 * Pixels instances are kept and returned if the same die is selected again.
 * @returns A promise that resolves to a {@link Pixel} instance.
 */
export default async function (): Promise<Pixel> {
  const device = await PixelDevices.requestDevice();
  // Keep Pixel instances
  let pixel = _pixels.get(device.id);
  if (!pixel) {
    const session = new BleSession(device.id);
    pixel = new Pixel(session);
    _pixels.set(device.id, pixel);
  }
  return pixel;
}
