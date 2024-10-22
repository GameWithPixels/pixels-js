import {
  getPixelIdFromName,
  PixelsBluetoothIds,
  toFullUuid,
} from "@systemic-games/pixels-core-connect";
import { ScannedPeripheral } from "@systemic-games/react-native-bluetooth-le";

import { ScannedBootloader } from "./ScannedBootloader";

// Function processing scan events from Central and returning a ScannedPixel
export function getScannedBootloader(
  peripheral: ScannedPeripheral
): ScannedBootloader | undefined {
  const advData = peripheral.advertisementData;
  if (!advData.services?.includes(toFullUuid(PixelsBluetoothIds.dfuService))) {
    // Not a device in bootloader mode
    return;
  }

  const pixelId =
    getPixelIdFromName(peripheral.name) ??
    (advData.localName && getPixelIdFromName(advData.localName));
  if (pixelId) {
    return {
      type: "bootloader",
      systemId: peripheral.systemId,
      name: peripheral.name,
      pixelId,
      address: peripheral.address,
      rssi: advData.rssi,
      timestamp: new Date(advData.timestamp),
    };
  }
}
