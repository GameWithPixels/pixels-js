import { EmitterSubscription, NativeEventEmitter } from "react-native";

import DfuModule from "./module";

/**
 * The underlying type for the device identifier depends on the platform.
 * - iOS: the system id assigned by the OS to the Bluetooth peripheral.
 * - Android: the Bluetooth address of the device.
 * @remarks On Android, the Bluetooth address of the device when in DFU mode
 *          is the normal address + 1.
 */
export type DfuTargetId = number | string;

/**
 * The list of possible DFU states.
 * They are roughly listed in the order in which they occur.
 */
export type DfuState =
  /**
   * Initializing the DFU service.
   * This state is notified immediately upon calling {@link startDfu}
   * and before validating the given parameters.
   */
  | "initializing"
  /** The DFU service has started connecting with the DFU target. */
  | "connecting"
  /**
   * The DFU service has successfully connected, discovered services
   * and found DFU service on the DFU target.
   */
  | "connected"
  /**
   * The DFU process is starting.
   * This includes reading the DFU Version characteristic, sending
   * the DFU_START command as well as the Init packet, if set.
   * @remarks Android only.
   */
  | "starting"
  /**
   * The DFU service discovered that the DFU target is in the application
   * mode and must be switched to DFU mode.
   * The switch command will be sent and the DFU process should start again.
   * There will be no "disconnected" DFU state notification following
   * this event.
   */
  | "enablingDfuMode"
  /** The DFU process was started and bytes about to be sent. */
  | "uploading"
  /** The new firmware is being validated on the target device. */
  | "validatingFirmware"
  /** The DFU service started to disconnect from the target device. */
  | "disconnecting"
  /**
   * The DFU service disconnected from the device.
   * The device has been reset.
   * @remarks Android only.
   */
  | "disconnected"
  /** The DFU process succeeded. */
  | "completed"
  /** The DFU process has been aborted. */
  | "aborted";

/**
 * Data structure for DFU state events,
 * see {@link DfuEventMap}.
 */
export interface DfuStateEvent {
  /** Identifier of the target device. */
  targetId: DfuTargetId;
  /** New state of the DFU operations. */
  state: DfuState;
}

/**
 * Data structure for DFU upload progress events,
 * see {@link DfuEventMap}.
 */
export interface DfuProgressEvent {
  /** Identifier of the target device. */
  targetId: DfuTargetId;
  /** Upload progress in percent. */
  percent: number;
  /** Current part being uploaded. */
  part: number;
  /** Total number of parts to upload. */
  partsTotal: number;
  /** Upload speed in bytes per second. */
  speed: number;
  /** Average upload speed in bytes per second. */
  averageSpeed: number;
}

/**
 * Event map for {@link Pixel} class.
 * This is the list of supported events where the property name
 * is the event name and the property type the event data type.
 * @category Pixel
 */
export interface DfuEventMap {
  state: DfuStateEvent;
  progress: DfuProgressEvent;
}

// Native event emitter
const dfuEventEmitter = new NativeEventEmitter(DfuModule);

export function addDfuEventListener<K extends keyof DfuEventMap>(
  eventName: K,
  listener: (ev: DfuEventMap[K]) => void
): EmitterSubscription {
  return dfuEventEmitter.addListener(eventName, listener);
}
