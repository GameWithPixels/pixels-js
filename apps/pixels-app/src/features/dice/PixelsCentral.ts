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
  PixelScannerStatus,
  ScannedPixelNotifier,
} from "@systemic-games/react-native-pixels-connect";

import { logError, unsigned32ToHex } from "~/features/utils";

function pixelLog(pixel: Pick<Pixel, "pixelId">, message: string) {
  console.log(`Pixel ${unsigned32ToHex(pixel.pixelId)}: ${message}`);
}

export interface PixelsCentralEventMap {
  scannerStatusChanged: PixelScannerStatus;
  availablePixelsChanged: ScannedPixelNotifier[];
  monitoredPixelsChanged: Pixel[];
}

export class PixelsCentral {
  private readonly _evEmitter =
    createTypedEventEmitter<PixelsCentralEventMap>();
  private readonly _scanner = new PixelScanner();
  private _scannerStatus: PixelScannerStatus = "stopped";
  private readonly _scannedPixels: ScannedPixelNotifier[] = [];
  private readonly _monitoredPixelsIds = new Set<number>();
  private readonly _monitoredPixels: Pixel[] = [];
  private _stopTimeoutId: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    this._scanner.minNotifyInterval = 200;
    this._scanner.keepAliveDuration = 5000;
    this._scanner.scanListener = this._scanListener.bind(this);
  }

  get scannerStatus(): PixelScannerStatus {
    return this._scannerStatus;
  }

  get availablePixels(): ScannedPixelNotifier[] {
    return this._scannedPixels.filter(
      (p) => !this._monitoredPixelsIds.has(p.pixelId)
    );
  }

  get monitoredPixels(): Pixel[] {
    return [...this._monitoredPixels];
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
    this._scanner
      .start()
      .then(() => {
        this._updateStatus("started");
        if (duration > 0) {
          if (this._stopTimeoutId) {
            clearTimeout(this._stopTimeoutId);
          }
          this._stopTimeoutId = setTimeout(() => {
            this._stopTimeoutId = undefined;
            this._scanner.stop();
          }, duration);
        }
      })
      .catch((e) => {
        this._updateStatus(e);
      });
  }

  stopScanning(): void {
    this._scanner
      .stop()
      .then(() => {
        this._updateStatus("stopped");
      })
      .catch((e) => {
        this._updateStatus(e);
      });
  }

  monitorPixel(pixelId: number): void {
    if (this._monitoredPixelsIds.add(pixelId)) {
      const pixel = getPixel(pixelId);
      if (pixel) {
        this._autoConnect(pixel);
      }
    }
  }

  unmonitorPixel(pixelId: number): void {
    if (this._monitoredPixelsIds.delete(pixelId)) {
      // const pixel = this._pixels.find((p) => p.pixelId === pixelId);
      // if (pixel) {
      //   this._evEmitter.emit("foundPixelUnpaired", pixel);
      // }
    }
  }

  private _updateStatus(status: PixelScannerStatus): void {
    if (this._scannerStatus !== status) {
      this._scannerStatus = status;
      this._evEmitter.emit("scannerStatusChanged", status);
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
          console.log(
            "PixelsCentral: add " +
              op.scannedPixel.name +
              " - " +
              unsigned32ToHex(op.scannedPixel.pixelId)
          );
          const notifier = ScannedPixelNotifier.getInstance(op.scannedPixel);
          this._scannedPixels.push(notifier);
          const pixel = getPixel(notifier.pixelId);
          if (pixel) {
            if (this._monitoredPixelsIds.has(pixel.pixelId)) {
              this._autoConnect(pixel);
            }
          } else {
            logError(
              `PixelsCentral: no Pixel instance for ${unsigned32ToHex(
                notifier.pixelId
              )} after getting scanned`
            );
          }
          break;
        }
        case "update":
          {
            const sp = this._scannedPixels[op.index];
            if (sp) {
              console.log(
                "PixelsCentral: update " +
                  sp.name +
                  " - " +
                  unsigned32ToHex(sp.pixelId)
              );
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
            console.log(
              "PixelsCentral: remove " +
                unsigned32ToHex(this._scannedPixels[op.index].pixelId)
            );
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
      this._evEmitter.emit("availablePixelsChanged", this.availablePixels);
    }
  }

  private _autoConnect(pixel: Pixel): void {
    if (!this._monitoredPixels.includes(pixel)) {
      this._monitoredPixels.push(pixel);
      pixel.connect().catch((e: Error) => {
        pixelLog(pixel, `Connection error, ${e}`);
      });
      this._evEmitter.emit("monitoredPixelsChanged", this.monitoredPixels);
    }
  }
}
