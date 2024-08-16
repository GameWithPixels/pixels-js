import {
  ScannedPeripheral,
  PeripheralConnectionEvent,
  PeripheralCharacteristicValueChangedEvent,
} from "./Central";

export type PeripheralState =
  | "disconnected"
  | "connecting"
  | "ready"
  | "disconnecting";

export interface PeripheralInfo {
  scannedPeripheral: ScannedPeripheral;
  state: PeripheralState;
  requiredServices: string;
  connStatusCallbacks: ((ev: PeripheralConnectionEvent) => void)[];
  valueChangedCallbacks: Map<
    string,
    (ev: PeripheralCharacteristicValueChangedEvent) => void
  >;
}
