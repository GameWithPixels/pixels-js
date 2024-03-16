import { Platform } from "react-native";

import {
  DfuDeviceNotSupportedError,
  DfuBusyError,
  DfuCommunicationError,
  DfuConnectionError,
  DfuError,
  DfuFileInvalidError,
  DfuFirmwareVersionFailureError,
  DfuInternalError,
  DfuInvalidArgumentError,
  DfuRemoteError,
  DfuDeviceDisconnectedError,
} from "./errors";
import {
  DfuProgressEvent,
  DfuStateEvent,
  DfuTargetId,
  addDfuEventListener,
} from "./events";
import DfuModule from "./module";

/**
 * Optional parameters for {@link startDfu}.
 **/
export interface StartDfuOptions {
  /**
   * The callback that is invoked for each DFU event.
   */
  dfuStateListener?: (ev: DfuStateEvent) => void;
  /**
   * The callback that is repeatedly invoked during the upload,
   * with information about the transfer progress.
   */
  dfuProgressListener?: (ev: DfuProgressEvent) => void;
  /**
   * When set to true, disable using the experimental buttonless
   * feature in Secure DFU.
   * @default false
   */
  disableButtonlessServiceInSecureDfu?: boolean;
  /**
   * Setting force DFU to true will prevent from jumping to the DFU
   * Bootloader mode in case there is no DFU Version characteristic
   * (Legacy DFU only!).
   * Use it if the DFU operation can be handled by your device running
   * in the application mode.
   * @default false
   */
  forceDfu?: boolean;
  /**
   * When set to true, the Legacy Buttonless Service will scan for
   * the device advertising with an incremented MAC address, instead of
   * trying to reconnect to the same device.
   * @default false
   */
  forceScanningForNewAddressInLegacyDfu?: boolean;
  /**
   * The device named is used in user notifications.
   * @remarks Android only.
   */
  deviceName?: string;
  /**
   * Number of retries that the DFU service will use to complete DFU.
   * @defaultValue 2 retries.
   * @remarks Android only.
   */
  retries?: number;
  /**
   * Delay that the service will wait before sending each data object
   * in Secure DFU. The delay will be done after a data object is created,
   * and before any data byte is sent.
   * @defaultValue 0 (meaning 400 ms for the first packet and 0ms for the others).
   * @remarks Android only.
   */
  prepareDataObjectDelay?: number;
  /**
   * Time required by the device to reboot. The library will wait for
   * this time before scanning for the device in bootloader mode.
   * @defaultValue 0 ms.
   * @remarks Android only.
   */
  rebootTime?: number;
  /**
   * Scan duration (in milliseconds) when scanning for DFU Bootloader.
   * @defaultValue 5000 ms.
   * @remarks Android only.
   */
  bootloaderScanTimeout?: number;
  /**
   * Whether the DFU service should be started as a foreground service.
   * @default false.
   * @remarks Android only.
   */
  disallowForegroundService?: boolean;
  /**
   * Whether the bond information should be preserver after flashing
   * new application.
   * This feature requires Legacy DFU Bootloader version 0.6 or newer
   * (SDK 8.0.0+).
   * @defaultValue false.
   * @remarks
   * This flag is ignored when Secure DFU button-less Service is used.
   * Android only.
   */
  keepBond?: boolean;
  /**
   * Whether a new bond should be created after the DFU is complete.
   * The old bond information will be removed before.
   * @defaultValue false.
   * @remarks
   * This flag is ignored when Secure DFU button-less Service is used.
   * Android only.
   */
  restoreBond?: boolean;
  /**
   * Alternative name to use in Bootloader mode.
   * If not specified then a random name is generated.
   *
   * The maximum length of the alternative advertising name is 20 bytes.
   * Longer name will be truncated. UTF-8 characters can be cut in the middle.
   * @defaultValue undefined.
   * @remarks iOS only.
   */
  alternativeAdvertisingName?: string;
  /**
   * When the DFU target does not connect before the time runs out,
   * a timeout error is reported.
   * @default 10.
   * @remarks iOS only.
   */
  connectionTimeout?: number;
  /**
   * Disable the ability for the Secure DFU process to resume
   * from where it was.
   * @default false.
   * @remarks iOS only.
   */
  disableResume?: boolean;
}

/**
 * Starts the Device Firmware Update (DFU) service for the Bluetooth device identified
 * by the given target id.
 *
 * The target id may be the device system id or bluetooth address depending on the host OS.
 * See its type {@link DfuTargetId}.
 * Use the helper function {@link getDfuTargetId} to select the correct data in a generic way.
 *
 * Use the optional options.dfuStateListener parameter to get notified about the state
 * changes of the DFU process.
 *
 * @param targetId The target identifier of the device to update.
 * @param filePath The path of the DFU files to send to the device
 *                 (can be a zip, hex or bin file).
 * @param options Optional parameters, see {@link StartDfuOptions}.
 * @throw An object of type descendant from {@link DfuError}.
 *
 * @remarks
 * - The function returns without error if DFU was aborted by calling {@link abortDfu}
 *   and the state is updated to "aborted".
 * - The Bluetooth address of the device when in DFU mode is the normal address + 1.
 * - The device address is passed as "number" as a 48 bits Bluetooth MAC address fits
 *   into the 52 bits mantissa of a JavaScript number (64 bits floating point).
 */
export async function startDfu(
  targetId: DfuTargetId,
  filePath: string,
  options?: StartDfuOptions
): Promise<void> {
  // Wrappers for our listeners that catch errors
  const notifyState = (ev: DfuStateEvent) => {
    try {
      options?.dfuStateListener?.(ev);
    } catch (error) {
      console.warn(`Got an error while notifying DFU state: ${error}`);
    }
  };
  const notifyProgress = (ev: DfuProgressEvent) => {
    try {
      options?.dfuProgressListener?.(ev);
    } catch (error) {
      console.warn(`Got an error while notifying DFU state: ${error}`);
    }
  };

  // Subscribe to the DFU state event
  const stateSub = addDfuEventListener("state", (ev: DfuStateEvent) => {
    const identifier = ev.targetId;
    if (
      identifier === targetId ||
      // The Bluetooth address of the device when in DFU mode is the normal address + 1
      (typeof targetId === "number" && identifier === targetId + 1)
    ) {
      notifyState({ ...ev, targetId });
    }
  });

  // Subscribe to the DFU progress event
  const progressSub =
    options?.dfuProgressListener &&
    addDfuEventListener("progress", (ev: DfuProgressEvent) => {
      const identifier = ev.targetId;
      if (
        identifier === targetId ||
        // The Bluetooth address of the device when in DFU mode is the normal address + 1
        (typeof targetId === "number" && identifier === targetId + 1)
      ) {
        notifyProgress({ ...ev, targetId });
      }
    });

  // Start DFU
  try {
    notifyState({
      targetId,
      state: "initializing",
    });
    // Remove file URI scheme
    if (filePath.startsWith("file://")) {
      if (Platform.OS === "android") {
        filePath = filePath.substring("file://".length);
      }
    }
    // Can't have any other URI scheme
    else if (filePath.indexOf(":/") >= 0) {
      throw new Error("Paths with URI scheme are not supported: " + filePath);
    }
    // Check platform
    if (Platform.OS === "ios") {
      if (typeof targetId !== "string") {
        throw new Error(`targetId should be a string UUID`);
      }
      await DfuModule.startDfu(
        targetId,
        filePath,
        options?.disableButtonlessServiceInSecureDfu ?? false,
        options?.forceDfu ?? false,
        options?.forceScanningForNewAddressInLegacyDfu ?? false,
        options?.alternativeAdvertisingName,
        options?.connectionTimeout ?? 0,
        options?.prepareDataObjectDelay ?? 0,
        options?.disableResume ?? false
      );
    } else if (Platform.OS === "android") {
      if (typeof targetId !== "number") {
        throw new Error(`targetId should be a number`);
      }
      await DfuModule.startDfu(
        targetId,
        options?.deviceName,
        filePath,
        options?.retries ?? 2,
        options?.disableButtonlessServiceInSecureDfu ?? false,
        options?.forceDfu ?? false,
        options?.forceScanningForNewAddressInLegacyDfu ?? false,
        options?.prepareDataObjectDelay ?? 0,
        options?.rebootTime ?? 0,
        options?.bootloaderScanTimeout ?? 0,
        options?.disallowForegroundService ?? false,
        options?.keepBond ?? false,
        options?.restoreBond ?? false
      );
    } else {
      throw new Error("Platform not supported (not Android or iOS)");
    }
  } catch (error: any) {
    notifyState({
      targetId,
      state: "errored",
    });
    const msg = error.message;
    switch (msg) {
      case "DFU FILE NOT FOUND":
        throw new DfuFileInvalidError(targetId, msg);
      case "DFU CHARACTERISTICS NOT FOUND":
        throw new DfuDeviceNotSupportedError(targetId, msg);
      case "FW version failure":
        throw new DfuFirmwareVersionFailureError(targetId, msg);
      // We sometime get this error
      case "DFU DEVICE DISCONNECTED":
        throw new DfuDeviceDisconnectedError(targetId, msg);
      default:
        switch (error.code) {
          // iOS errors
          case "DFUErrorFileInvalid":
            throw new DfuFileInvalidError(targetId, msg);
          case "DFUErrorDeviceNotSupported":
            throw new DfuDeviceNotSupportedError(targetId, msg);
          case "DFUErrorRemoteExtendedErrorFwVersionFailure":
            throw new DfuFirmwareVersionFailureError(targetId, msg);
          case "DFUErrorDeviceDisconnected":
            throw new DfuDeviceDisconnectedError(targetId, msg);
          // Android & common errors
          case "E_INTERNAL":
            throw new DfuInternalError(targetId, msg);
          case "E_INVALID_ARGUMENT":
            throw new DfuInvalidArgumentError(targetId, msg);
          case "E_DFU_BUSY":
            throw new DfuBusyError(targetId, msg);
          case "E_CONNECTION":
            throw new DfuConnectionError(targetId, msg);
          case "E_COMMUNICATION":
            throw new DfuCommunicationError(targetId, msg);
          case "E_DFU_REMOTE":
            throw new DfuRemoteError(targetId, msg);
          case "E_DFU_ERROR":
          default:
            throw new DfuError(targetId, msg);
        }
    }
  } finally {
    // Always unsubscribe from events
    progressSub?.remove();
    stateSub?.remove();
  }
}

/**
 * Aborts the DFU operation after it has started.
 * It won't abort while .
 */
export async function abortDfu(): Promise<void> {
  await DfuModule.abortDfu();
}

/**
 * Pauses the DFU operation.
 */
export async function pauseDfu(): Promise<void> {
  await DfuModule.pauseDfu();
}

/**
 * Resumes a previously paused DFU operation.
 */
export async function resumeDfu(): Promise<void> {
  await DfuModule.resumeDfu();
}

/**
 * The target identifier type of {@link startDfu} depends on the host OS.
 * This helper function returns the correct identifier for the DFU target
 * in a generic way.
 * @param opt.systemId The Bluetooth peripheral system id assigned by the OS.
 * @param opt.address The Bluetooth peripheral MAC address.
 * @returns The DFU target id for the Bluetooth peripheral.
 */
export function getDfuTargetId({
  systemId,
  address,
}: {
  systemId: string;
  address?: number;
}): DfuTargetId {
  if (Platform.OS !== "android") {
    return systemId;
  }
  if (address) {
    return address;
  }
  const mac = parseInt(systemId, 16);
  if (isNaN(mac)) {
    throw new Error(`getDfuTargetId: Invalid systemId: ${systemId}`);
  }
  return mac;
}
