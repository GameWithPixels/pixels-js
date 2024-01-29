import { PixelBleUuids } from "@systemic-games/pixels-core-connect";
import {
  assertNever,
  SequentialPromiseQueue,
} from "@systemic-games/pixels-core-utils";
import { Central, ScanEvent } from "@systemic-games/react-native-bluetooth-le";

import { ScannedPixel } from "./ScannedPixel";
import { getScannedPixel } from "./getScannedPixel";

/**
 * The different possible operations on a {@link PixelScanner} list.
 */
export type PixelScannerListOp =
  | { type: "add"; scannedPixel: ScannedPixel }
  | { type: "update"; scannedPixel: ScannedPixel; index: number }
  | { type: "remove"; index: number }
  | { type: "clear" };

/**
 * Type for a callback listening to {@link PixelScanner} scan events.
 * The 'ops' argument is a list of of operations on the scanner's list
 * of Pixels.
 */
export type PixelScannerListener =
  | ((scanner: PixelScanner, ops: PixelScannerListOp[]) => void)
  | null
  | undefined;

/**
 * Type for a callback filtering {@link ScannedPixel}, used by {@link PixelScanner}.
 */
export type PixelScannerFilter =
  | ((scannedPixel: ScannedPixel) => boolean)
  | null
  | undefined;

export type PixelScannerStatus = "scanning" | "stopped" | "unavailable";

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
  private _scanStatus: PixelScannerStatus = "stopped";
  private _scanTimeoutId?: ReturnType<typeof setTimeout>;
  private _userListener: PixelScannerListener;
  private _scanFilter: PixelScannerFilter;
  private _minNotifyInterval = 0;
  private _notifyTimeoutId?: ReturnType<typeof setTimeout>;
  private _keepAliveDuration = 0;
  private _pruneTimeoutId?: ReturnType<typeof setTimeout>;
  private _lastUpdate = new Date();
  private readonly _pendingOps: PixelScannerListOp[] = [];

  /**
   * An optional listener called on getting scan events.
   * Calls will be delayed according to {@link PixelScanner.minNotifyInterval} value.
   */
  get scanListener(): PixelScannerListener {
    return this._userListener;
  }
  set scanListener(listener: PixelScannerListener) {
    this._userListener = listener;
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

  /**
   * A copy of the list of scanned Pixels since the last call to {@link PixelScanner.clear}.
   * Only Pixels matching the {@link PixelScanner.scanFilter} are included.
   */
  get scannedPixels(): ScannedPixel[] {
    return [...this._pixels];
  }

  /**
   * Indicates whether this scanner instance is currently scanning for Pixels.
   */
  get scanStatus(): PixelScannerStatus {
    return this._scanStatus;
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
      if (this._scanStatus !== "stopped") {
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
      this._pendingOps.push({ type: "clear" });
      this._notify(Date.now());
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
      // Remove any older update for the same Pixel
      // but keep insertion and re-ordering updates
      const prevUpdateIndex = this._pendingOps.findIndex(
        (e) => e.type === "update" && e.scannedPixel.pixelId === sp.pixelId
      );
      if (prevUpdateIndex >= 0) {
        this._pendingOps.splice(prevUpdateIndex, 1);
      }
      // Queue update
      this._pendingOps.push(
        index < 0
          ? {
              type: "add",
              scannedPixel: sp,
            }
          : {
              type: "update",
              scannedPixel: sp,
              index,
            }
      );
      this._scheduleNotify();
    }
  }

  private _processScanStatus(ev: Extract<ScanEvent, { type: "status" }>): void {
    switch (ev.status) {
      case "starting":
        break;
      case "started":
        this._updateStatus("scanning");
        // Reset pending operations
        this._lastUpdate.setTime(0);
        if (this._pendingOps.length) {
          this._pendingOps.length = 0;
          console.log("PixelScanner: found pending operations on start");
        }
        break;
      case "stopped":
        // Cancel any scheduled user notification
        if (this._notifyTimeoutId) {
          clearTimeout(this._notifyTimeoutId);
        }
        this._notifyTimeoutId = undefined;
        // Flush pending operations
        if (this._pendingOps.length) {
          this._notify(Date.now());
        }
        this._updateStatus(
          ev.reason && ev.reason !== "canceled" ? "unavailable" : "stopped"
        );
        break;
      default:
        assertNever(
          ev.status,
          `PixelScanner: unexpected scan status ${ev.status}`
        );
    }
  }

  private _updateStatus(status: PixelScannerStatus): void {
    if (this._scanStatus !== status) {
      this._scanStatus = status;
      // TODO notify status change
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

  private _notify(now: number): void {
    this._lastUpdate.setTime(now);
    if (this._pendingOps.length) {
      const updates = [...this._pendingOps];
      this._pendingOps.length = 0;
      try {
        this._userListener?.(this, updates);
      } catch (e) {
        console.error(`PixelScanner: error in scan listener ${e}`);
      }
    } else {
      // This shouldn't happen
      console.log("PixelScanner: no operation to notify");
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
        this._pendingOps.push({
          type: "remove",
          index,
        });
      }
    }
    if (this._pendingOps.length) {
      this._scheduleNotify();
    }
  }
}
