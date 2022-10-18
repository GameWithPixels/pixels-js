// eslint-disable-next-line import/namespace
import { NativeModule, NativeModules, Platform } from "react-native";

const LINKING_ERROR =
  `The package '@systemic-games/react-native-bluetooth-le' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: "" }) +
  "- You rebuilt the app after installing the package\n" +
  "- You are not using Expo managed workflow\n";

export const BluetoothLE: NativeBluetoothLE = NativeModules.BluetoothLE
  ? NativeModules.BluetoothLE
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    );

export const BleEvent = {
  scanResult: "scanResult",
  connectionEvent: "connectionEvent",
  characteristicValueChanged: "characteristicValueChanged",
};

// 48 bits Bluetooth MAC address fits into the 52 bits mantissa
// of a number(64 bits floating point)
export interface Device {
  readonly systemId: string;
  readonly address: number;
  readonly name: string;
}

export interface ManufacturerData {
  readonly companyId: number;
  readonly data: number[];
}

export interface ServiceData {
  readonly service: string;
  readonly data: number[];
}

export interface AdvertisementData {
  readonly isConnectable: boolean;
  readonly rssi: number;
  readonly txPowerLevel: number;
  readonly services?: string[];
  readonly solicitedServices?: string[];
  readonly manufacturersData?: ManufacturerData[];
  readonly servicesData?: ServiceData[];
}

export interface ScanResult {
  readonly device: Device;
  readonly advertisementData: AdvertisementData;
  //TODO timestamp
}

export type BleScanResultEvent = ScanResult | string;

export interface Characteristic {
  readonly serviceUuid: string;
  readonly uuid: string;
  readonly instanceIndex: number;
}

export type ConnectionStatus =
  | "connecting"
  | "connected"
  | "failedToConnect"
  | "ready"
  | "disconnecting"
  | "disconnected";

export type ConnectionEventReason =
  | "unknown"
  | "success"
  | "canceled"
  | "notSupported"
  | "timeout"
  | "linkLoss"
  | "adapterOff"
  | "peripheral";

export interface BleConnectionEvent {
  readonly device: Device;
  readonly connectionStatus: ConnectionStatus;
  readonly reason: ConnectionEventReason; //TODO missing!
}

export interface BleCharacteristicValueChangedEvent {
  readonly device: Device;
  readonly characteristic: Characteristic;
  readonly data: number[];
}

export interface NativeBluetoothLE extends NativeModule {
  bleInitialize(): Promise<void>;
  bleShutdown(): Promise<void>;
  startScan(requiredServicesUuids?: string): Promise<void>;
  stopScan(): Promise<void>;
  getDeviceFromAddress(bluetoothAddress: number): Promise<Device>;
  createPeripheral(deviceSystemId: string): Promise<boolean>;
  releasePeripheral(deviceSystemId: string): Promise<void>;
  connectPeripheral(
    deviceSystemId: string,
    requiredServicesUuids: string | undefined,
    autoReconnect: boolean
  ): Promise<void>;
  disconnectPeripheral(deviceSystemId: string): Promise<void>;
  isPeripheralConnected(deviceSystemId: string): Promise<boolean>;
  isPeripheralReady(deviceSystemId: string): Promise<boolean>;
  // Getting name also works on non-connected devices
  getPeripheralName(deviceSystemId: string): Promise<string>;
  getPeripheralMtu(deviceSystemId: string): Promise<number>;
  requestPeripheralMtu(deviceSystemId: string, mtu: number): Promise<number>;
  readPeripheralRssi(deviceSystemId: string): Promise<number>;
  getDiscoveredServices(deviceSystemId: string): Promise<string>;
  getServiceCharacteristics(
    deviceSystemId: string,
    serviceUuid: string
  ): Promise<string>;
  getCharacteristicProperties(
    deviceSystemId: string,
    serviceUuid: string,
    characteristicUuid: string,
    instanceIndex: number
  ): Promise<number>;
  readCharacteristic(
    deviceSystemId: string,
    serviceUuid: string,
    characteristicUuid: string,
    instanceIndex: number
  ): Promise<number[]>;
  writeCharacteristic(
    deviceSystemId: string,
    serviceUuid: string,
    characteristicUuid: string,
    instanceIndex: number,
    data: number[],
    withoutResponse: boolean
  ): Promise<void>;
  subscribeCharacteristic(
    deviceSystemId: string,
    serviceUuid: string,
    characteristicUuid: string,
    instanceIndex: number
  ): Promise<void>;
  unsubscribeCharacteristic(
    deviceSystemId: string,
    serviceUuid: string,
    characteristicUuid: string,
    instanceIndex: number
  ): Promise<void>;
}
