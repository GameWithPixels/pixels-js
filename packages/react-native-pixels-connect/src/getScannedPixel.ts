import { PixelDieTypeValues } from "@systemic-games/pixels-core-animation";
import {
  PixelBleUuids,
  DiceUtils,
  PixelColorwayValues,
  PixelRollStateValues,
} from "@systemic-games/pixels-core-connect";
import { assert, getValueKeyName } from "@systemic-games/pixels-core-utils";
import { ScannedPeripheral } from "@systemic-games/react-native-bluetooth-le";

import { ScannedPixel } from "./ScannedPixel";
import { ScannedPixelsRegistry } from "./ScannedPixelsRegistry";
import SequentialDataReader from "./SequentialDataReader";

// Function processing scan events from Central and returning a ScannedPixel
export function getScannedPixel(
  peripheral: ScannedPeripheral
): ScannedPixel | undefined {
  const advData = peripheral.advertisementData;
  if (!advData.services?.includes(PixelBleUuids.service)) {
    // Not a Pixel
    return;
  }

  // Get the first manufacturer and service data
  const manufacturerData = advData.manufacturersData?.[0];
  const serviceData = advData.servicesData?.[0];

  // Check the manufacturers data
  const isOldAdv = !serviceData && manufacturerData?.data.length === 7;
  const hasServiceData = serviceData && serviceData.data.length >= 8;
  if (
    (isOldAdv || hasServiceData) &&
    manufacturerData &&
    manufacturerData.data?.length >= 5
  ) {
    // The values we want to read
    let pixelId: number;
    let ledCount: number;
    let colorwayValue: number;
    let dieTypeValue: number;
    let firmwareDate: Date;
    let batteryLevel: number;
    let isCharging = false;
    let rollStateValue: number;
    let currentFace: number;

    // Create a Scanned Pixel object with some default values
    const manufBuffer = new Uint8Array(manufacturerData.data);
    const manufReader = new SequentialDataReader(
      new DataView(manufBuffer.buffer)
    );

    // Check the services data, Pixels use to share some information
    // in the scan response packet
    if (hasServiceData) {
      // Update the Scanned Pixel with values from manufacturers and services data
      const serviceBuffer = new Uint8Array(serviceData.data);
      const serviceReader = new SequentialDataReader(
        new DataView(serviceBuffer.buffer)
      );

      pixelId = serviceReader.readU32();
      firmwareDate = new Date(1000 * serviceReader.readU32());

      ledCount = manufReader.readU8();
      const designAndColor = manufReader.readU8();
      colorwayValue = designAndColor & 0xf;
      dieTypeValue = (designAndColor >> 4) & 0xf;
      rollStateValue = manufReader.readU8();
      currentFace = DiceUtils.faceFromIndex(manufReader.readU8(), ledCount);
      const battery = manufReader.readU8();
      // MSB is battery charging
      batteryLevel = battery & 0x7f;
      isCharging = (battery & 0x80) > 0;
    } else {
      assert(isOldAdv);
      // Update the Scanned Pixel with values from manufacturers data
      // as advertised from before July 2022
      const companyId = manufacturerData.companyId ?? 0;
      ledCount = (companyId >> 8) & 0xff;
      const _designAndColor = companyId & 0xff; // Not compatible anymore
      colorwayValue = 0;
      dieTypeValue = PixelDieTypeValues.unknown;

      pixelId = manufReader.readU32();
      rollStateValue = manufReader.readU8();
      currentFace = DiceUtils.faceFromIndex(manufReader.readU8(), ledCount);
      batteryLevel = Math.round((manufReader.readU8() / 255) * 100);

      firmwareDate = new Date();
    }

    if (pixelId) {
      const systemId = peripheral.systemId;
      const colorway =
        getValueKeyName(colorwayValue, PixelColorwayValues) ?? "unknown";
      const dieType = dieTypeValue
        ? getValueKeyName(dieTypeValue, PixelDieTypeValues) ?? "unknown"
        : DiceUtils.estimateDieType(ledCount);
      const rollState =
        getValueKeyName(rollStateValue, PixelRollStateValues) ?? "unknown";
      const scannedPixel = {
        systemId,
        pixelId,
        address: peripheral.address,
        name: peripheral.name,
        ledCount,
        colorway,
        dieType,
        firmwareDate,
        rssi: advData.rssi,
        batteryLevel,
        isCharging,
        rollState,
        currentFace,
        timestamp: new Date(),
      };
      ScannedPixelsRegistry.register(scannedPixel);
      return scannedPixel;
    } else {
      console.error(
        `Pixel ${peripheral.name}: Received invalid advertising data`
      );
    }
  } else if (!hasServiceData) {
    // After a reboot we may receive a onetime advertisement payload without the manufacturer data
    console.error(
      `Pixel ${
        peripheral.name
      }: Received unsupported advertising data (manufacturerData: ${
        manufacturerData?.data.length ?? -1
      }, serviceData: ${serviceData?.data.length ?? -1})`
    );
  }
}
