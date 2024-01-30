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

export class ScanCancelledError extends BluetoothLEError {
  constructor() {
    super("Scan cancelled");
    this.name = "ScanCancelledError";
  }
}

export class BluetoothPermissionsDeniedError extends BluetoothLEError {
  constructor() {
    super("Bluetooth permissions denied");
    this.name = "BluetoothPermissionsDeniedError";
  }
}

export class BluetoothUnavailableError extends BluetoothLEError {
  constructor(state: "off" | "resetting" | "unknown") {
    super(`Bluetooth unavailable, state is ${state}`);
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
