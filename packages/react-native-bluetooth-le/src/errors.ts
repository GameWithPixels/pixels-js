/** Base class for errors thrown by this package. */
export class BluetoothLEError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "BluetoothLEError";
  }
}

export class CentralNotReadyError extends BluetoothLEError {
  constructor() {
    super("Central not ready");
    this.name = "CentralNotReadyError";
  }
}

export class BluetoothPermissionsDeniedError extends BluetoothLEError {
  constructor() {
    super("Bluetooth permissions denied");
    this.name = "BluetoothPermissionsDeniedError";
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
