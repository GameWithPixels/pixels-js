import {
  PixelDesignAndColorValues,
  PixelRollStateValues,
  PixelBleUuids,
} from "@systemic-games/pixels-core-connect";
import {
  assert,
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

// Execution queue
const _queue = new SequentialPromiseQueue();

// Track if we are subscribed to Central scan events
let _subscribedToScanEvents = false;

// The listener given by the user of the scanner
let _userListener: ((scannedPixel: ScannedPixel) => void) | undefined;

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
      currentFace = manufReader.readU8() + 1;
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
      currentFace = manufReader.readU8() + 1;
      batteryLevel = Math.round((manufReader.readU8() / 255) * 100);

      firmwareDate = new Date();
    }

    if (pixelId) {
      const systemId = ev.peripheral.systemId;
      const designAndColor =
        getValueKeyName(designAndColorValue, PixelDesignAndColorValues) ??
        "unknown";
      const rollState =
        getValueKeyName(rollStateValue, PixelRollStateValues) ?? "unknown";
      const scannedPixel = {
        systemId,
        pixelId,
        address: ev.peripheral.address,
        name: ev.peripheral.name,
        ledCount,
        designAndColor,
        firmwareDate,
        rssi: advData.rssi,
        batteryLevel,
        isCharging,
        rollState,
        currentFace,
        timestamp: new Date(),
      };
      ScannedPixelsRegistry.register(scannedPixel);
      _userListener?.(scannedPixel);
    } else {
      console.error(
        `Pixel ${ev.peripheral.name}: Received invalid advertising data`
      );
    }
  } else {
    console.error(
      `Pixel ${ev.peripheral.name}: Received unsupported advertising data`
    );
  }
}

const PixelScanner = {
  isScanning(): boolean {
    return _subscribedToScanEvents && Central.isScanning();
  },

  scannedPixels(): ScannedPixel[] {
    return ScannedPixelsRegistry.getAll();
  },

  start(listener: (scannedPixel: ScannedPixel) => void): Promise<void> {
    return _queue.run(async () => {
      _userListener = listener;
      if (!_subscribedToScanEvents) {
        // Subscribe to scan events
        Central.addScannedPeripheralEventListener(_onScannedPeripheral);
        _subscribedToScanEvents = true;
      }
      // Scan for Pixels
      await Central.scanForPeripheralsWithServices(PixelBleUuids.service);
    });
  },

  stop(): Promise<void> {
    return _queue.run(async () => {
      _userListener = undefined;
      if (_subscribedToScanEvents) {
        // Stop listening to scan events
        Central.removeScannedPeripheralEventListener(_onScannedPeripheral);
        _subscribedToScanEvents = false;
      }

      // Stop the scan
      await Central.stopScanning();
    });
  },
} as const;

export default PixelScanner;
