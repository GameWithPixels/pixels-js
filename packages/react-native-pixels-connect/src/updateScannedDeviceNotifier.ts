import { assertNever } from "@systemic-games/pixels-core-utils";

import { ScannedDevice } from "./PixelScanner";
import { ScannedBootloaderNotifier } from "./ScannedBootloaderNotifier";
import { ScannedChargerNotifier } from "./ScannedChargerNotifier";
import { ScannedDeviceNotifier } from "./ScannedDeviceNotifier";
import { ScannedMPCNotifier } from "./ScannedMPCNotifier";
import { ScannedPixelNotifier } from "./ScannedPixelNotifier";

export function updateScannedDeviceNotifier(
  scannedDevice: ScannedDevice
): ScannedDeviceNotifier {
  const { type } = scannedDevice;
  switch (type) {
    case "die":
      return ScannedPixelNotifier.getInstance(scannedDevice);
    case "charger":
      return ScannedChargerNotifier.getInstance(scannedDevice);
    case "mpc":
      return ScannedMPCNotifier.getInstance(scannedDevice);
    case "bootloader":
      return ScannedBootloaderNotifier.getInstance(scannedDevice);
    default:
      assertNever(type, `No notifier class for device of type: ${type}`);
  }
}
