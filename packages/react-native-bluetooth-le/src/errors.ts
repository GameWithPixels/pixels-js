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

export class ScanCancelledError extends ScanError {
  constructor() {
    super("Scan cancelled");
    this.name = "ScanCancelledError";
  }
}

export class BluetoothPermissionsDeniedError extends ScanError {
  constructor() {
    super("Bluetooth permissions denied");
    this.name = "BluetoothPermissionsDeniedError";
  }
}

export class BluetoothUnavailableError extends ScanError {
  constructor(state: "off" | "resetting" | "unknown") {
    super(`Bluetooth unavailable, state is ${state}`);
    this.name = "BluetoothUnavailableError";
  }
}

export class ScanUnspecifiedStartError extends ScanError {
  constructor() {
    super("Unspecified error on starting scan");
    this.name = "UnspecifiedScanStartError";
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
