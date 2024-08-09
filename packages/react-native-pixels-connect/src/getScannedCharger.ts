import { PixelBleUuids } from "@systemic-games/pixels-core-connect";
import { ScannedPeripheral } from "@systemic-games/react-native-bluetooth-le";

import { ScannedCharger } from "./ScannedCharger";
import { ScannedPixelsRegistry } from "./ScannedPixelsRegistry";
import SequentialDataReader from "./SequentialDataReader";

// Function processing scan events from Central and returning a ScannedPixel
export function getScannedCharger(
  peripheral: ScannedPeripheral
): ScannedCharger | undefined {
  const advData = peripheral.advertisementData;
  if (!advData.services?.includes(PixelBleUuids.chargerService)) {
    // Not a Pixels charger
    return;
  }

  // Get the first manufacturer and service data
  const manufacturerData = advData.manufacturersData?.[0];
  const serviceData = advData.servicesData?.[0];

  // Check the manufacturers data
  if (
    manufacturerData &&
    manufacturerData.data?.length >= 1 &&
    serviceData &&
    serviceData.data.length >= 8
  ) {
    // Create data reader for the manufacturer data
    const manufBuffer = new Uint8Array(manufacturerData.data);
    const manufReader = new SequentialDataReader(
      new DataView(manufBuffer.buffer)
    );

    // Create data reader for the service data
    const serviceBuffer = new Uint8Array(serviceData.data);
    const serviceReader = new SequentialDataReader(
      new DataView(serviceBuffer.buffer)
    );

    // Read the advertised values from the service data
    const pixelId = serviceReader.readU32();
    const firmwareDate = new Date(1000 * serviceReader.readU32());

    // Read the advertised values from the manufacturer data
    const ledCount = 3;
    const battery = manufReader.readU8();
    // MSB is battery charging
    const batteryLevel = battery & 0x7f;
    const isCharging = (battery & 0x80) > 0;

    if (pixelId) {
      const systemId = peripheral.systemId;
      const scannedCharger = {
        type: "charger" as "charger",
        systemId,
        pixelId,
        address: peripheral.address,
        name: peripheral.name,
        ledCount,
        firmwareDate,
        rssi: advData.rssi,
        batteryLevel,
        isCharging,
        timestamp: new Date(),
      };
      ScannedPixelsRegistry.register(scannedCharger);
      return scannedCharger;
    } else {
      console.error(
        `Pixel ${peripheral.name}: Received invalid advertising data`
      );
    }
  } else {
    //if (!hasServiceData) {
    console.error(
      `Charger ${
        peripheral.name
      }: Received unsupported advertising data (manufacturerData: ${
        manufacturerData?.data.length ?? -1
      } bytes, serviceData: ${serviceData?.data.length ?? -1} bytes)`
    );
  }
}
