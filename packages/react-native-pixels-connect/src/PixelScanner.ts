import { PixelBleUuids } from "@systemic-games/pixels-core-connect";
import {
  createTypedEventEmitter,
  SequentialPromiseQueue,
} from "@systemic-games/pixels-core-utils";
import {
  Central,
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
 * Event map for {@link PixelScanner} class.
 * This is the list of supported events where the property name
 * is the event name and the property type the event data type.
 */
interface PixelScannerEventMap {
  scannerStatus: { readonly status: ScanStatus };
  availablePixels: { readonly scannedPixels: ScannedPixel[] };
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
  private _scanStatus: ScanStatus = "unavailable";
  private _scanTimeoutId?: ReturnType<typeof setTimeout>;
  private _scanFilter: PixelScannerFilter;
  private _minNotifyInterval = 0;
  private _notifyTimeoutId?: ReturnType<typeof setTimeout>;
  private _keepAliveDuration = 0;
  private _pruneTimeoutId?: ReturnType<typeof setTimeout>;
  private _lastUpdate = new Date();
  private readonly _touched = new Set<number>();

  /**
   * Indicates whether this scanner instance is currently scanning for Pixels.
   */
  get scanStatus(): ScanStatus {
    return this._scanStatus;
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
   * The minimum time interval in milliseconds between two user notifications
   * (calls to {@link PixelScanner.scanListener}).
   * A value of 0 will generate a notification on every scan event.
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
   * The approximate duration in milliseconds for which a Scanned Pixel should
   * be considered available since the last received advertisement.
   * A value of 0 keeps the dice forever.
   * @remarks Prefer values above 500ms.
   */
  get keepAliveDuration(): number {
    return this._keepAliveDuration;
  }
  set keepAliveDuration(duration: number) {
    if (this._keepAliveDuration !== duration) {
      this._keepAliveDuration = duration;
      if (this._pruneTimeoutId) {
        clearInterval(this._pruneTimeoutId);
        this._pruneTimeoutId = undefined;
      }
      if (this._keepAliveDuration > 0) {
        this._pruneTimeoutId = setInterval(
          () => this._pruneUnavailable(),
          Math.max(250, this._keepAliveDuration / 2)
        );
      }
    }
  }

  addListener<T extends keyof PixelScannerEventMap>(
    name: T,
    listener: (ev: PixelScannerEventMap[T]) => void
  ) {
    return this._evEmitter.addListener(name, listener);
  }

  removeListener<T extends keyof PixelScannerEventMap>(
    name: T,
    listener: (ev: PixelScannerEventMap[T]) => void
  ) {
    return this._evEmitter.removeListener(name, listener);
  }

  /**
   * Starts a Bluetooth scan for Pixels and update the list as advertisement
   * packets are being received.
   * @returns A promise.
   * @remarks On Android, BLE scanning will fail without error when started more
   * than 5 times over the last 30 seconds.
   */
  async start(duration = 0): Promise<void> {
    return PixelScanner._queue.run(async () => {
      // Timeout
      if (this._scanTimeoutId) {
        clearTimeout(this._scanTimeoutId);
        this._scanTimeoutId = undefined;
      }
      if (duration > 0) {
        this._scanTimeoutId = setTimeout(() => this.stop(), duration);
      }
      // Start scanning
      await Central.startScan(PixelBleUuids.service, (ev) => {
        if (ev.type === "peripheral") {
          const pixel = getScannedPixel(ev.peripheral);
          if (pixel) {
            this._processScannedPixel(pixel);
          }
        } else {
          this._processScanStatus(ev);
        }
      });
    });
  }

  /**
   * Stops scanning for Pixels.
   * @returns A promise.
   */
  async stop(): Promise<void> {
    return PixelScanner._queue.run(async () => {
      if (this._scanTimeoutId) {
        clearTimeout(this._scanTimeoutId);
        this._scanTimeoutId = undefined;
      }
      if (this._scanStatus === "starting" || this._scanStatus === "scanning") {
        await Central.stopScan();
      }
    });
  }

  /**
   * Clears the list of scanned Pixels.
   * @returns A promise.
   */
  async clear(): Promise<void> {
    return PixelScanner._queue.run(async () => {
      // Always notify a "clear" even if the list is already empty as
      // some consumer logic might depend on getting the notification
      // even in the case of an empty list
      this._pixels.length = 0;
      this._notify(Date.now(), { type: "cleared" });
    });
  }

  private _processScannedPixel(sp: ScannedPixel): void {
    if (!this._scanFilter || this._scanFilter(sp)) {
      // Do we already have seen this Pixel?
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
    }
  }

  private _processScanStatus(ev: Extract<ScanEvent, { type: "status" }>): void {
    // Cancel any scheduled user notification
    if (this._notifyTimeoutId) {
      clearTimeout(this._notifyTimeoutId);
    }
    this._notifyTimeoutId = undefined;

    // Clear pending operations on start (there shouldn't be any)
    if (ev.status === "starting" && this._touched.size) {
      console.log(
        `PixelScanner: dropping pending ${this._touched.size} operations on start`
      );
      this._touched.clear();
    }

    // Flush pending operations
    this._notify(Date.now());

    // Update status
    this._updateStatus(ev.status);
  }

  private _updateStatus(status: ScanStatus): void {
    if (this._scanStatus !== status) {
      this._scanStatus = status;
      try {
        this._evEmitter.emit("scannerStatus", { status });
      } catch (e) {
        console.error(`PixelScanner: error in scan listener ${e}`);
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
      if (this._notifyTimeoutId) {
        clearTimeout(this._notifyTimeoutId);
      }
      this._notifyTimeoutId = undefined;
      this._notify(now);
    } else if (!this._notifyTimeoutId) {
      // Otherwise schedule the notification for later if not already done
      this._notifyTimeoutId = setTimeout(
        () => this._notify(nextUpdate),
        nextUpdate - now
      );
    }
  }

  private _notify(now: number, op?: PixelScannerListOperation): void {
    this._lastUpdate.setTime(now);
    if (this._touched.size || op) {
      const ops: PixelScannerListOperation[] = [];
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
      if (op) {
        ops.push(op);
      }
      try {
        this._evEmitter.emit("scanListOperations", { ops });
      } catch (e) {
        console.error(
          `PixelScanner: Uncaught error in "availableListOperations" event listener: ${e}`
        );
      }
    }
  }

  private _pruneUnavailable(): void {
    const now = Date.now();
    const expired = this._pixels.filter(
      (p) => now - p.timestamp.getTime() > this._keepAliveDuration
    );
    if (expired.length) {
      for (const sp of expired.reverse()) {
        const index = this._pixels.indexOf(sp);
        this._pixels.splice(index, 1);
        this._touched.add(index);
      }
    }
    if (this._touched.size) {
      this._scheduleNotify();
    }
  }
}
