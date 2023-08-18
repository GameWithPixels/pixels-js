import {
  AdvertisementData,
  Characteristic,
  ConnectionStatus,
  Device,
} from "./BluetoothLE";

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

export interface BleBluetoothStateEvent {
  state: "unknown" | "off" | "resetting" | "unauthorized" | "ready";
}

export interface ScanResult {
  readonly device: Device;
  readonly advertisementData: AdvertisementData;
}

export type BleScanResultEvent = ScanResult | string;

export interface BleConnectionEvent {
  readonly device: Device;
  readonly connectionStatus: ConnectionStatus;
  readonly reason: ConnectionEventReason;
}

export interface BleCharacteristicValueChangedEvent {
  readonly device: Device;
  readonly characteristic: Characteristic;
  readonly data: number[];
}

/**
 * Event map for {@link Pixel} class.
 * This is the list of supported events where the property name
 * is the event name and the property type the event data type.
 * @category Pixels
 */
export interface BleEventMap {
  bluetoothState: BleBluetoothStateEvent;
  scanResult: BleScanResultEvent;
  connectionEvent: BleConnectionEvent;
  characteristicValueChanged: BleCharacteristicValueChangedEvent;
}

export type BleEvents = keyof BleEventMap;
