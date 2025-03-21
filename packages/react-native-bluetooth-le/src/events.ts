import {
  AdvertisementData,
  BluetoothState,
  Characteristic,
  ConnectionEventReason,
  ConnectionStatus,
  Device,
} from "./BluetoothLE";

export type BleBluetoothStateEvent = Readonly<{
  state: BluetoothState;
}>;

export type ScanResult = Readonly<{
  device: Device;
  advertisementData: AdvertisementData;
}>;

export type BleScanResultEvent = ScanResult | Readonly<{ error: string }>;

export type BleConnectionEvent = Readonly<{
  device: Device;
  connectionStatus: ConnectionStatus;
  reason: ConnectionEventReason;
}>;

export type BleCharacteristicValueChangedEvent = Readonly<{
  device: Device;
  characteristic: Characteristic;
  data: readonly number[];
}>;

/**
 * Event map for {@link Pixel} class.
 * This is the list of supported events where the property name
 * is the event name and the property type the event data type.
 * @category Pixels
 */
export type BleEventMap = Readonly<{
  bluetoothState: BleBluetoothStateEvent;
  scanResult: BleScanResultEvent;
  connectionEvent: BleConnectionEvent;
  characteristicValueChanged: BleCharacteristicValueChangedEvent;
}>;

export type BleEvents = keyof BleEventMap;
