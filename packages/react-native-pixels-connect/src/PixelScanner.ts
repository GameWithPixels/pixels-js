import { PixelsBluetoothIds } from "@systemic-games/pixels-core-connect";
import {
  createTypedEventEmitter,
  EventReceiver,
  SequentialPromiseQueue,
} from "@systemic-games/pixels-core-utils";
import {
  BluetoothState,
  Central,
  ScannedPeripheralEvent,
  ScanStatus,
  ScanStatusEvent,
  ScanStopReason,
} from "@systemic-games/react-native-bluetooth-le";

import { ScannedCharger } from "./ScannedCharger";
import { ScannedPixel } from "./ScannedPixel";
import { getScannedCharger } from "./getScannedCharger";
import { getScannedPixel } from "./getScannedPixel";

/**
 * The different possible operations on a {@link PixelScanner} list.
 */
export type PixelScannerListOperation = Readonly<
  | {
      status: "scanned";
      item: ScannedPixel | ScannedCharger;
    }
  | {
      status: "lost";
      item: Readonly<{
        type: (ScannedPixel | ScannedCharger)["type"];
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
  // Events
  onStatusChange: Readonly<{
    status: ScanStatus;
    stopReason?: ScanStopReason;
  }>;
  onScanListChange: Readonly<{ ops: readonly PixelScannerListOperation[] }>;
}>;

/**
 * Type for a callback filtering {@link ScannedPixel}, used by {@link PixelScanner}.
 */
export type PixelScannerFilter =
  | ((item: ScannedPixel | ScannedCharger) => boolean)
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
  private readonly _devices: (ScannedPixel | ScannedCharger)[] = [];
  private readonly _evEmitter = createTypedEventEmitter<PixelScannerEventMap>();
  private _startPromise?: Promise<void>;
  private _status: ScanStatus = "stopped";
  private _scanFilter: PixelScannerFilter;
  private _minNotifyInterval = 200;
  private _notifyTimeoutId?: ReturnType<typeof setTimeout>;
  private _keepAliveDuration = 5000;
  private _pruneTimeoutId?: ReturnType<typeof setTimeout>;
  private _lastUpdateMs = 0;
  private readonly _touched = new Map<
    number,
    (ScannedPixel | ScannedCharger)["type"]
  >();
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
   * A copy of the list of scanned Pixels (cleared on loosing Bluetooth access
   * if {@link PixelScanner.keepAliveDuration} is greater than zero).
   * Only Pixels matching the {@link PixelScanner.scanFilter} are included.
   */
  get scannedPixels(): ScannedPixel[] {
    return this._devices.filter((i) => i.type === "pixel");
  }

  /**
   * A copy of the list of scanned Chargers (cleared on loosing Bluetooth access
   * if {@link PixelScanner.keepAliveDuration} is greater than zero).
   */
  get scannedChargers(): ScannedCharger[] {
    return this._devices.filter((i) => i.type === "charger");
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
   * @default 200.
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
          () => this._notify(nextUpdate),
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
   * @default 5000.
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
      this._pruneOutdated();
      this._notify(Date.now());
      // Start scanning
      if (this._status === "stopped" && !this._startPromise) {
        Central.addListener("scannedPeripheral", this._onScannedCb);
        Central.addListener("scanStatus", this._onStatusCb);
        this._startPromise = (async () => {
          try {
            await Central.startScan(
              [
                PixelsBluetoothIds.pixel.service,
                PixelsBluetoothIds.charger.service,
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
      clearInterval(this._pruneTimeoutId);
      this._pruneTimeoutId = undefined;
    }
  }

  private _onScannedPeripheral({
    peripheral,
    context,
  }: ScannedPeripheralEvent): void {
    // Ignore events from a scan that was not started by this instance
    if (context !== this) {
      return;
    }
    const services = peripheral.advertisementData.services;
    if (services?.includes(PixelsBluetoothIds.pixel.service)) {
      const pixel = getScannedPixel(peripheral);
      if (pixel) {
        this._processItem(pixel);
      }
    } else if (services?.includes(PixelsBluetoothIds.charger.service)) {
      const charger = getScannedCharger(peripheral);
      if (charger) {
        this._processItem(charger);
      }
    }
  }

  private _onScanStatus({
    status,
    stopReason,
    context,
  }: ScanStatusEvent): void {
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
          // Clear all Pixels & Chargers if Bluetooth has become unavailable
          for (const { type, pixelId } of this._devices) {
            this._touched.set(pixelId, type);
          }
          this._devices.length = 0;
        }
        // Flush pending operations on stop
        this._notify(Date.now());
    }

    // Update status
    const changed = this._status !== status;
    this._status = status;
    this._emitEvent("onStatusChange", { status, stopReason });
    if (changed) {
      this._emitEvent("status", status);
    }
    if (status === "stopped") {
      Central.removeListener("scannedPeripheral", this._onScannedCb);
      Central.removeListener("scanStatus", this._onStatusCb);
    }
  }

  private _processItem(sp: ScannedPixel | ScannedCharger): void {
    if (!this._scanFilter || this._scanFilter(sp)) {
      // Have we already seen this Pixel?
      const index = this._devices.findIndex(
        ({ pixelId }) => pixelId === sp.pixelId
      );
      if (index < 0) {
        // New entry
        this._devices.push(sp);
      } else {
        // Replace previous entry
        this._devices[index] = sp;
      }
      // Store the operation for later notification
      this._touched.set(sp.pixelId, sp.type);
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
      this._notify(now);
      // Otherwise schedule the notification for later if not already done
      this._notifyTimeoutId = setTimeout(
        () => this._notify(nextUpdate),
        nextUpdate - now
      );
    }
  }

  private _notify(now: number): void {
    if (this._notifyTimeoutId) {
      clearTimeout(this._notifyTimeoutId);
      this._notifyTimeoutId = undefined;
    }
    this._lastUpdateMs = now;
    if (this._touched.size) {
      const ops: PixelScannerListOperation[] = [];
      for (const [pixelId, type] of this._touched) {
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
      if (ops.length) {
        this._emitEvent("onScanListChange", { ops });
        if (ops.find((op) => op.item.type === "pixel")) {
          this._emitEvent("scannedPixels", this.scannedPixels);
        }
        if (ops.find((op) => op.item.type === "charger")) {
          this._emitEvent("scannedChargers", this.scannedChargers);
        }
      }
    }
  }

  private _pruneOutdated(): void {
    if (this._pruneTimeoutId) {
      clearInterval(this._pruneTimeoutId);
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
          this._touched.set(sp.pixelId, sp.type);
        }
        this._scheduleNotify();
      }
      // Schedule next pruning
      if (this._devices.length) {
        const older = this._devices.reduce(
          (prev, curr) => Math.min(prev, curr.timestamp.getTime()),
          now
        );
        if (older < now) {
          this._pruneTimeoutId = setInterval(
            () => this._pruneOutdated(),
            older + this._keepAliveDuration - now
          );
        }
      }
    }
  }
}
