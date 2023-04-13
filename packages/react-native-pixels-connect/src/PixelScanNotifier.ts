import {
  getPixelUniqueName,
  PixelDesignAndColorValues,
  PixelRollStateValues,
} from "@systemic-games/pixels-core-connect";
import {
  assert,
  assertNever,
  getValueKeyName,
  SequentialPromiseQueue,
} from "@systemic-games/pixels-core-utils";

import PixelScanner from "./PixelScanner";
import { ScannedPixel } from "./ScannedPixel";

/**
 * Actions to be taken on a {@link PixelScanList} instance.
 */
export type PixelScanNotifierAction = "start" | "stop" | "clear";

/**
 * Type for a callback listening to {@link PixelScanNotifier} scan events.
 * The argument is an empty array when the notifier list is cleared.
 */
export type PixelScanListener =
  | ((scannedPixels: ScannedPixel[]) => void)
  | null
  | undefined;

/**
 * Type for a callback filtering {@link ScannedPixel}, used by {@link PixelScanNotifier}.
 */
export type PixelScanFilter =
  | ((scannedPixel: ScannedPixel) => boolean)
  | null
  | undefined;

/**
 * Represents a list of scanned Pixels.
 * Subscribe to the "updated" event to get notified
 * when the list is changed.
 */
export class PixelScanNotifier {
  private readonly _queue = new SequentialPromiseQueue();
  private readonly _pixels: ScannedPixel[] = [];
  private _scanCallback?: (pixel: ScannedPixel) => void;
  private _scanListener: PixelScanListener;
  private _scanFilter: PixelScanFilter;
  private _sortByName = false;
  private _updatesMinInterval = 0;
  private _notifyTimeout?: ReturnType<typeof setTimeout>;
  private _lastUpdate = new Date();
  private readonly _pendingUpdates: ScannedPixel[] = [];

  // Scanning emulation
  private _emulatedCount = 0;
  private _emulatorTimeout?: ReturnType<typeof setTimeout>;
  private static _maxDesignAndColor = Math.max(
    ...Object.values(PixelDesignAndColorValues)
  );
  private static _maxRollState = Math.max(
    ...Object.values(PixelRollStateValues)
  );

  get scanListener(): PixelScanListener {
    return this._scanListener;
  }
  set scanListener(listener: PixelScanListener) {
    this._scanListener = listener;
  }

  get scanFilter(): PixelScanFilter {
    return this._scanFilter;
  }
  set scanFilter(scanFilter: PixelScanFilter) {
    this._scanFilter = scanFilter;
  }

  get sortByName(): boolean {
    return this._sortByName;
  }
  set sortByName(sort: boolean) {
    this._sortByName = sort;
  }

  get updatesMinInterval(): number {
    return this._updatesMinInterval;
  }
  set updatesMinInterval(interval: number) {
    this._updatesMinInterval = interval;
    // Re-schedule user notification if there was any
    if (this._notifyTimeout) {
      clearTimeout(this._notifyTimeout);
      if (this._updatesMinInterval > 0) {
        const nextUpdate =
          this._lastUpdate.getTime() + this._updatesMinInterval;
        this._notifyTimeout = setTimeout(
          () => this._notify(nextUpdate),
          nextUpdate - Date.now()
        );
      }
    }
  }

  get __dev__emulatedPixelsCount(): number {
    return this._emulatedCount;
  }
  set __dev__emulatedPixelsCount(count: number) {
    this._emulatedCount = count;
  }

  get scannedPixels() {
    return [...this._pixels];
  }

  // Reducer like function for a PixelScanner
  async dispatch(action: PixelScanNotifierAction): Promise<void> {
    return this._queue.run(async () => {
      switch (action) {
        case "start":
          // Check if a scan was already started
          if (!this._scanCallback) {
            // Listener for scanned Pixels events
            const listener = (pixel: ScannedPixel) => {
              if (!this._scanFilter || this._scanFilter(pixel)) {
                // Do we already have an entry for this scanned Pixel?
                const index = this._pixels.findIndex(
                  (p) => p.pixelId === pixel.pixelId
                );
                if (index < 0) {
                  // New entry
                  this._pixels.push(pixel);
                } else {
                  // Replace previous entry
                  this._pixels[index] = pixel;
                }
                if (this.sortByName) {
                  // Note: we sort even if no new entry was added as a die name
                  // could have changed since the last sort
                  this._pixels.sort((p1, p2) =>
                    getPixelUniqueName(p1).localeCompare(getPixelUniqueName(p2))
                  );
                }
                // Remove any older update for the same Pixel
                const updateIndex = this._pendingUpdates.findIndex(
                  (p) => p.pixelId === pixel.pixelId
                );
                if (updateIndex >= 0) {
                  this._pendingUpdates.splice(updateIndex, 1);
                }
                // Queue update
                this._pendingUpdates.push(pixel);
                const now = Date.now();
                // Are we're past the given interval since the last notification?
                const nextUpdate =
                  this._lastUpdate.getTime() + this._updatesMinInterval;
                if (now >= nextUpdate) {
                  // Yes, notify immediately
                  clearTimeout(this._notifyTimeout);
                  this._notifyTimeout = undefined;
                  this._notify(now);
                } else if (!this._notifyTimeout) {
                  // Otherwise schedule the notification for later
                  this._notifyTimeout = setTimeout(
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
              await PixelScanner.start(listener);
            } else {
              // Emulate scanning
              this._emulateScan();
            }
            // Update state once all operations have completed successfully
            this._scanCallback = listener;
          }
          break;

        case "stop":
          // Check if a scan was already started
          if (this._scanCallback) {
            // Cancel any scheduled user notification
            clearTimeout(this._notifyTimeout);
            this._notifyTimeout = undefined;
            // Cancel scanning emulation
            clearTimeout(this._emulatorTimeout);
            this._emulatorTimeout = undefined;
            // Stop scanning
            await PixelScanner.stop();
            // Update state once all operations have completed successfully
            this._scanCallback = undefined;
          }
          break;

        case "clear":
          this._pixels.length = 0;
          this._scanListener?.([]);
          break;

        default:
          assertNever(action);
      }
    });
  }

  private _notify(now: number): void {
    this._lastUpdate.setTime(now);
    const toNotify = [...this._pendingUpdates];
    this._pendingUpdates.length = 0;
    this._scanListener?.(toNotify);
  }

  private _emulateScan(): void {
    // Around 5 events per Pixel per second
    this._emulatorTimeout = setTimeout(() => {
      this._emulateScan();
      for (let i = 1; i <= this._emulatedCount; ++i) {
        this._scanCallback?.(this._genScannedPixel(i));
      }
    }, 150 + 100 * Math.random());
  }

  private _genScannedPixel(index: number): ScannedPixel {
    assert(index > 0);
    return {
      systemId: "system-id-" + index,
      pixelId: index,
      name: "Pixel" + index,
      ledCount: 20,
      designAndColor:
        getValueKeyName(
          1 + (index % PixelScanNotifier._maxDesignAndColor),
          PixelDesignAndColorValues
        ) ?? "unknown",
      firmwareDate: new Date(),
      rssi: Math.round(Math.random() * -50) - 20,
      batteryLevel: Math.round(Math.random() * 100),
      isCharging: Math.random() > 0.5,
      rollState:
        getValueKeyName(
          Math.ceil(Math.random() * PixelScanNotifier._maxRollState),
          PixelRollStateValues
        ) ?? "unknown",
      currentFace: 1 + Math.round(Math.random() * 19),
      address: index + (index << 16) + (index << 32),
      timestamp: new Date(),
    };
  }
}
