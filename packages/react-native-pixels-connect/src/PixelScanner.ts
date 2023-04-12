import {
  PixelDesignAndColorValues,
  PixelRollStateValues,
  PixelBleUuids,
} from "@systemic-games/pixels-core-connect";
import {
  createTypedEventEmitter,
  EventReceiver,
  getValueKeyName,
  SequentialPromiseQueue,
} from "@systemic-games/pixels-core-utils";
import {
  Central,
  ScannedPeripheralEvent,
} from "@systemic-games/react-native-bluetooth-le";

import { ScannedPixel } from "./ScannedPixel";
import SequentialDataReader from "./SequentialDataReader";
import { registerScannedPixel } from "./allScannedPixels";

type Mutable<T> = { -readonly [P in keyof T]: T[P] };

export type PixelScannerEventMap = {
  isScanning: boolean;
  scannedPixel: ScannedPixel;
  newScannedPixel: ScannedPixel;
};

const _queue = new SequentialPromiseQueue();
let _globalScanCount = 0; // TODO remove this

export class PixelScanner {
  // Our event emitter
  private readonly _evEmitter = createTypedEventEmitter<PixelScannerEventMap>();
  // Map of system id to scanned Pixel
  private readonly _scannedPixels = new Map<string, ScannedPixel>();
  private readonly _onScannedPeripheral: (p: ScannedPeripheralEvent) => void;
  private _scanCount = 0;

  get isScanning(): boolean {
    return this._scanCount > 0;
  }

  get scannedPixels(): ScannedPixel[] {
    return [...this._scannedPixels.values()];
  }

  constructor() {
    this._onScannedPeripheral = this.onScannedPeripheral.bind(this);
  }

  addEventListener<K extends keyof PixelScannerEventMap>(
    eventName: K,
    listener: EventReceiver<PixelScannerEventMap[K]>
  ): void {
    this._evEmitter.addListener(eventName, listener);
  }

  removeEventListener<K extends keyof PixelScannerEventMap>(
    eventName: K,
    listener: EventReceiver<PixelScannerEventMap[K]>
  ): void {
    this._evEmitter.removeListener(eventName, listener);
  }

  start(): Promise<void> {
    return _queue.run(async () => {
      // Scan for Pixels
      await Central.scanForPeripheralsWithServices(PixelBleUuids.service);
      // Increment counter once the scan has successfully started
      ++_globalScanCount;

      if (this._scanCount === 0) {
        // Subscribe to scan events
        Central.addScannedPeripheralEventListener(this._onScannedPeripheral);
      }

      // Update scanning state
      this.updateScanCount("inc");
    });
  }

  stop(): Promise<void> {
    return _queue.run(async () => {
      if (this._scanCount === 1) {
        if (_globalScanCount === 1) {
          await Central.stopScanning();
        }
        // Decrement counter once the scan has successfully stopped
        if (_globalScanCount > 0) {
          --_globalScanCount;
        } else {
          console.error("Invalid PixelScanner global scan count");
        }

        // Stop listening to stop scan events
        Central.removeScannedPeripheralEventListener(this._onScannedPeripheral);

        // Update scanning state
        this.updateScanCount("dec");
      }
    });
  }

  clear(): Promise<void> {
    return _queue.run(async () => {
      this._scannedPixels.clear();
    });
  }

  private onScannedPeripheral(ev: ScannedPeripheralEvent): void {
    const scannedPixel: Mutable<ScannedPixel> = {
      systemId: ev.peripheral.systemId,
      pixelId: 0,
      address: ev.peripheral.address,
      name: ev.peripheral.name,
      ledCount: 0,
      designAndColor: "unknown",
      firmwareDate: new Date(0),
      rssi: ev.peripheral.advertisementData.rssi,
      batteryLevel: 0,
      isCharging: false,
      rollState: "unknown",
      currentFace: 0,
    };

    const manufacturerData =
      ev.peripheral.advertisementData.manufacturersData?.[0];
    // Check the manufacturers data, Pixels use to share some information
    // in the advertisement packet: we should have at least 5 bytes of data
    if (manufacturerData && manufacturerData.data?.length >= 5) {
      // Create a Scanned Pixel object with some default values
      const manufBuffer = new Uint8Array(manufacturerData.data);
      const manufReader = new SequentialDataReader(
        new DataView(manufBuffer.buffer)
      );

      let designAndColor = 0;
      let rollState = 0;
      // Check the services data, Pixels use to share some information
      // in the scan response packet
      const serviceData = ev.peripheral.advertisementData.servicesData?.[0];
      if (serviceData && serviceData.data.length >= 8) {
        // Update the Scanned Pixel with values from manufacturers and services data
        const serviceBuffer = new Uint8Array(serviceData.data);
        const serviceReader = new SequentialDataReader(
          new DataView(serviceBuffer.buffer)
        );

        scannedPixel.pixelId = serviceReader.readU32();
        scannedPixel.firmwareDate = new Date(1000 * serviceReader.readU32());

        scannedPixel.ledCount = manufReader.readU8();
        designAndColor = manufReader.readU8();
        rollState = manufReader.readU8();
        scannedPixel.currentFace = manufReader.readU8() + 1;
        const battery = manufReader.readU8();
        // MSB is battery charging
        scannedPixel.batteryLevel = battery & 0x7f;
        scannedPixel.isCharging = (battery & 0x80) > 0;
      } else if (manufacturerData.data.length === 7) {
        // Update the Scanned Pixel with values from manufacturers data
        // as advertised from before July 2022
        const companyId = manufacturerData.companyId ?? 0;
        // eslint-disable-next-line no-bitwise
        scannedPixel.ledCount = (companyId >> 8) & 0xff;
        // eslint-disable-next-line no-bitwise
        designAndColor = companyId & 0xff;

        scannedPixel.pixelId = manufReader.readU32();
        rollState = manufReader.readU8();
        scannedPixel.currentFace = manufReader.readU8() + 1;
        scannedPixel.batteryLevel = Math.round(
          (manufReader.readU8() / 255) * 100
        );
      }
      scannedPixel.designAndColor =
        getValueKeyName(designAndColor, PixelDesignAndColorValues) ?? "unknown";
      scannedPixel.rollState =
        getValueKeyName(rollState, PixelRollStateValues) ?? "unknown";
    }

    if (scannedPixel.pixelId) {
      registerScannedPixel(scannedPixel);
      const isNew = !this._scannedPixels.has(scannedPixel.systemId);
      this._scannedPixels.set(scannedPixel.systemId, scannedPixel);
      if (isNew) {
        this._evEmitter.emit("newScannedPixel", scannedPixel);
      }
      this._evEmitter.emit("scannedPixel", scannedPixel);
    } else {
      console.error(
        `Pixel ${ev.peripheral.name}: Received unsupported advertising data`
      );
    }
  }

  private updateScanCount(op: "inc" | "dec") {
    const wasScanning = this.isScanning;
    this._scanCount = Math.max(0, this._scanCount + (op === "inc" ? 1 : -1));
    if (wasScanning !== this.isScanning) {
      try {
        this._evEmitter.emit("isScanning", this.isScanning);
      } catch (err) {
        console.error(err);
      }
    }
  }
}
