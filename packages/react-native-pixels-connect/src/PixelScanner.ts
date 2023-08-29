import {
  PixelDesignAndColorValues,
  PixelRollStateValues,
} from "@systemic-games/pixels-core-connect";
import {
  assert,
  getValueKeyName,
  SequentialPromiseQueue,
} from "@systemic-games/pixels-core-utils";

import MainScanner from "./MainScanner";
import { ScannedPixel } from "./ScannedPixel";

/**
 * The different possible operations on a {@link PixelScanner} list.
 */
export type PixelScannerListOp =
  | { type: "add"; scannedPixel: ScannedPixel }
  | { type: "update"; scannedPixel: ScannedPixel; index: number }
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
  private readonly _queue = new SequentialPromiseQueue();
  private readonly _pixels: ScannedPixel[] = [];
  private _scannerListener?: (pixel: ScannedPixel) => void;
  private _userListener: PixelScannerListener;
  private _scanFilter: PixelScannerFilter;
  private _minNotifyInterval = 0;
  private _notifyTimeoutId?: ReturnType<typeof setTimeout>;
  private _lastUpdate = new Date();
  private readonly _pendingUpdates: PixelScannerListOp[] = [];

  // Scanning emulation
  private _emulatedCount = 0;
  private _emulatorTimeoutId?: ReturnType<typeof setTimeout>;

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
        if (this._minNotifyInterval > 0) {
          const nextUpdate =
            this._lastUpdate.getTime() + this._minNotifyInterval;
          this._notifyTimeoutId = setTimeout(
            () => this._notify(nextUpdate),
            nextUpdate - Date.now()
          );
        }
      }
    }
  }

  /** Number of scanned Pixels to emulate, only use in DEV mode! */
  get __dev__emulatedPixelsCount(): number {
    return this._emulatedCount;
  }
  set __dev__emulatedPixelsCount(count: number) {
    if (__DEV__) {
      this._emulatedCount = count;
    }
  }

  /**
   * A copy of the optionally ordered list of scanned Pixels since
   * the last call to {@link PixelScanner.clear}.
   */
  get scannedPixels(): ScannedPixel[] {
    return [...this._pixels];
  }

  /**
   * Starts a Bluetooth scan for Pixels and update the list as advertisement
   * packets are being received.
   * @returns A promise.
   * @remarks On Android, BLE scanning will fail without error when started more
   * than 5 times over the last 30 seconds.
   */
  async start(): Promise<void> {
    return this._queue.run(async () => {
      // Check if a scan was already started
      if (!this._scannerListener) {
        // Listener for scanned Pixels events
        const listener = (sp: ScannedPixel) => {
          if (!this._scanFilter || this._scanFilter(sp)) {
            // Do we already have seen this Pixel?
            const index = this._pixels.findIndex(
              (p) => p.pixelId === sp.pixelId
            );
            if (index < 0) {
              // New entry
              this._pixels.push(sp);
            } else {
              // Replace previous entry
              this._pixels[index] = sp;
            }
            // Remove any older update for the same Pixel
            // but keep insertion and re-ordering updates
            const prevUpdateIndex = this._pendingUpdates.findIndex(
              (e) =>
                e.type === "update" && e.scannedPixel.pixelId === sp.pixelId
            );
            if (prevUpdateIndex >= 0) {
              this._pendingUpdates.splice(prevUpdateIndex, 1);
            }
            // Queue update
            this._pendingUpdates.push(
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
            // Prepare for user notification
            const now = Date.now();
            // Are we're past the given interval since the last notification?
            const nextUpdate =
              this._lastUpdate.getTime() + this._minNotifyInterval;
            if (now >= nextUpdate) {
              // Yes, notify immediately
              if (this._notifyTimeoutId) {
                clearTimeout(this._notifyTimeoutId);
              }
              this._notifyTimeoutId = undefined;
              this._notify(now);
            } else if (!this._notifyTimeoutId) {
              // Otherwise schedule the notification for later
              this._notifyTimeoutId = setTimeout(
                () => this._notify(nextUpdate),
                nextUpdate - now
              );
            }
          }
        };
        // Reset updates
        this._lastUpdate.setTime(0);
        this._pendingUpdates.length = 0;
        // Start scanning
        if (this._emulatedCount <= 0) {
          await MainScanner.addListener(listener);
        } else {
          // Emulate scanning
          this._emulateScan();
        }
        // Update state once all operations have completed successfully
        this._scannerListener = listener;
      }
    });
  }

  /**
   * Stops scanning for Pixels.
   * @returns A promise.
   */
  async stop(): Promise<void> {
    return this._queue.run(async () => {
      // Check if a scan was already started
      if (this._scannerListener) {
        if (this._emulatorTimeoutId) {
          // Cancel scanning emulation
          clearTimeout(this._emulatorTimeoutId);
          this._emulatorTimeoutId = undefined;
        } else {
          // Cancel any scheduled user notification
          if (this._notifyTimeoutId) {
            clearTimeout(this._notifyTimeoutId);
          }
          this._notifyTimeoutId = undefined;
          // Stop scanning
          await MainScanner.removeListener(this._scannerListener);
        }
        // Update state once all operations have completed successfully
        this._scannerListener = undefined;
      }
    });
  }

  /**
   * Clears the list of scanned Pixels.
   * @returns A promise.
   */
  async clear(): Promise<void> {
    return this._queue.run(async () => {
      // Always notify a "clear" even if the list is already empty as
      // some consumer logic might depend on getting the notification
      // even in the case of an empty list
      this._pixels.length = 0;
      this._pendingUpdates.push({ type: "clear" });
      this._notify(Date.now());
    });
  }

  private _notify(now: number): void {
    this._lastUpdate.setTime(now);
    const updates = [...this._pendingUpdates];
    this._pendingUpdates.length = 0;
    this._userListener?.(this, updates);
  }

  private _emulateScan(): void {
    // Around 5 scan events per Pixel per second
    this._emulatorTimeoutId = setTimeout(() => {
      this._emulateScan();
      for (let i = 1; i <= this._emulatedCount; ++i) {
        this._scannerListener?.(PixelScanner._generateScannedPixel(i));
      }
    }, 150 + 100 * Math.random());
  }

  private static _maxDesignAndColor = Math.max(
    ...Object.values(PixelDesignAndColorValues)
  );

  private static _maxRollState = Math.max(
    ...Object.values(PixelRollStateValues)
  );

  private static _generateScannedPixel(index: number): ScannedPixel {
    assert(index > 0);
    return {
      systemId: "system-id-" + index,
      pixelId: index,
      name: "Pixel" + index,
      ledCount: 20,
      designAndColor:
        getValueKeyName(
          1 + (index % PixelScanner._maxDesignAndColor),
          PixelDesignAndColorValues
        ) ?? "unknown",
      firmwareDate: new Date(),
      rssi: Math.round(Math.random() * -50) - 20,
      batteryLevel: Math.round(Math.random() * 100),
      isCharging: Math.random() > 0.5,
      rollState:
        getValueKeyName(
          Math.ceil(Math.random() * PixelScanner._maxRollState),
          PixelRollStateValues
        ) ?? "unknown",
      currentFace: 1 + Math.round(Math.random() * 19),
      address: index + (index << 16) + (index << 32),
      timestamp: new Date(),
    };
  }
}
