import { DfuTargetId } from "./events";

/**
 * Parent class for all DFU errors.
 * @see Error codes in Nordic DFU library source code, in file
 *      <a href="https://github.com/NordicSemiconductor/Android-DFU-Library/blob/main/lib/dfu/src/main/java/no/nordicsemi/android/error/GattError.java">GattError.java</a>.
 */
export class DfuError extends Error {
  readonly target: DfuTargetId;
  constructor(target: DfuTargetId, message?: string) {
    super(message);
    this.name = "DfuError";
    this.target = target;
  }
}

/** Internal error, a bug occurred. */
export class DfuInternalError extends DfuError {
  constructor(target: DfuTargetId, message?: string) {
    super(target, message);
    this.name = "DfuInternalError";
  }
}

/** The method was passed an invalid argument. */
export class DfuInvalidArgumentError extends DfuError {
  constructor(target: DfuTargetId, message?: string) {
    super(target, message);
    this.name = "DfuInvalidArgumentError";
  }
}

/** A DFU is already on-going. */
export class DfuBusyError extends DfuError {
  constructor(target: DfuTargetId, message?: string) {
    super(target, message);
    this.name = "DfuBusyError";
  }
}

/** Bluetooth connection error. */
export class DfuConnectionError extends DfuError {
  constructor(target: DfuTargetId, message?: string) {
    super(target, message);
    this.name = "DfuConnectionError";
  }
}

/** Bluetooth communication error. */
export class DfuCommunicationError extends DfuError {
  constructor(target: DfuTargetId, message?: string) {
    super(target, message);
    this.name = "DfuCommunicationError";
  }
}

/** Error during DFU originating from the target device. */
export class DfuRemoteError extends DfuError {
  constructor(target: DfuTargetId, message?: string) {
    super(target, message);
    this.name = "DfuRemoteError";
  }
}

/** DFU error thrown when the given file is invalid or wasn't found. */
export class DfuFileInvalidError extends DfuError {
  constructor(target: DfuTargetId, message?: string) {
    super(target, message);
    this.name = "DfuFileInvalidError";
  }
}

/**
 * DFU error thrown when the Nordic DFU BLE service hasn't been discovered
 * on the target device.
 */
export class DfuDeviceNotSupportedError extends DfuCommunicationError {
  constructor(target: DfuTargetId, message?: string) {
    super(target, message);
    this.name = "DfuDeviceNotSupportedError";
  }
}

/** DFU error thrown when the update fails because of the firmware version was rejected. */
export class DfuFirmwareVersionFailureError extends DfuError {
  constructor(target: DfuTargetId, message?: string) {
    super(target, message);
    this.name = "DfuFirmwareVersionFailureError";
  }
}

/** DFU error thrown when the update fails because of the device disconnected. */
export class DfuDeviceDisconnectedError extends DfuError {
  constructor(target: DfuTargetId, message?: string) {
    super(target, message);
    this.name = "DfuFirmwareVersionFailureError";
  }
}
