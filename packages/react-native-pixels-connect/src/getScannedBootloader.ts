import {
  PixelsBluetoothIds,
  fromShortBluetoothId,
} from "@systemic-games/pixels-core-connect";
import { ScannedPeripheral } from "@systemic-games/react-native-bluetooth-le";

import { ScannedBootloader } from "./ScannedBootloader";

// Function processing scan events from Central and returning a ScannedPixel
export function getScannedBootloader(
  peripheral: ScannedPeripheral
): ScannedBootloader | undefined {
  const advData = peripheral.advertisementData;
  if (
    !advData.services?.includes(
      fromShortBluetoothId(PixelsBluetoothIds.dfuService)
    )
  ) {
    // Not a device in bootloader mode
    return;
  }

  const pixelId =
    peripheral.name.length === 11 && peripheral.name.startsWith("PXL")
      ? parseInt(peripheral.name.slice(3), 16)
      : 0;

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
