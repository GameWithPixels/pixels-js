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
export interface Device {
  readonly systemId: string;
  readonly address: number; // Not available on iOS
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

export interface NativeBluetoothLE extends NativeModule {
  bleInitialize(): Promise<void>;
  bleShutdown(): Promise<void>;
  startScan(requiredServicesUuids?: string): Promise<void>;
  stopScan(): Promise<void>;
  getDeviceFromAddress(bluetoothAddress: number): Promise<Device>; // getPeripheralFromAddress??
  createPeripheral(deviceSystemId: string): Promise<Device>;
  releasePeripheral(deviceSystemId: string): Promise<void>;
  connectPeripheral(
    deviceSystemId: string,
    requiredServicesUuids: string | undefined,
    autoReconnect: boolean
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
