import { BluetoothState } from "./BluetoothLE";

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
    super("Scan already in progress or starting");
    this.name = "ScanAlreadyInProgressError";
  }
}

export class ScanStartError extends ScanError {
  readonly bluetoothState: BluetoothState;
  constructor(bluetoothState: BluetoothState, message?: string) {
    super(
      message ??
        `Scan failed to start for unknown reason, Bluetooth state is ${bluetoothState}`
    );
    this.name = "ScanStartError";
    this.bluetoothState = bluetoothState;
  }
}

export class BluetoothNotAuthorizedError extends ScanStartError {
  constructor() {
    super("unauthorized", "Bluetooth not authorized or denied by user");
    this.name = "BluetoothNotAuthorizedError";
  }
}

export class BluetoothUnavailableError extends ScanStartError {
  constructor(state: "off" | "resetting" | "unknown") {
    super(state, `Bluetooth unavailable, state is ${state}`);
    this.name = "BluetoothUnavailableError";
  }
}

export class UnknownPeripheralError extends BluetoothLEError {
  constructor(systemId: string) {
    super(`No known peripheral with system id ${systemId}`);
    this.name = "UnknownPeripheralError";
  }
}

export type ConnectErrorType =
  | "createFailed"
  | "disconnected"
  | "timeout"
  | "bluetoothUnavailable"
  | "cancelled"
  | "gattError" // Android only, usually means maximum number of connections reached
  | "error";

function getErrorMessage(name: string, type: ConnectErrorType): string {
  switch (type) {
    case "createFailed":
      return `Failed to create native peripheral for ${name}`;
    case "disconnected":
      return `Got disconnected while connecting to peripheral ${name}`;
    case "timeout":
      return `Connection timeout for peripheral ${name}`;
    case "bluetoothUnavailable":
      return `Bluetooth unavailable while connecting to peripheral ${name}`;
    case "cancelled":
      return `Connection cancelled for peripheral ${name}`;
    case "gattError":
      return `GATT error while trying to connect to peripheral ${name}, possibly because maximum number of connections reached`;
    case "error":
      return `Failed to connect to peripheral ${name}`;
  }
}

export class ConnectError extends BluetoothLEError {
  readonly type: ConnectErrorType;
  readonly nativeCode?: string;
  constructor(name: string, type: ConnectErrorType, code?: string) {
    super(getErrorMessage(name, type) + (code ? ` (${code})` : ""));
    this.name = "ConnectError";
    this.type = type;
    this.nativeCode = code;
  }
}
