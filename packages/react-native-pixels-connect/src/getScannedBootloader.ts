import {
  getPixelIdFromName,
  isPixelBootloaderName,
  PixelsBluetoothIds,
  toFullUuid,
} from "@systemic-games/pixels-core-connect";
import { ScannedPeripheral } from "@systemic-games/react-native-bluetooth-le";

import { ScannedBootloader } from "./ScannedBootloader";
import { ScannedDevicesRegistry } from "./ScannedDevicesRegistry";

// Function processing scan events from Central and returning a ScannedPixel
export function getScannedBootloader(
  peripheral: ScannedPeripheral
): ScannedBootloader | undefined {
  const advData = peripheral.advertisementData;
  if (!advData.services?.includes(toFullUuid(PixelsBluetoothIds.dfuService))) {
    // Not a device in bootloader mode
    return;
  }

  // Use local name if available (which is the most up-to-date)
  const name = advData.localName ?? peripheral.name;

  // Infer the Pixel ID from the name
  const pixelId = getPixelIdFromName(name);
  if (pixelId) {
    const scannedBootloader = {
      type: "bootloader",
      deviceType: isPixelBootloaderName(name, "charger") ? "charger" : "die",
      systemId: peripheral.systemId,
      name,
      pixelId,
      address: peripheral.address,
      rssi: advData.rssi,
      timestamp: new Date(advData.timestamp),
    } as const;
    ScannedDevicesRegistry.store(scannedBootloader);
    return scannedBootloader;
  }
}
