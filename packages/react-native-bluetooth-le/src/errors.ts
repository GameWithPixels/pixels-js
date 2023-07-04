export class CentralNotReadyError extends Error {
  constructor() {
    super("Central not ready");
    this.name = "CentralNotReadyError";
  }
}

export class BluetoothPermissionsDeniedError extends Error {
  constructor() {
    super("Bluetooth permissions denied");
    this.name = "BluetoothPermissionsDeniedError";
  }
}

export class UnknownPeripheralError extends Error {
  constructor(systemId: string) {
    super(`No peripheral found with SystemId ${systemId}`);
    this.name = "UnknownPeripheralError";
  }
}

export class ConnectError extends Error {
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
