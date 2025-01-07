import {
  PixelsBluetoothIds,
  toFullUuid,
} from "@systemic-games/pixels-core-connect";
import {
  createTypedEventEmitter,
  EventReceiver,
  SequentialPromiseQueue,
} from "@systemic-games/pixels-core-utils";
import {
  BluetoothState,
  Central,
  CentralEventMap,
  ScanStatus,
} from "@systemic-games/react-native-bluetooth-le";

import { ScannedBootloader } from "./ScannedBootloader";
import { ScannedCharger } from "./ScannedCharger";
import { ScannedMPC } from "./ScannedMPC";
import { ScannedPixel } from "./ScannedPixel";
import { getScannedBootloader } from "./getScannedBootloader";
import { getScannedCharger } from "./getScannedCharger";
import { getScannedMPC } from "./getScannedMPC";
import { getScannedPixel } from "./getScannedPixel";

export type ScannedDevice =
  | ScannedPixel
  | ScannedCharger
  | ScannedMPC
  | ScannedBootloader;

/**
 * The different possible operations on a {@link PixelScanner} list.
 */
export type PixelScannerListOperation = Readonly<
  | {
      status: "scanned";
      item: ScannedDevice;
    }
  | {
      status: "lost";
      item: Readonly<{
        type: ScannedDevice["type"];
        pixelId: number;
      }>;
    }
>;

/**
 * Event map for {@link PixelScanner} class.
 * This is the list of supported events where the property name
 * is the event name and the property type the event data type.
 */
export type PixelScannerEventMap = Readonly<{
  // Properties
  isReady: boolean;
  status: ScanStatus;
  scannedPixels: readonly ScannedPixel[];
  scannedChargers: readonly ScannedCharger[];
  scannedMPCs: readonly ScannedMPC[];
  scannedBootloaders: readonly ScannedBootloader[];
  // Events
  onStatusChange: Pick<
    CentralEventMap["scanStatus"],
    "status" | "stopReason" | "startError"
  >;
  onScanListChange: Readonly<{ ops: readonly PixelScannerListOperation[] }>;
}>;

/**
 * Type for a callback filtering {@link ScannedDevice}, used by {@link PixelScanner}.
 */
export type PixelScannerFilter =
  | ((item: ScannedDevice) => boolean)
  | null
  | undefined;

/**
 * Represents a list of scanned Pixels that is updated when scanning.
 * Set a callback to {@link PixelScanner.scanListener} to get notified
 * when the list is updated.
 *
 * When powered on but not yet connected, a Pixels die will periodically emit
 * information which is picked up by the scanner.
 * Typically the information is send a few times per second.
 *
 * Calls to the async methods of this class are queued and executed in order
 * across all instances.
 *
 * @remarks
 * Even though the roll state and roll face are included in a
 * {@link ScannedPixel} instance, this data is not emitted in
 * a reliable way.
 *
 * To get reliably notified for rolls, first connect to the die
 * and listen for roll events.
 */
export class PixelScanner {
  // Use a shared queue so start/stop commands across multiple instances
  // are executed in expected order
  private static readonly _sharedQueue = new SequentialPromiseQueue();

  // Instance internal data
  private readonly _devices: ScannedDevice[] = [];
  private readonly _evEmitter = createTypedEventEmitter<PixelScannerEventMap>();
  private _startPromise?: Promise<void>;
  private _status: ScanStatus = "stopped";
  private _scanFilter: PixelScannerFilter;
  private _minNotifyInterval = 300;
  private _notifyTimeoutId?: ReturnType<typeof setTimeout>;
  private _keepAliveDuration = 7000;
  private _pruneTimeoutId?: ReturnType<typeof setTimeout>;
  private _lastUpdateMs = 0;
  private readonly _touched = new Set<string>(); // string = type+pixelId
  private _onBluetoothState?: (ev: { state: BluetoothState }) => void;
  private readonly _onScannedCb = this._onScannedPeripheral.bind(this);
  private readonly _onStatusCb = this._onScanStatus.bind(this);

  /**
   * Whether a scan may be started.
   */
  get isReady(): boolean {
    return Central.getBluetoothState() === "ready";
  }

  /**
   * The scan status of this instance.
   */
  get status(): ScanStatus {
    return this._status;
  }

  /**
   * A copy of the list of scanned dice (cleared on loosing Bluetooth access
   * if {@link PixelScanner.keepAliveDuration} is greater than zero).
   * Only Pixels matching the {@link PixelScanner.scanFilter} are included.
   */
  get scannedPixels(): ScannedPixel[] {
    return this._devices.filter((i) => i.type === "die");
  }

  /**
   * A copy of the list of scanned chargers (cleared on loosing Bluetooth access
   * if {@link PixelScanner.keepAliveDuration} is greater than zero).
   */
  get scannedChargers(): ScannedCharger[] {
    return this._devices.filter((i) => i.type === "charger");
  }

  /**
   * A copy of the list of scanned MPCs (cleared on loosing Bluetooth access
   * if {@link PixelScanner.keepAliveDuration} is greater than zero).
   */
  get scannedMPCs(): ScannedMPC[] {
    return this._devices.filter((i) => i.type === "mpc");
  }

  /**
   * A copy of the list of scanned dice bootloaders (cleared on loosing Bluetooth access
   * if {@link PixelScanner.keepAliveDuration} is greater than zero).
   */
  get scannedBootloaders(): ScannedBootloader[] {
    return this._devices.filter((i) => i.type === "bootloader");
  }

  /**
   * An optional filter to only keep certain Pixels in the list.
   * Setting a new filter will only affect new scan events, the current list of
   * scanned Pixels will stay unchanged.
   **/
  get scanFilter(): PixelScannerFilter {
    return this._scanFilter;
  }
  set scanFilter(scanFilter: PixelScannerFilter) {
    this._scanFilter = scanFilter;
  }

  /**
   * The minimum time interval in milliseconds between two "onScanListChange"
   * notifications.
   * (calls to {@link PixelScanner.scanListener}).
   * A value of 0 will generate a notification on every scan event.
   * @default 300.
   */
  get minNotifyInterval(): number {
    return this._minNotifyInterval;
  }
  set minNotifyInterval(interval: number) {
    if (this._minNotifyInterval !== interval) {
      this._minNotifyInterval = interval;
      // Re-schedule user notification if there was any
      if (this._notifyTimeoutId) {
        clearTimeout(this._notifyTimeoutId);
        const now = Date.now();
        const nextUpdate = Math.max(now, this._lastUpdateMs + interval);
        this._notifyTimeoutId = setTimeout(
          () => this._notify(),
          nextUpdate - now
        );
      }
    }
  }

  /**
   * The duration in milliseconds for which a Scanned Pixel should
   * be considered available since the last received advertisement.
   * A value of 0 keeps the dice forever.
   * @remarks
   * - Removed Scanned Pixels are notified with respect to the value
   * of {@link minNotifyInterval}.
   *  - For a value greater than 0, Scanned Pixels are all immediately
   *    removed when Bluetooth becomes unavailable.
   * @default 7000.
   */
  get keepAliveDuration(): number {
    return this._keepAliveDuration;
  }
  set keepAliveDuration(duration: number) {
    if (this._keepAliveDuration !== duration) {
      this._keepAliveDuration = duration;
      this._pruneOutdated();
    }
  }

  constructor() {
    // Increase the default max listeners to avoid warnings
    this._evEmitter.setMaxListeners(100);
  }

  /**
   * Registers a listener function that will be called when the specified
   * event is raised.
   * See {@link PixelScannerEventMap} for the list of events and their
   * associated data.
   * @param type A case-sensitive string representing the event type to listen for.
   * @param listener The callback function.
   */
  addListener<K extends keyof PixelScannerEventMap>(
    type: K,
    listener: EventReceiver<PixelScannerEventMap[K]>
  ): void {
    if (
      type === "isReady" &&
      !this._onBluetoothState &&
      this._evEmitter.listenerCount(type) === 0
    ) {
      this._onBluetoothState = ({ state }: { state: BluetoothState }) =>
        this._emitEvent("isReady", state === "ready");
      Central.addListener("bluetoothState", this._onBluetoothState);
    }
    this._evEmitter.addListener(type, listener);
  }

  /**
   * Unregisters a listener from receiving events identified by
   * the given event name.
   * See {@link PixelScannerEventMap} for the list of events and their
   * associated data.
   * @param type A case-sensitive string representing the event type.
   * @param listener The callback function to unregister.
   */
  removeListener<T extends keyof PixelScannerEventMap>(
    type: T,
    listener: (ev: PixelScannerEventMap[T]) => void
  ): void {
    this._evEmitter.removeListener(type, listener);
    if (
      type === "isReady" &&
      this._onBluetoothState &&
      this._evEmitter.listenerCount(type) <= 0
    ) {
      Central.removeListener("bluetoothState", this._onBluetoothState);
      this._onBluetoothState = undefined;
    }
  }

  /**
   * Queues a command to start a Bluetooth scan for Pixels and update the list
   * as advertisement packets are being received.
   * If the instance is already scanning it will just notify of pending list
   * operations or clear the list if {@link clearOnStop} is true.
   * @returns A promise.
   * @remarks
   * Calls to the async methods of this class are queued and executed in order.
   *
   * On Android, BLE scanning will fail without error when started more than 5 times
   * over the last 30 seconds.
   */
  startAsync(): Promise<void> {
    return PixelScanner._sharedQueue.run(() => {
      this.flush();
      // Start scanning
      if (this._status === "stopped" && !this._startPromise) {
        Central.addListener("scannedPeripheral", this._onScannedCb);
        Central.addListener("scanStatus", this._onStatusCb);
        this._startPromise = (async () => {
          try {
            await Central.startScan(
              [
                PixelsBluetoothIds.die.service,
                PixelsBluetoothIds.legacyDie.service,
                PixelsBluetoothIds.charger.service,
                PixelsBluetoothIds.mpc.service,
                toFullUuid(PixelsBluetoothIds.dfuService),
              ],
              this
            );
          } finally {
            this._startPromise = undefined;
          }
        })();
      }
      return this._startPromise;
    });
  }

  /**
   * Stops scanning for Pixels.
   * @returns A promise.
   * @remarks
   * Calls to the async methods of this class are queued and executed in order.
   */
  async stopAsync(): Promise<void> {
    return PixelScanner._sharedQueue.run(async () => {
      this._clearTimeouts();
      if (this._status !== "stopped") {
        await Central.stopScan();
      }
    });
  }

  /**
   * Notify of pending scan list operations.
   */
  flush(): void {
    // Remove outdated advertisements
    this._pruneOutdated();
    // Flush pending operations
    this._notify();
  }

  private _emitEvent<T extends keyof PixelScannerEventMap>(
    name: T,
    ev: PixelScannerEventMap[T]
  ): void {
    try {
      this._evEmitter.emit(name, ev);
    } catch (e) {
      console.error(
        `[PixelScanner] Uncaught error in "${name}" event listener: ${e}`
      );
    }
  }

  private _clearTimeouts(): void {
    if (this._notifyTimeoutId) {
      clearTimeout(this._notifyTimeoutId);
      this._notifyTimeoutId = undefined;
    }
    if (this._pruneTimeoutId) {
      clearTimeout(this._pruneTimeoutId);
      this._pruneTimeoutId = undefined;
    }
  }

  private _onScannedPeripheral({
    peripheral,
    context,
  }: CentralEventMap["scannedPeripheral"]): void {
    // Ignore events from a scan that was not started by this instance
    if (context !== this) {
      return;
    }
    const pixel = getScannedPixel(peripheral);
    if (pixel) {
      this._processItem(pixel);
      return;
    }
    const charger = getScannedCharger(peripheral);
    if (charger) {
      this._processItem(charger);
      return;
    }
    const mpc = getScannedMPC(peripheral);
    if (mpc) {
      this._processItem(mpc);
    }
    const bootloader = getScannedBootloader(peripheral);
    if (bootloader) {
      this._processItem(bootloader);
    }
  }

  private _onScanStatus({
    status,
    stopReason,
    startError,
    context,
  }: CentralEventMap["scanStatus"]): void {
    // Ignore events from a scan that was not started by this instance
    if (context !== this) {
      return;
    }

    // Clear timeouts (keep scan timeout if auto-resume is active)
    this._clearTimeouts();

    switch (status) {
      case "starting":
        // Clear pending operations on start (there shouldn't be any)
        if (this._touched.size) {
          console.warn(
            `[PixelScanner] dropping ${this._touched.size} pending operation(s) on start`
          );
          this._touched.clear();
        }
        break;
      case "scanning":
        // Ensure that first scanned Pixel will be immediately notified
        this._lastUpdateMs = 0;
        break;
      case "stopped":
        if (
          stopReason &&
          stopReason !== "success" &&
          stopReason !== "failedToStart" &&
          this._keepAliveDuration > 0
        ) {
          // Clear all devices if Bluetooth has become unavailable
          for (const { type, pixelId } of this._devices) {
            this._touchDevice(pixelId, type);
          }
          this._devices.length = 0;
        }
        // Flush pending operations on stop
        this._notify();
    }

    // Update status
    const changed = this._status !== status;
    this._status = status;
    this._emitEvent("onStatusChange", { status, stopReason, startError });
    if (changed) {
      this._emitEvent("status", status);
    }
    if (status === "stopped") {
      Central.removeListener("scannedPeripheral", this._onScannedCb);
      Central.removeListener("scanStatus", this._onStatusCb);
    }
  }

  private _processItem(sp: ScannedDevice): void {
    if (!this._scanFilter || this._scanFilter(sp)) {
      // Have we already seen this Pixel?
      const index = this._devices.findIndex(
        ({ systemId }) => systemId === sp.systemId
      );
      if (index < 0) {
        // New entry
        this._devices.push(sp);
      } else {
        // Replace previous entry
        const prevType = this._devices[index].type;
        if (prevType !== sp.type) {
          this._touchDevice(sp.pixelId, prevType);
        }
        this._devices[index] = sp;
      }
      // Store the operation for later notification
      this._touchDevice(sp.pixelId, sp.type);
      this._scheduleNotify();
      // Start pruning if needed
      if (this._keepAliveDuration > 0 && !this._pruneTimeoutId) {
        this._pruneOutdated();
      }
    }
  }

  private _scheduleNotify(): void {
    // Prepare for user notification
    const now = Date.now();
    // Are we're past the given interval since the last notification?
    const nextUpdate = this._lastUpdateMs + this._minNotifyInterval;
    if (now >= nextUpdate) {
      // Yes, notify immediately
      this._notify();
    } else if (!this._notifyTimeoutId) {
      // Otherwise schedule the notification for later if not already done
      this._notifyTimeoutId = setTimeout(
        () => this._notify(),
        nextUpdate - now
      );
    }
  }

  private _touchDevice(pixelId: number, type: ScannedDevice["type"]): void {
    this._touched.add(`${pixelId}+${type}`);
  }

  // TODO We may notify when scanning is stopped or Bluetooth off (from startAsync and _scheduleNotify)
  private _notify(): void {
    if (this._notifyTimeoutId) {
      clearTimeout(this._notifyTimeoutId);
      this._notifyTimeoutId = undefined;
    }
    if (this._touched.size) {
      // Keep track of the last notification time
      // Note: we get here much later than scheduled if the event loop is busy
      // which will cause the next notification to be delayed. That's actually
      // fine as we don't want to flood the event loop with notifications.
      this._lastUpdateMs = Date.now();

      const ops: PixelScannerListOperation[] = [];
      for (const str of this._touched) {
        const parts = str.split("+");
        const pixelId = parseInt(parts[0], 10);
        const type = parts[1] as ScannedDevice["type"];
        const item = this._devices.find(
          (sp) => sp.pixelId === pixelId && sp.type === type
        );
        ops.push(
          item
            ? { status: "scanned", item }
            : { status: "lost", item: { pixelId, type } }
        );
      }
      this._touched.clear();
      this._emitEvent("onScanListChange", { ops });
      if (ops.find((op) => op.item.type === "die")) {
        this._emitEvent("scannedPixels", this.scannedPixels);
      }
      if (ops.find((op) => op.item.type === "charger")) {
        this._emitEvent("scannedChargers", this.scannedChargers);
      }
      if (ops.find((op) => op.item.type === "bootloader")) {
        this._emitEvent("scannedBootloaders", this.scannedBootloaders);
      }
      if (ops.find((op) => op.item.type === "mpc")) {
        this._emitEvent("scannedMPCs", this.scannedMPCs);
      }
    }
  }

  private _pruneOutdated(): void {
    if (this._pruneTimeoutId) {
      clearTimeout(this._pruneTimeoutId);
      this._pruneTimeoutId = undefined;
    }
    if (this._keepAliveDuration > 0) {
      const now = Date.now();
      // Find expired advertisements
      const expired = this._devices.filter(
        (p) => now - p.timestamp.getTime() > this._keepAliveDuration
      );
      if (expired.length) {
        // And remove them
        for (const sp of expired.reverse()) {
          const index = this._devices.indexOf(sp);
          this._devices.splice(index, 1);
          this._touchDevice(sp.pixelId, sp.type);
        }
        this._scheduleNotify();
      }
      // Schedule next pruning
      if (this._devices.length) {
        const older = this._devices.reduce(
          (prev, curr) => Math.min(prev, curr.timestamp.getTime()),
          now
        );
        this._pruneTimeoutId = setTimeout(
          () => this._pruneOutdated(),
          older + this._keepAliveDuration - now
        );
      }
    }
  }
}
