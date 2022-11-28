// eslint-disable-next-line import/namespace
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
  | "deviceConnecting"
  | "deviceDisconnecting"
  | "firmwareValidating"
  | "enablingDfuMode"
  | "dfuStarting"
  | "dfuCompleted"
  | "dfuAborted";

export interface DfuStateEvent {
  deviceAddress: number; // The Bluetooth address of the device when in DFU mode is the normal address + 1
  state: DfuState;
}

export interface DfuProgressEvent {
  deviceAddress: number; // The Bluetooth address of the device when in DFU mode is the normal address + 1
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
   * The device named is used in user notifications.
   * @remarks Android only.
   */
  deviceName?: string;
  /**
   * Sets the number of retries that the DFU service will use to complete
   * DFU. The default value is 2.
   * @remarks Android only.
   */
  retries?: number;
  /**
   * This method sets the duration of a delay, that the service will wait
   * before sending each data object in Secure DFU. The delay will be done
   * after a data object is created, and before any data byte is sent.
   * The default value is 400.
   * @remarks Android only.
   */
  prepareDataObjectDelay?: number;
  /**
   * The reboot time in milliseconds. The default value is 0.
   * @remarks (Android only).
   */
  rebootTime?: number;
  /**
   * Sets the scan duration (in milliseconds) when scanning for DFU
   * Bootloader. The value default is 5000ms.
   * @remarks Android only.
   */
  bootloaderScanTimeout?: number;
  /**
   * Disable the button less DFU feature for non-bonded devices which
   * allows to send a unique name to the device before it is switched
   * to bootloader mode.
   * @remarks iOS only.
   */
  alternativeAdvertisingNameDisabled?: boolean;
  /**
   * The callback that is invoked for each DFU event.
   */
  dfuStateListener?: (ev: DfuStateEvent) => void;
  /**
   * The callback that is repeatedly invoked during the upload,
   * with information about the transfer progress.
   */
  dfuProgressListener?: (ev: DfuProgressEvent) => void;
}

/**
 * Starts the Device Firmware Update (DFU) service for the Bluetooth device
 * at the given address.
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
  deviceAddress: number,
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
    const addr = ev.deviceAddress;
    // The Bluetooth address of the device when in DFU mode is the normal address + 1
    if (addr === deviceAddress || addr === deviceAddress + 1) {
      if (ev.state === "dfuCompleted") {
        dfuSuccess();
      } else if (ev.state === "dfuAborted") {
        dfuAborted();
      }
      options?.dfuStateListener?.(ev);
    }
  });

  // Subscribe to the DFU progress event
  const progressSub =
    options?.dfuProgressListener &&
    addDfuProgressEventListener((ev: DfuProgressEvent) => {
      const addr = ev.deviceAddress;
      // The Bluetooth address of the device when in DFU mode is the normal address + 1
      if (addr === deviceAddress || addr === deviceAddress + 1) {
        options?.dfuProgressListener?.(ev);
      }
    });

  // Start DFU
  try {
    if (filePath.startsWith("file://")) {
      filePath = filePath.substring("file://".length);
    }
    if (Platform.OS === "ios") {
      await NordicNrf5Dfu.startDfu(
        deviceAddress,
        options?.deviceName,
        filePath,
        options?.alternativeAdvertisingNameDisabled ?? false
      );
    } else if (Platform.OS === "android") {
      await NordicNrf5Dfu.startDfu(
        deviceAddress,
        options?.deviceName,
        filePath,
        options?.retries ?? 0,
        options?.prepareDataObjectDelay ?? 0,
        options?.rebootTime ?? 0,
        options?.bootloaderScanTimeout ?? 0
      );
    } else {
      throw new Error("Platform not supported (not Android or iOS)");
    }
    await dfuDoneOrAborted;
  } finally {
    // Always unsubscribe from events
    progressSub?.remove();
    stateSub?.remove();
  }
}
