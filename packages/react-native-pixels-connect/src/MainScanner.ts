import {
  PixelColorwayValues,
  PixelRollStateValues,
  PixelBleUuids,
  PixelDieType,
} from "@systemic-games/pixels-core-connect";
import {
  assert,
  createTypedEventEmitter,
  getValueKeyName,
  SequentialPromiseQueue,
} from "@systemic-games/pixels-core-utils";
import {
  Central,
  ScannedPeripheralEvent,
} from "@systemic-games/react-native-bluetooth-le";

import { ScannedPixel } from "./ScannedPixel";
import ScannedPixelsRegistry from "./ScannedPixelsRegistry";
import SequentialDataReader from "./SequentialDataReader";

// Try to get die type from number of LEDs
function _getDieType(ledCount: number): PixelDieType {
  // For now we infer the die type from the number of LEDs, but eventually
  // that value will be part of identification data.
  switch (ledCount) {
    case 4:
      return "d4";
    case 6:
      return "d6";
    case 8:
      return "d8";
    case 10:
      return "d10";
    case 12:
      return "d12";
    case 20:
      return "d20";
    case 21:
      return "d6pipped";
    default:
      return "unknown";
  }
}

function _getFace(faceIndex: number, ledCount: number): number {
  return faceIndex + (ledCount === 10 ? 0 : 1);
}

// Execution queue
const _queue = new SequentialPromiseQueue();

// Track the number of started scans
let _scanCount = 0;

// The listener given by the user of the scanner
const _scanEvEmitter = createTypedEventEmitter<{
  scannedPixel: ScannedPixel;
}>();

// Callback given to Central for scan events
function _onScannedPeripheral(ev: ScannedPeripheralEvent): void {
  const advData = ev.peripheral.advertisementData;
  if (!advData.services?.includes(PixelBleUuids.service)) {
    // We got an event from another scan (since Central scanning is global)
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
    let designAndColorValue: number;
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
      designAndColorValue = manufReader.readU8();
      rollStateValue = manufReader.readU8();
      currentFace = _getFace(manufReader.readU8(), ledCount);
      const battery = manufReader.readU8();
      // MSB is battery charging
      batteryLevel = battery & 0x7f;
      isCharging = (battery & 0x80) > 0;
    } else {
      assert(isOldAdv);
      // Update the Scanned Pixel with values from manufacturers data
      // as advertised from before July 2022
      const companyId = manufacturerData.companyId ?? 0;
      // eslint-disable-next-line no-bitwise
      ledCount = (companyId >> 8) & 0xff;
      // eslint-disable-next-line no-bitwise
      designAndColorValue = companyId & 0xff;

      pixelId = manufReader.readU32();
      rollStateValue = manufReader.readU8();
      currentFace = _getFace(manufReader.readU8(), ledCount);
      batteryLevel = Math.round((manufReader.readU8() / 255) * 100);

      firmwareDate = new Date();
    }

    if (pixelId) {
      const systemId = ev.peripheral.systemId;
      const designAndColor =
        getValueKeyName(designAndColorValue, PixelColorwayValues) ?? "unknown";
      const rollState =
        getValueKeyName(rollStateValue, PixelRollStateValues) ?? "unknown";
      const scannedPixel = {
        systemId,
        pixelId,
        address: ev.peripheral.address,
        name: ev.peripheral.name,
        ledCount,
        designAndColor,
        dieType: _getDieType(ledCount),
        firmwareDate,
        rssi: advData.rssi,
        batteryLevel,
        isCharging,
        rollState,
        currentFace,
        timestamp: new Date(),
      };
      ScannedPixelsRegistry.register(scannedPixel);
      _scanEvEmitter.emit("scannedPixel", scannedPixel);
    } else {
      console.error(
        `Pixel ${ev.peripheral.name}: Received invalid advertising data`
      );
    }
  } else if (!hasServiceData) {
    // After a reboot we may receive a onetime advertisement payload without the manufacturer data
    console.error(
      `Pixel ${
        ev.peripheral.name
      }: Received unsupported advertising data (manufacturerData: ${
        manufacturerData?.data.length ?? -1
      }, serviceData: ${serviceData?.data.length ?? -1})`
    );
  }
}

/**
 * Global object for scanning for Pixels using Bluetooth.
 */
const MainScanner = {
  /** Gets whether a Pixels scan is running. */
  isScanning(): boolean {
    return _scanCount > 0 && Central.isScanning();
  },

  /** Gets a copy of the ordered list of scanned Pixels. */
  scannedPixels(): ScannedPixel[] {
    return ScannedPixelsRegistry.getAll();
  },

  /**
   * Hook the given callback to Pixels scan events and starts scanning for Pixel
   * over Bluetooth.
   * @param listener A callback for scan events.
   * @returns A promise.
   * @remarks On Android, BLE scanning will fail without error when started more
   * than 5 times over the last 30 seconds.
   */
  addListener(listener: (scannedPixel: ScannedPixel) => void): Promise<void> {
    return _queue.run(async () => {
      _scanEvEmitter.addListener("scannedPixel", listener);
      if (!_scanCount) {
        // Subscribe to scan events
        Central.addListener("scannedPeripheral", _onScannedPeripheral);
      }
      _scanCount += 1;
      // Scan for Pixels
      try {
        await Central.startScanning(PixelBleUuids.service);
      } catch (e) {
        if (_scanCount) {
          _scanCount -= 1;
          if (!_scanCount) {
            Central.removeListener("scannedPeripheral", _onScannedPeripheral);
          }
        }
        throw e;
      }
    });
  },

  /**
   * Unhook the given callback to Pixels scan events and starts scanning for Pixel
   * over Bluetooth.
   * @param listener The same callback that was given to a previous call to {@link MainScanner.addListener}.
   * @returns A promise.
   */
  removeListener(
    listener: (scannedPixel: ScannedPixel) => void
  ): Promise<void> {
    return _queue.run(async () => {
      _scanEvEmitter.removeListener("scannedPixel", listener);
      if (_scanCount) {
        _scanCount -= 1;
        if (!_scanCount) {
          // Stop listening to scan events
          Central.removeListener("scannedPeripheral", _onScannedPeripheral);
          // And stop the scan
          await Central.stopScanning();
        }
      }
    });
  },
} as const;

export default MainScanner;
