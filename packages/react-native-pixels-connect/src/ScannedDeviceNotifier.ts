import { ScannedBootloaderNotifier } from "./ScannedBootloaderNotifier";
import { ScannedChargerNotifier } from "./ScannedChargerNotifier";
import { ScannedMPCNotifier } from "./ScannedMPCNotifier";
import { ScannedPixelNotifier } from "./ScannedPixelNotifier";
import { ScannedPixelNotifiersMap } from "./static";

export type ScannedDeviceNotifier =
  | ScannedPixelNotifier
  | ScannedChargerNotifier
  | ScannedMPCNotifier
  | ScannedBootloaderNotifier;

export function getScannedDeviceNotifier(
  pixelId: number
): ScannedDeviceNotifier | undefined {
  return ScannedPixelNotifiersMap.get(pixelId);
}
