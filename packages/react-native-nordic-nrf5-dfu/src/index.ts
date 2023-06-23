import { NativeEventEmitter, NativeModules, Platform } from "react-native";

const LINKING_ERROR =
  `The package '@systemic-games/react-native-nordic-nrf5-dfu' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: "" }) +
  "- You rebuilt the app after installing the package\n" +
  "- You are not using Expo managed workflow\n";

const NordicNrf5Dfu = NativeModules.NordicNrf5Dfu
  ? NativeModules.NordicNrf5Dfu
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    );

export type DfuState =
  | "initializing"
  | "deviceConnecting"
  | "deviceDisconnecting"
  | "firmwareValidating"
  | "enablingDfuMode"
  | "dfuStarting"
  | "dfuCompleted"
  | "dfuAborted";

/**
 * The underlying type for the device identifier depends on the platform.
 * - iOS:the system id assigned by the OS to the Bluetooth peripheral.
 * - Android: the Bluetooth address of the device
 */
export type TargetIdentifier = number | string;

export interface DfuStateEvent {
  targetIdentifier: TargetIdentifier; // On Android, the Bluetooth address of the device when in DFU mode is the normal address + 1
  state: DfuState;
}

export interface DfuProgressEvent {
  targetIdentifier: TargetIdentifier; // On Android, the Bluetooth address of the device when in DFU mode is the normal address + 1
  percent: number;
  currentPart: number;
  partsTotal: number;
  avgSpeed: number;
  speed: number;
}

const dfuEventEmitter = new NativeEventEmitter(NordicNrf5Dfu);

export function addDfuStateEventListener(handler: (ev: DfuStateEvent) => void) {
  return dfuEventEmitter.addListener("state", handler);
}

export function addDfuProgressEventListener(
  handler: (ev: DfuProgressEvent) => void
) {
  return dfuEventEmitter.addListener("progress", handler);
}

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
   * @default false
   */
  disableButtonlessServiceInSecureDfu?: boolean;
  /**
   * @default false
   */
  forceDfu?: boolean;
  /**
   * @default false
   */
  forceScanningForNewAddressInLegacyDfu?: boolean;
  /**
   * The device named is used in user notifications.
   * @remarks Android only.
   */
  deviceName?: string;
  /**
   * Sets the number of retries that the DFU service will use to complete
   * DFU.
   * @defaultValue 2 retries.
   * @remarks Android only.
   */
  retries?: number;
  /**
   * This method sets the duration of a delay, that the service will wait
   * before sending each data object in Secure DFU. The delay will be done
   * after a data object is created, and before any data byte is sent.
   * @defaultValue 0 (meaning 400 ms for the first packet and 0ms for the others).
   */
  prepareDataObjectDelay?: number;
  /**
   * The reboot time in milliseconds.
   * @defaultValue 0 ms.
   * @remarks Android only.
   */
  rebootTime?: number;
  /**
   * Sets the scan duration (in milliseconds) when scanning for DFU
   * Bootloader.
   * @defaultValue 5000 ms.
   * @remarks Android only.
   */
  bootloaderScanTimeout?: number;
  /**
   * @default false.
   * @remarks Android only.
   */
  disallowForeground?: boolean;
  /**
   * Sets whether the bond information should be preserver after flashing new application.
   * This feature requires Legacy DFU Bootloader version 0.6 or newer (SDK 8.0.0+).
   * @defaultValue false.
   * @remarks This flag is ignored when Secure DFU button-less Service is used.
   *          Android only.
   */
  keepBond?: boolean;
  /**
   * @defaultValue false.
   */
  restoreBond?: boolean;
  /**
   * Specifies the alternative name to use in Bootloader mode.
   * If not specified then a random name is generated.
   *
   * The maximum length of the alternative advertising name is 20 bytes.
   * Longer name will be truncated. UTF-8 characters can be cut in the middle.
   * @defaultValue undefined.
   * @remarks iOS only.
   */
  alternativeAdvertisingName?: string;
  /**
   * @default 10.
   * @remarks iOS only.
   */
  connectionTimeout?: number;
  /**
   * @default false.
   * @remarks iOS only.
   */
  disableResume?: boolean;
}

/** DFU error thrown when the given file wasn't found. */
export class DfuFileNotFoundError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "DfuFileNotFoundError";
  }
}

/** DFU error thrown when Nordic characteristics for the DFU service are not found. */
export class DfuCharacteristicsNotFoundError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "DfuCharacteristicsNotFoundError";
  }
}

/** DFU error thrown when the update fails because of the firmware version was rejected. */
export class DfuFirmwareVersionFailureError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "DfuCharacteristicsNotFoundError";
  }
}

/**
 * Starts the Device Firmware Update (DFU) service for the Bluetooth device
 * at the given address.
 *
 * Use the optional options.dfuStateListener parameter to get notified about the state
 * changes of the DFU process.
 *
 * @param deviceAddress The Bluetooth address of the device to update.
 * @param filePath The path of the DFU files to send to the device.
 * @param options Optional parameters, see {@link StartDfuOptions}.
 *
 * @remarks
 * - The Bluetooth address of the device when in DFU mode is the normal address + 1
 * - The device address is passed as "number" as a 48 bits Bluetooth MAC address fits
 *   into the 52 bits mantissa of a JavaScript number (64 bits floating point).
 */
export async function startDfu(
  targetIdentifier: TargetIdentifier,
  filePath: string,
  options?: StartDfuOptions
): Promise<void> {
  // Create a promise that will be used to wait for the DFU to complete or abort
  let dfuSuccess: () => void;
  let dfuAborted: () => void;
  const dfuDoneOrAborted = new Promise<void>((resolve, reject) => {
    dfuSuccess = resolve;
    dfuAborted = reject;
  });

  // Subscribe to the DFU state event
  const stateSub = addDfuStateEventListener((ev: DfuStateEvent) => {
    const identifier = ev.targetIdentifier;
    if (
      identifier === targetIdentifier ||
      // The Bluetooth address of the device when in DFU mode is the normal address + 1
      (typeof targetIdentifier === "number" &&
        identifier === targetIdentifier + 1)
    ) {
      if (ev.state === "dfuCompleted") {
        dfuSuccess();
      } else if (ev.state === "dfuAborted") {
        dfuAborted();
        //@ts-expect-error
      } else if (ev.state === "dfuUploading") {
        ev.state = "dfuStarting";
      }
      options?.dfuStateListener?.(ev);
    }
  });

  // Subscribe to the DFU progress event
  const progressSub =
    options?.dfuProgressListener &&
    addDfuProgressEventListener((ev: DfuProgressEvent) => {
      const identifier = ev.targetIdentifier;
      if (
        identifier === targetIdentifier ||
        // The Bluetooth address of the device when in DFU mode is the normal address + 1
        (typeof targetIdentifier === "number" &&
          identifier === targetIdentifier + 1)
      ) {
        options?.dfuProgressListener?.(ev);
      }
    });

  // Start DFU
  try {
    options?.dfuStateListener?.({ targetIdentifier, state: "initializing" });
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
      if (typeof targetIdentifier !== "string") {
        throw new Error(`targetIdentifier should be a string UUID`);
      }
      await NordicNrf5Dfu.startDfu(
        targetIdentifier,
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
      if (typeof targetIdentifier !== "number") {
        throw new Error(`targetIdentifier should be a number`);
      }
      await NordicNrf5Dfu.startDfu(
        targetIdentifier,
        options?.deviceName,
        filePath,
        options?.retries ?? 0,
        options?.disableButtonlessServiceInSecureDfu ?? false,
        options?.forceDfu ?? false,
        options?.forceScanningForNewAddressInLegacyDfu ?? false,
        options?.prepareDataObjectDelay ?? 0,
        options?.rebootTime ?? 0,
        options?.bootloaderScanTimeout ?? 0,
        options?.disallowForeground ?? false,
        options?.keepBond ?? false,
        options?.restoreBond ?? false
      );
    } else {
      throw new Error("Platform not supported (not Android or iOS)");
    }
    await dfuDoneOrAborted;
  } catch (error: any) {
    console.log(error);
    options?.dfuStateListener?.({ targetIdentifier, state: "dfuAborted" });
    const msg = error?.message;
    switch (msg) {
      case "DFU FILE NOT FOUND":
        throw new DfuFileNotFoundError(msg);
      case "DFU CHARACTERISTICS NOT FOUND":
        throw new DfuCharacteristicsNotFoundError(msg);
      case "FW version failure":
      case "FW version check failed":
        throw new DfuFirmwareVersionFailureError(msg);
      default:
        throw error;
    }
  } finally {
    // Always unsubscribe from events
    progressSub?.remove();
    stateSub?.remove();
  }
}

/**
 * Abort an on going DFU if any.
 */
export async function abortDfu(): Promise<void> {
  await NordicNrf5Dfu.abortDfu();
}
