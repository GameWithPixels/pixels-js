import { NativeModule, NativeModules, Platform } from "react-native";

const LINKING_ERROR =
  `The package '@systemic-games/react-native-bluetooth-le' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: "" }) +
  "- You rebuilt the app after installing the package\n" +
  "- You are not using Expo managed workflow\n";

export const BluetoothLE: NativeBluetoothLE = NativeModules.BluetoothLe
  ? NativeModules.BluetoothLe
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    );

// 48 bits Bluetooth MAC address fits into the 52 bits mantissa
// of a number(64 bits floating point)
// TODO rename to Peripheral?
export type Device = Readonly<{
  systemId: string;
  address: number; // Not available on iOS
  name: string;
}>;

export type ManufacturerData = Readonly<{
  companyId: number;
  data: readonly number[];
}>;

export type ServiceData = Readonly<{
  service: string;
  data: readonly number[];
}>;

export type AdvertisementData = Readonly<{
  localName?: string; // iOS only
  isConnectable: boolean;
  rssi: number;
  txPowerLevel: number;
  timestamp: number;
  services?: readonly string[];
  solicitedServices?: readonly string[];
  manufacturersData?: readonly ManufacturerData[];
  servicesData?: readonly ServiceData[];
}>;

export type Characteristic = Readonly<{
  serviceUuid: string;
  uuid: string;
  instanceIndex: number;
}>;

// See also PixelSessionConnectionStatus from pixels-core-connect
export type ConnectionStatus =
  | "connecting"
  | "connected"
  | "failedToConnect"
  | "ready"
  | "disconnecting"
  | "disconnected";

// See also PixelSessionConnectionEventReason from pixels-core-connect
export type ConnectionEventReason =
  | "unknown"
  | "success"
  | "canceled"
  | "notSupported" // The device does not have the required services.
  | "timeout"
  | "linkLoss"
  | "bluetoothOff"
  | "host" // The local device initiated disconnection.
  | "peripheral"; // The remote device initiated graceful disconnection.

export type BluetoothState =
  | "unknown"
  | "off"
  | "resetting"
  | "unauthorized"
  | "ready";

export interface NativeBluetoothLE extends NativeModule {
  bleInitialize(): Promise<void>;
  bleShutdown(): Promise<void>;
  startScan(servicesUuids?: string): Promise<void>;
  stopScan(): Promise<void>;
  createPeripheral(deviceSystemId: string): Promise<Device>;
  releasePeripheral(deviceSystemId: string): Promise<void>;
  connectPeripheral(
    deviceSystemId: string,
    requiredServicesUuids: string | undefined,
    timeoutMs: number
  ): Promise<void>;
  disconnectPeripheral(deviceSystemId: string): Promise<void>;
  getPeripheralConnectionStatus(
    deviceSystemId: string
  ): Promise<ConnectionStatus>;
  // Getting name also works on non-connected devices
  getPeripheralName(deviceSystemId: string): Promise<string>;
  // Getting address also works on non-connected devices. Android only.
  getPeripheralAddress(deviceSystemId: string): Promise<number>;
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
