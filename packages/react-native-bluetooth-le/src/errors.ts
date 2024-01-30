import { BluetoothState } from "./events";

/** Base class for errors thrown by this package. */
export class BluetoothLEError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "BluetoothLEError";
  }
}

export class CentralNotInitializedError extends BluetoothLEError {
  constructor() {
    super("Central not initialized");
    this.name = "CentralNotInitializedError";
  }
}

export abstract class ScanError extends BluetoothLEError {
  readonly bluetoothState: BluetoothState;
  constructor(message: string, bluetoothState: BluetoothState) {
    super(message);
    this.name = "ScanError";
    this.bluetoothState = bluetoothState;
  }
}

export class ScanCancelledError extends ScanError {
  constructor() {
    super("Scan cancelled", "ready");
    this.name = "ScanCancelledError";
  }
}

export class BluetoothPermissionsDeniedError extends ScanError {
  constructor() {
    super("Bluetooth permissions denied", "unauthorized");
    this.name = "BluetoothPermissionsDeniedError";
  }
}

export class BluetoothUnavailableError extends ScanError {
  constructor(state: "off" | "resetting" | "unknown") {
    super(`Bluetooth unavailable, state is ${state}`, state);
    this.name = "BluetoothUnavailableError";
  }
}

export class UnknownPeripheralError extends BluetoothLEError {
  constructor(systemId: string) {
    super(`No peripheral found with system id ${systemId}`);
    this.name = "UnknownPeripheralError";
  }
}

export class ConnectError extends BluetoothLEError {
  readonly type: "nativeError" | "inUse" | "disconnected" | "timeout";
  constructor(name: string, type: ConnectError["type"]) {
    super(
      type === "nativeError"
        ? `Failed to create native peripheral for ${name}`
        : type === "inUse"
          ? `Peripheral ${name} was already assigned a connection status callback, call disconnect first before assigning a new callback`
          : type === "disconnected"
            ? `Got disconnected while connecting to peripheral ${name}`
            : `Connection timeout for peripheral ${name}`
    );
    this.name = "ConnectError";
    this.type = type;
  }
}
