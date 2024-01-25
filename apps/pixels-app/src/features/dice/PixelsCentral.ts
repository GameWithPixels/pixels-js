import {
  assertNever,
  createTypedEventEmitter,
  EventReceiver,
} from "@systemic-games/pixels-core-utils";
import {
  getPixel,
  Pixel,
  PixelScanner,
  PixelScannerListOp,
  ScannedPixelNotifier,
} from "@systemic-games/react-native-pixels-connect";

export interface PixelsCentralEventMap {
  availableListChanged: ScannedPixelNotifier[];
  pairedPixelFound: Pixel;
  foundPixelUnpaired: Pixel;
}

export class PixelsCentral {
  private readonly _evEmitter =
    createTypedEventEmitter<PixelsCentralEventMap>();
  private readonly _scanner = new PixelScanner();
  private readonly _scannedPixels: ScannedPixelNotifier[] = [];
  private readonly _pixels: Pixel[] = [];
  private readonly _pairedPixelsIds = new Set<number>();
  private _stopTimeoutId: ReturnType<typeof setTimeout> | undefined;

  get isScanning(): boolean {
    return this._scanner.isScanning;
  }

  get availablePixels(): ScannedPixelNotifier[] {
    return this._scannedPixels.filter(
      (p) => !this._pairedPixelsIds.has(p.pixelId)
    );
  }

  get pairedPixels(): Pixel[] {
    return this._pixels.filter((p) => this._pairedPixelsIds.has(p.pixelId));
  }

  /**
   * Register a listener function to be invoked on raising the event
   * identified by the given event name.
   * See {@link PixelsCentralEventMap} for the list of events and their
   * associated data.
   * @param eventName The name of the event.
   * @param listener The callback function.
   */
  addEventListener<K extends keyof PixelsCentralEventMap>(
    eventName: K,
    listener: EventReceiver<PixelsCentralEventMap[K]>
  ): void {
    this._evEmitter.addListener(eventName, listener);
  }

  /**
   * Unregister a listener from receiving events identified by
   * the given event name.
   * See {@link PixelsCentralEventMap} for the list of events and their
   * associated data.
   * @param eventName The name of the event.
   * @param listener The callback function to unregister.
   */
  removeEventListener<K extends keyof PixelsCentralEventMap>(
    eventName: K,
    listener: EventReceiver<PixelsCentralEventMap[K]>
  ): void {
    this._evEmitter.removeListener(eventName, listener);
  }

  startScanning(duration = 0): void {
    const scanner = this._scanner;
    scanner.minNotifyInterval = 200;
    scanner.keepAliveDuration = 1000;
    scanner.scanListener = this._scanListener;
    scanner.start();
    if (duration > 0) {
      if (this._stopTimeoutId) {
        clearTimeout(this._stopTimeoutId);
      }
      this._stopTimeoutId = setTimeout(() => {
        this._stopTimeoutId = undefined;
        scanner.stop();
      }, duration);
    }
  }

  stopScanning(): void {
    this._scanner.stop();
  }

  addPairedPixel(pixelId: number): void {
    if (this._pairedPixelsIds.add(pixelId)) {
      const pixel = this._pixels.find((p) => p.pixelId === pixelId);
      if (pixel) {
        this._evEmitter.emit("pairedPixelFound", pixel);
      }
    }
  }

  removePairedPixel(pixelId: number): void {
    if (this._pairedPixelsIds.delete(pixelId)) {
      const pixel = this._pixels.find((p) => p.pixelId === pixelId);
      if (pixel) {
        this._evEmitter.emit("foundPixelUnpaired", pixel);
      }
    }
  }

  private _scanListener(scanner: PixelScanner, ops: PixelScannerListOp[]) {
    const availableCount = this.availablePixels.length;
    for (const op of ops) {
      const t = op.type;
      switch (t) {
        case "clear":
          this._scannedPixels.length = 0;
          break;
        case "add": {
          const notifier = ScannedPixelNotifier.getInstance(op.scannedPixel);
          this._scannedPixels.push(notifier);
          const pixel = getPixel(notifier.pixelId);
          if (pixel) {
            this._pixels.push(pixel);
            if (this._pairedPixelsIds.has(pixel.pixelId)) {
              this._evEmitter.emit("pairedPixelFound", pixel);
            }
          } else {
            console.error(
              `PixelsCentral: no Pixel instance for ${notifier.pixelId
                .toString(16)
                .padStart(8, "0")} after getting scanned`
            );
          }
          break;
        }
        case "update":
          {
            const sp = this._scannedPixels[op.index];
            if (sp) {
              sp.updateProperties(op.scannedPixel);
            } else {
              console.error(
                "PixelsCentral: index out of range on update operation"
              );
            }
          }
          break;
        case "remove":
          if (this._scannedPixels[op.index]) {
            this._scannedPixels.splice(op.index, 1);
          } else {
            console.error(
              "PixelsCentral: index out of range on remove operation"
            );
          }
          break;
        default:
          assertNever(t);
      }
    }
    const available = this.availablePixels;
    if (availableCount !== available.length) {
      this._evEmitter.emit("availableListChanged", available);
    }
  }
}
