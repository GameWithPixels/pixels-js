import { PixelBleUuids } from "@systemic-games/pixels-core-connect";
import {
  createTypedEventEmitter,
  SequentialPromiseQueue,
} from "@systemic-games/pixels-core-utils";
import {
  BluetoothState,
  Central,
  ScanError,
  ScanEvent,
  ScanStatus,
} from "@systemic-games/react-native-bluetooth-le";

import { ScannedPixel } from "./ScannedPixel";
import { getScannedPixel } from "./getScannedPixel";

/**
 * The different possible operations on a {@link PixelScanner} list.
 */
export type PixelScannerListOperation =
  | { readonly type: "cleared" }
  | { readonly type: "scanned"; readonly scannedPixel: ScannedPixel }
  | { readonly type: "removed"; readonly pixelId: number };

/**
 * Event data for the "scanStatus" event of {@link PixelScannerEventMap}.
 */
export interface PixelScannerStatusEvent {
  readonly scanStatus: ScanStatus;
  readonly stopReason?: ScanError;
}

/**
 * Event map for {@link PixelScanner} class.
 * This is the list of supported events where the property name
 * is the event name and the property type the event data type.
 */
export interface PixelScannerEventMap {
  isAvailable: boolean; // Property change event
  isScanning: boolean; // Property change event
  scanStatus: PixelScannerStatusEvent;
  scannedPixels: ScannedPixel[]; // Property change event
  scanListOperations: { readonly ops: PixelScannerListOperation[] };
}

/**
 * Type for a callback filtering {@link ScannedPixel}, used by {@link PixelScanner}.
 */
export type PixelScannerFilter =
  | ((scannedPixel: ScannedPixel) => boolean)
  | null
  | undefined;

/**
 * Represents a list of scanned Pixels that is updated when scanning.
 * Set a callback to {@link PixelScanner.scanListener} to get notified
 * when the list is updated.
 *
 * When powered on but not yet connected, a Pixels die will periodically
 * emit information which is picked up by the scanner.
 * Typically the information is send a few times per second.
 *
 * @remarks Even though the roll state and roll face are included in a
 *          {@link ScannedPixel} instance, this data is not emitted in
 *          a reliable way.
 *          To get reliably notified for rolls, first connect to the die
 *          and listen for roll events.
 */
export class PixelScanner {
  // Use a shared queue so start/stop commands across multiple instances
  // are executed in expected order
  private static readonly _queue = new SequentialPromiseQueue();

  // Instance internal data
  private readonly _pixels: ScannedPixel[] = [];
  private readonly _evEmitter = createTypedEventEmitter<PixelScannerEventMap>();
  private _scanStatus: ScanStatus = "stopped";
  private _scanTimeoutId?: ReturnType<typeof setTimeout>;
  private _scanFilter: PixelScannerFilter;
  private _clearOnStop = false;
  private _autoResume = false;
  private _minNotifyInterval = 200;
  private _notifyTimeoutId?: ReturnType<typeof setTimeout>;
  private _keepAliveDuration = 5000;
  private _pruneTimeoutId?: ReturnType<typeof setTimeout>;
  private _lastUpdate = new Date();
  private readonly _touched = new Set<number>();
  private _autoResumeCallback?: (ev: { state: BluetoothState }) => void;
  private _isAvailableEvCounter = 0;
  private _isAvailableCallback?: (ev: { state: BluetoothState }) => void;

  /**
   * Whether a scan may be started.
   */
  get isAvailable(): boolean {
    return Central.getBluetoothState() === "ready";
  }

  /**
   * Whether this instance is scanning.
   */
  get isScanning(): boolean {
    return this._scanStatus !== "stopped";
  }

  /**
   * A copy of the list of scanned Pixels since the last call to {@link PixelScanner.clear}.
   * Only Pixels matching the {@link PixelScanner.scanFilter} are included.
   */
  get scannedPixels(): ScannedPixel[] {
    return [...this._pixels];
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
   * Whether the list of scanned Pixels is cleared when the scanner stops.
   * @default false.
   */
  get clearOnStop(): boolean {
    return this._clearOnStop;
  }
  set clearOnStop(value: boolean) {
    this._clearOnStop = value;
  }

  /**
   * When a successful scan gets interrupted because of the Bluetooth state,
   * indicates wether to automatically restart scanning when Bluetooth becomes available
   * @default false.
   */
  get autoResume(): boolean {
    return this._autoResume;
  }
  set autoResume(value: boolean) {
    this._autoResume = value;
    if (!value) {
      this._clearAutoResume();
    } else if (this.isScanning) {
      this._activateAutoResume();
    }
  }

  /**
   * The minimum time interval in milliseconds between two "scanListOperations"
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
        const nextUpdate = Math.max(now, this._lastUpdate.getTime() + interval);
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
   * @remarks Removed Scanned Pixels are notified with respect to
   *          the value of {@link minNotifyInterval}.
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
   * Whether the scanner is currently scanning for Pixels for a specified duration.
   */
  get hasTimeout(): boolean {
    return !!this._scanTimeoutId;
  }

  addListener<T extends keyof PixelScannerEventMap>(
    name: T,
    listener: (ev: PixelScannerEventMap[T]) => void
  ) {
    if (name === "isAvailable") {
      ++this._isAvailableEvCounter;
      if (!this._isAvailableCallback) {
        this._isAvailableCallback = ({ state }: { state: BluetoothState }) =>
          this._emitEvent("isAvailable", state === "ready");
        Central.addListener("bluetoothState", this._isAvailableCallback);
      }
    }
    return this._evEmitter.addListener(name, listener);
  }

  removeListener<T extends keyof PixelScannerEventMap>(
    name: T,
    listener: (ev: PixelScannerEventMap[T]) => void
  ) {
    if (name === "isAvailable") {
      if (this._isAvailableEvCounter) {
        --this._isAvailableEvCounter;
      }
      if (!this._isAvailableEvCounter && this._isAvailableCallback) {
        Central.removeListener("bluetoothState", this._isAvailableCallback);
        this._isAvailableCallback = undefined;
      }
    }
    return this._evEmitter.removeListener(name, listener);
  }

  /**
   * Starts a Bluetooth scan for Pixels and update the list as advertisement
   * packets are being received.
   * If the instance is already scanning it will just notify of pending list
   * operations or clear the list if {@link clearOnStop} is true.
   * @param opt.duration The duration in milliseconds for which the scan should run. Default: 0.
   * @param opt.overrideContinuous Whether a scan with a specified duration can override
   *                               an ongoing continuous scan. Default: false.
   * @returns A promise.
   * @remarks Calls to the async methods of this class are queued
   *          and executed in order.
   *          On Android, BLE scanning will fail without error when started more
   *          than 5 times over the last 30 seconds.
   */
  async start(opt?: {
    duration?: number;
    overrideContinuous?: boolean;
  }): Promise<void> {
    return PixelScanner._queue.run(async () => {
      const continuous = this.isScanning && !this._scanTimeoutId;
      if (this._scanTimeoutId) {
        clearTimeout(this._scanTimeoutId);
        this._scanTimeoutId = undefined;
      }
      const duration = opt?.duration ?? 0;
      if (duration > 0 && (!continuous || !!opt?.overrideContinuous)) {
        this._scanTimeoutId = setTimeout(
          () =>
            this.stop().catch((e) =>
              console.log(`PixelScanner: Error stopping scan on timeout: ${e}`)
            ),
          duration
        );
      }
      this._pruneOutdated();
      this._notify(Date.now());
      // Start scanning
      if (!this.isScanning) {
        await Central.startScan(
          PixelBleUuids.service,
          this._processScanEvents.bind(this)
        );
        if (this._autoResume) {
          this._activateAutoResume();
        }
      }
    });
  }

  /**
   * Stops scanning for Pixels.
   * @returns A promise.
   * @remarks Calls to the async methods of this class are queued
   *          and executed in order.
   */
  async stop(): Promise<void> {
    return PixelScanner._queue.run(async () => {
      this._clearAutoResume();
      this._clearTimeouts(true);
      if (this._clearOnStop) {
        this._pixels.length = 0;
        this._notify(Date.now(), "clear");
      }
      if (this.isScanning) {
        await Central.stopScan();
      }
    });
  }

  /**
   * Clears the list of scanned Pixels.
   * @returns A promise.
   * @remarks Calls to the async methods of this class are queued
   *          and executed in order.
   */
  async clear(): Promise<void> {
    return PixelScanner._queue.run(async () => {
      this._notify(Date.now(), "clear");
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
        `PixelScanner: Uncaught error in "${name}" event listener: ${e}`
      );
    }
  }

  private _activateAutoResume(): void {
    if (!this._autoResumeCallback) {
      this._autoResumeCallback = ({ state }: { state: BluetoothState }) => {
        if (state === "ready") {
          PixelScanner._queue
            .run(async () => {
              if (!this.isScanning && this._autoResumeCallback) {
                console.log("PixelScanner: Auto resuming scan");
                await Central.startScan(
                  PixelBleUuids.service,
                  this._processScanEvents.bind(this)
                );
              }
            })
            .catch((e) =>
              console.log(`PixelScanner: Error resuming scan: ${e}`)
            );
        }
      };
      Central.addListener("bluetoothState", this._autoResumeCallback);
    }
  }

  private _clearAutoResume(): void {
    if (this._autoResumeCallback) {
      Central.removeListener("bluetoothState", this._autoResumeCallback);
      this._autoResumeCallback = undefined;
    }
  }

  private _clearTimeouts(clearScanTimeout = true): void {
    if (this._notifyTimeoutId) {
      clearTimeout(this._notifyTimeoutId);
      this._notifyTimeoutId = undefined;
    }
    if (this._pruneTimeoutId) {
      clearInterval(this._pruneTimeoutId);
      this._pruneTimeoutId = undefined;
    }
    if (clearScanTimeout && this._scanTimeoutId) {
      clearTimeout(this._scanTimeoutId);
      this._scanTimeoutId = undefined;
    }
  }

  private _processScanEvents(ev: ScanEvent): void {
    if (ev.type === "peripheral") {
      const pixel = getScannedPixel(ev.peripheral);
      if (pixel) {
        this._processScannedPixel(pixel);
      }
    } else {
      this._processScanStatus(ev);
    }
  }

  private _processScanStatus({
    scanStatus,
    stopReason,
  }: Extract<ScanEvent, { type: "status" }>): void {
    // Clear timeouts (keep scan timeout if auto-resume is active)
    this._clearTimeouts(!this._autoResumeCallback && scanStatus === "stopped");

    switch (scanStatus) {
      case "starting":
        // Clear pending operations on start (there shouldn't be any)
        if (this._touched.size) {
          console.warn(
            `PixelScanner: dropping ${this._touched.size} pending operation(s) on start`
          );
          this._touched.clear();
        }
        break;
      case "scanning":
        // Ensure that first scanned Pixel will be immediately notified
        this._lastUpdate.setTime(0);
        break;
      case "stopped":
        // Flush pending operations on stop
        this._notify(Date.now());
    }

    // Update status
    const wasScanning = this.isScanning;
    this._scanStatus = scanStatus;
    this._emitEvent("scanStatus", { scanStatus, stopReason });
    if (wasScanning !== this.isScanning) {
      this._emitEvent("isScanning", this.isScanning);
    }
  }

  private _processScannedPixel(sp: ScannedPixel): void {
    if (!this._scanFilter || this._scanFilter(sp)) {
      // Have we already seen this Pixel?
      const index = this._pixels.findIndex((p) => p.pixelId === sp.pixelId);
      if (index < 0) {
        // New entry
        this._pixels.push(sp);
      } else {
        // Replace previous entry
        this._pixels[index] = sp;
      }
      // Store the operation for later notification
      this._touched.add(sp.pixelId);
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
    const nextUpdate = this._lastUpdate.getTime() + this._minNotifyInterval;
    if (now >= nextUpdate) {
      // Yes, notify immediately
      this._notify(now);
    } else if (!this._notifyTimeoutId) {
      // Otherwise schedule the notification for later if not already done
      this._notifyTimeoutId = setTimeout(
        () => this._notify(nextUpdate),
        nextUpdate - now
      );
    }
  }

  private _notify(now: number, operation?: "clear"): void {
    if (this._notifyTimeoutId) {
      clearTimeout(this._notifyTimeoutId);
      this._notifyTimeoutId = undefined;
    }
    this._lastUpdate.setTime(now);
    const ops: PixelScannerListOperation[] = [];
    if (operation === "clear") {
      // Always notify a "clear" even if the list is already empty as
      // some consumer logic might depend on getting the notification
      // even in the case of an empty list
      this._pixels.length = 0;
      ops.push({ type: "cleared" });
    } else if (this._touched.size) {
      for (const pixelId of this._touched) {
        const sp = this._pixels.find((sp) => sp.pixelId === pixelId);
        ops.push(
          sp
            ? {
                type: "scanned",
                scannedPixel: sp,
              }
            : { type: "removed", pixelId }
        );
      }
    }
    this._touched.clear();
    if (ops.length) {
      this._emitEvent("scanListOperations", { ops });
      this._emitEvent("scannedPixels", this.scannedPixels);
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
      const expired = this._pixels.filter(
        (p) => now - p.timestamp.getTime() > this._keepAliveDuration
      );
      if (expired.length) {
        // And remove them
        for (const sp of expired.reverse()) {
          const index = this._pixels.indexOf(sp);
          this._pixels.splice(index, 1);
          this._touched.add(sp.pixelId);
        }
        this._scheduleNotify();
      }
      // Schedule next pruning
      if (this._pixels.length) {
        const older = this._pixels.reduce(
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
