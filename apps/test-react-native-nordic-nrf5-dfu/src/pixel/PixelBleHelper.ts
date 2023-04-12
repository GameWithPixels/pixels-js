import {
  BluetoothLE,
  Device,
  ConnectionStatus,
  AdvertisementData,
  Characteristic,
  BleEvent,
  BleScanResultEvent,
  BleConnectionEvent,
  BleCharacteristicValueChangedEvent,
} from "@systemic-games/react-native-bluetooth-le";
import {
  NativeEventEmitter,
  EmitterSubscription,
  Platform,
  PermissionsAndroid,
} from "react-native";

import {
  Blink,
  deserializeMessage,
  getMessageType,
  MessageOrType,
  MessageTypeValues,
  serializeMessage,
} from "./Messages";

// https://stackoverflow.com/a/70114114
Promise.allSettled =
  Promise.allSettled ||
  ((promises: any) =>
    Promise.all(
      promises.map((p: any) =>
        p
          .then((value: any) => ({
            status: "fulfilled",
            value,
          }))
          .catch((reason: any) => ({
            status: "rejected",
            reason,
          }))
      )
    ));

// Bluetooth helper for communicating with Pixels
export class PixelBleHelper {
  private static readonly _serviceUuid = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
  private static readonly _notifyUuid = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
  private static readonly _writeUuid = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";
  private static readonly _maxMtu = 512;

  private readonly _ble = BluetoothLE;
  private readonly _evEmitter = new NativeEventEmitter(BluetoothLE);
  private readonly _scanResultSub: EmitterSubscription;
  private readonly _connStatusSub: EmitterSubscription;
  private readonly _valueChangedSub: EmitterSubscription;
  private _scanStatusChanged?: (scanning: boolean) => void;
  private _deviceDiscovered?: (
    device: Device,
    advertisementData: AdvertisementData
  ) => void;
  private _conStatusChanged?: (
    peripheral: Device,
    status: ConnectionStatus
  ) => void;
  private _characteristicValueChanged?: (
    peripheral: Device,
    characteristic: Characteristic,
    msgOrType: MessageOrType
  ) => void;
  private readonly _allPixels: Device[] = [];

  constructor() {
    this._ble.bleInitialize();

    // Listen to native scan events
    this._scanResultSub = this._evEmitter.addListener(
      BleEvent.scanResult,
      (ev: BleScanResultEvent) => {
        if (typeof ev === "string") {
          console.log(`Scan error: ${ev}`);
          this._scanStatusChanged?.call(this, false);
        } else {
          try {
            this._deviceDiscovered?.(ev.device, ev.advertisementData);
          } catch (error) {
            console.log(
              `Exception in BLE Scan Result event listener: ${error}`
            );
          }
        }
      }
    );

    // Listen to native connection events
    this._connStatusSub = this._evEmitter.addListener(
      BleEvent.connectionEvent,
      (ev: BleConnectionEvent) => {
        try {
          this._conStatusChanged?.(ev.device, ev.connectionStatus);
        } catch (error) {
          console.log(
            `Exception in BLE Connection Status event listener: ${error}`
          );
        }
      }
    );

    // Listen to native characteristic value changed events
    this._valueChangedSub = this._evEmitter.addListener(
      BleEvent.characteristicValueChanged,
      (ev: BleCharacteristicValueChangedEvent) => {
        try {
          const name = ev.device.name;
          const u8Buffer = new Uint8Array(ev.data);
          const msgOrType = deserializeMessage(u8Buffer.buffer);
          if (msgOrType) {
            console.log(
              `${name}: received message of type ${getMessageType(msgOrType)}`
            );
            if (typeof msgOrType !== "number") {
              // Log message contents
              console.log(msgOrType);
            }
            // Forward event
            this._characteristicValueChanged?.(
              ev.device,
              ev.characteristic,
              msgOrType
            );
          } else {
            console.log(`${name}: received invalid message => ${ev.data}`);
          }
        } catch (error) {
          console.log(
            `Exception in BLE Characteristic Value Changed event listener: ${error}`
          );
        }
      }
    );
  }

  dispose() {
    this._scanResultSub.remove();
    this._connStatusSub.remove();
    this._valueChangedSub.remove();
    this._ble.bleShutdown();
    this._allPixels.length = 0;
  }

  async scanForPixels(
    discoveredDeviceCallback: (
      device: Device,
      advertisementData: AdvertisementData
    ) => void
  ): Promise<boolean> {
    // Ask for permissions on Android
    if (Platform.OS === "android") {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log("BLE permissions granted");
      } else {
        console.log("BLE permissions denied");
        return false;
      }
    }

    // Start BLE scanning
    try {
      await this._ble.startScan(PixelBleHelper._serviceUuid);
    } catch (error: any) {
      console.log(`Failed to start scan: ${error.code} => ${error.message}`);
      return false;
    }

    console.log("Scan started");
    this._deviceDiscovered = discoveredDeviceCallback;
    this._scanStatusChanged?.call(this, true);
    return true;
  }

  stopScanning() {
    this._ble.stopScan();
    this._scanStatusChanged?.call(this, false);
  }

  //Note: callback might be triggered even if status didn't changed
  subscribeScanStatusChanged(scanStatusChanged?: (scanning: boolean) => void) {
    this._scanStatusChanged = scanStatusChanged;
  }

  subscribeConnectionStatusChanged(
    conStatusChanged?: (peripheral: Device, status: ConnectionStatus) => void
  ) {
    this._conStatusChanged = conStatusChanged;
  }

  subscribeCharacteristicValueChanged(
    valueChanged?: (
      peripheral: Device,
      characteristic: Characteristic,
      msgOrType: MessageOrType
    ) => void
  ) {
    this._characteristicValueChanged = valueChanged;
  }

  async connectPixel(device: Device): Promise<Device | undefined> {
    const name = device.name;
    console.log(`${name}: connecting...`);
    try {
      if (await this._ble.createPeripheral(device.systemId)) {
        const pixel = device;
        this._allPixels.push(pixel);
        await this._ble.connectPeripheral(
          pixel.systemId,
          PixelBleHelper._serviceUuid,
          false
        );
        console.log(`${name}: connected, updating MTU...`);
        try {
          const newMTU = await this._ble.requestPeripheralMtu(
            pixel.systemId,
            PixelBleHelper._maxMtu
          );
          console.log(`${name}: MTU set to ${newMTU}`);
        } catch {
          // Can't change MTU more than once
          //TODO check for Error (0x4): GATT INVALID PDU
          console.log(`${name}: MTU not set`);
        }
        // Get characteristics properties
        const characteristics = await this._ble.getServiceCharacteristics(
          pixel.systemId,
          PixelBleHelper._serviceUuid
        );
        characteristics.split(",").forEach(async (uuid) => {
          const props = await this._ble.getCharacteristicProperties(
            pixel.systemId,
            PixelBleHelper._serviceUuid,
            uuid,
            0
          );
          console.log(`  * characteristic ${uuid} has properties = ${props}`);
        });
        // Subscribe
        await this._ble.subscribeCharacteristic(
          pixel.systemId,
          PixelBleHelper._serviceUuid,
          PixelBleHelper._notifyUuid,
          0
        );
        console.log(`${name}: subscribed`);
        return pixel;
      } else {
        console.log(`${name}: failed to create peripheral`);
      }
    } catch (error) {
      console.log(error);
    }
  }

  async disconnectPixel(peripheral: Device): Promise<void> {
    await this._ble.disconnectPeripheral(peripheral.systemId);
  }

  // Sends a message
  async sendMessage(
    peripheral: Device,
    msgOrType: MessageOrType,
    withoutResponse = false
  ): Promise<void> {
    const data = serializeMessage(msgOrType);
    const msgName = getMessageType(msgOrType);
    if (data) {
      console.log(`${peripheral.name}: sending message of type ${msgName}`);
      await this._ble.writeCharacteristic(
        peripheral.systemId,
        PixelBleHelper._serviceUuid,
        PixelBleHelper._writeUuid,
        0,
        Array.from(data),
        withoutResponse
      );
    } else {
      console.log(
        `${peripheral.name}: failed serializing message of type ${msgName}`
      );
    }
  }

  async requestRollState(peripheral: Device): Promise<void> {
    //await this.sendAndWaitForMsg(
    await this.sendMessage(
      peripheral,
      MessageTypeValues.RequestRollState
      //MessageTypeValues.RollState
    );
  }

  async blink(
    peripheral: Device,
    color: number,
    count = 1,
    duration = 1000
  ): Promise<void> {
    //await this.sendAndWaitForMsg(
    await this.sendMessage(
      peripheral,
      new Blink(color, count, duration)
      //MessageTypeValues.BlinkFinished
    );
  }

  async disconnectAll(): Promise<PromiseSettledResult<void>[]> {
    if (this._allPixels.length) {
      console.log(
        `Disconnecting all peripherals: ${this._allPixels
          .map((d) => d.name)
          .join(", ")}`
      );
    } else {
      console.log("No peripheral to disconnect");
    }
    const tasks = this._allPixels.map(async (px) => {
      await this._ble.disconnectPeripheral(px.systemId);
    });
    this._allPixels.length = 0;
    return Promise.allSettled(tasks);
  }
}

export default new PixelBleHelper();
