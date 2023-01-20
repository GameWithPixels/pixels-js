import {
  assertNever,
  SequentialPromiseQueue,
} from "@systemic-games/pixels-core-utils";

import PixelScanner from "./PixelScanner";
import ScannedPixel from "./ScannedPixel";

/**
 * Actions to be taken on a {@link PixelScanList} instance.
 */
export type PixelScanNotifierAction = "start" | "stop" | "clear";

/**
 * Represents an up-to-date list of scanned Pixels.
 * Subscribe to the "updated" event to get notified
 * when the list is changed.
 */
export default class PixelScanNotifier {
  private readonly _scanner = new PixelScanner();
  private readonly _queue = new SequentialPromiseQueue();
  private readonly _pixels: ScannedPixel[] = [];
  private _scanCallback?: (pixel: ScannedPixel) => void;
  private _notifyCallback: (pixel?: ScannedPixel) => void;
  private _scanFilter?: (scannedPixel: ScannedPixel) => boolean;

  get scannedPixels() {
    return [...this._pixels];
  }

  constructor(
    notifyCallback: (pixel?: ScannedPixel) => void,
    scanFilter?: (scannedPixel: ScannedPixel) => boolean
  ) {
    this._notifyCallback = notifyCallback;
    this._scanFilter = scanFilter;
  }

  // Reducer like function for a PixelScanner
  async dispatch(action: PixelScanNotifierAction): Promise<void> {
    return this._queue.run(async () => {
      const scanner = this._scanner;
      switch (action) {
        case "start":
          // Check if a scan was already started
          if (!this._scanCallback) {
            // Start and then subscribe to the event, so the subscription isn't made
            // if start() throws an exception
            await scanner.start();
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
                this._notifyCallback(pixel);
              }
            };
            scanner.addEventListener("scannedPixel", listener);
            // Update state once all operations have completed successfully
            this._scanCallback = listener;
          }
          break;
        case "stop":
          // Check if a scan was already started
          if (this._scanCallback) {
            // Remove event subscription first so it doesn't stay if stop()
            // throws an exception
            scanner.removeEventListener("scannedPixel", this._scanCallback);
            await scanner.stop();
            // Update state once all operations have completed successfully
            this._scanCallback = undefined;
          }
          break;
        case "clear":
          this._pixels.length = 0;
          this._notifyCallback(undefined);
          break;
        default:
          assertNever(action);
      }
    });
  }
}
