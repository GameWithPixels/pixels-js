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

export interface StartDfuOptions {
  deviceName?: string;
  retries?: number; // Android only
  alternativeAdvertisingNameEnabled?: boolean; // iOS only
  dfuStateListener?: (ev: DfuStateEvent) => void;
  dfuProgressListener?: (ev: DfuProgressEvent) => void;
}

// 48 bits Bluetooth MAC address fits into the 52 bits mantissa
// of a number(64 bits floating point)
// The Bluetooth address of the device when in DFU mode is the normal address + 1
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
        options?.alternativeAdvertisingNameEnabled ?? false
      );
    } else if (Platform.OS === "android") {
      await NordicNrf5Dfu.startDfu(
        deviceAddress,
        options?.deviceName,
        filePath,
        options?.retries ?? 1
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
