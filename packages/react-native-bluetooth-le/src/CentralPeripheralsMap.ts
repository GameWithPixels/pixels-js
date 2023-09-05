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

// Keep list of peripherals in a separate file so it is not reloaded by Fast Refresh after a change in Central
export const CentralPeripheralsMap: Map<string, PeripheralInfo> = new Map();
