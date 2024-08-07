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
  constructor(message: string) {
    super(message);
    this.name = "ScanError";
  }
}

export class ScanAlreadyInProgressError extends ScanError {
  constructor() {
    super("Scan already in progress");
    this.name = "ScanAlreadyInProgressError";
  }
}

export class ScanStartFailed extends ScanError {
  readonly bluetoothState: BluetoothState;
  constructor(bluetoothState: BluetoothState, message?: string) {
    super(
      message ??
        `Scan failed to start for unknown reason, Bluetooth state is ${bluetoothState}`
    );
    this.name = "ScanStartFailed";
    this.bluetoothState = bluetoothState;
  }
}

export class BluetoothNotAuthorizedError extends ScanStartFailed {
  constructor() {
    super("unauthorized", "Bluetooth not authorized or denied by user");
    this.name = "BluetoothNotAuthorizedError";
  }
}

export class BluetoothUnavailableError extends ScanStartFailed {
  constructor(state: "off" | "resetting" | "unknown") {
    super(state, `Bluetooth unavailable, state is ${state}`);
    this.name = "BluetoothUnavailableError";
  }
}

export class UnknownPeripheralError extends BluetoothLEError {
  constructor(systemId: string) {
    super(`No peripheral found with system id ${systemId}`);
    this.name = "UnknownPeripheralError";
  }
}

export type ConnectErrorType =
  | "createFailed"
  | "inUse"
  | "disconnected"
  | "timeout"
  | "bluetoothUnavailable";

function getErrorMessage(name: string, type: ConnectErrorType): string {
  switch (type) {
    case "createFailed":
      return `Failed to create native peripheral for ${name}`;
    case "inUse":
      return `Peripheral ${name} was already assigned a connection status callback, call disconnect first before assigning a new callback`;
    case "disconnected":
      return `Got disconnected while connecting to peripheral ${name}`;
    case "timeout":
      return `Connection timeout for peripheral ${name}`;
    case "bluetoothUnavailable":
      return `Bluetooth unavailable while connecting to peripheral ${name}`;
  }
}

export class ConnectError extends BluetoothLEError {
  readonly type: ConnectErrorType;
  constructor(name: string, type: ConnectError["type"]) {
    super(getErrorMessage(name, type));
    this.name = "ConnectError";
    this.type = type;
  }
}
