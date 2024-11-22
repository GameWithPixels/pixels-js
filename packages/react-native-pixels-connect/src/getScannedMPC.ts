import { PixelsBluetoothIds } from "@systemic-games/pixels-core-connect";
import { ScannedPeripheral } from "@systemic-games/react-native-bluetooth-le";

import { ScannedDevicesRegistry } from "./ScannedDevicesRegistry";
import { ScannedMPC } from "./ScannedMPC";
import SequentialDataReader from "./SequentialDataReader";

// Function processing scan events from Central and returning a ScannedPixel
export function getScannedMPC(
  peripheral: ScannedPeripheral
): ScannedMPC | undefined {
  const advData = peripheral.advertisementData;
  if (!advData.services?.includes(PixelsBluetoothIds.mpc.service)) {
    // Not a Pixels MPC
    return;
  }

  // Use local name if available (which is the most up-to-date)
  const name = advData.localName ?? peripheral.name;

  // Get the first manufacturer and service data
  const manufacturerData = advData.manufacturersData?.[0];
  const serviceData = advData.servicesData?.[0];

  // Check the manufacturers data
  if (serviceData && serviceData.data.length >= 8) {
    // Create data reader for the service data
    const serviceBuffer = new Uint8Array(serviceData.data);
    const serviceReader = new SequentialDataReader(
      new DataView(serviceBuffer.buffer)
    );

    // Read the advertised values from the service data
    const pixelId = serviceReader.readU32();
    const firmwareDate = new Date(1000 * serviceReader.readU32());

    if (pixelId) {
      const systemId = peripheral.systemId;
      const scannedMPC = {
        type: "mpc" as "mpc",
        systemId,
        pixelId,
        address: peripheral.address,
        name,
        ledCount: 32,
        firmwareDate,
        rssi: advData.rssi,
        batteryLevel: 0,
        isCharging: false,
        timestamp: new Date(advData.timestamp),
      };
      ScannedDevicesRegistry.store(scannedMPC);
      return scannedMPC;
    } else {
      console.error(`Pixel ${name}: Received invalid advertising data`);
    }
  } else {
    console.error(
      `MPC ${name}: Received unsupported advertising data (manufacturerData: ${
        manufacturerData?.data.length ?? -1
      } bytes, serviceData: ${serviceData?.data.length ?? -1} bytes)`
    );
  }
}
