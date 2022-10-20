import { Pixel } from "@systemic-games/pixels-core-connect";

import BleSession from "./BleSession";
import type ScannedPixel from "./ScannedPixel";
export { type ScannedPixel };

const _pixels = new Map<string, Pixel>();

export default function (scannedPixelOrSystemId: ScannedPixel | string): Pixel {
  const systemdId =
    typeof scannedPixelOrSystemId === "string"
      ? scannedPixelOrSystemId
      : scannedPixelOrSystemId.systemId;
  // Keep Pixel instances
  let pixel = _pixels.get(systemdId);
  if (!pixel) {
    pixel = new Pixel(new BleSession(systemdId));
    _pixels.set(systemdId, pixel);
  }
  return pixel;
}
