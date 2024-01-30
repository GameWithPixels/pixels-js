import {
  assertNever,
  createTypedEventEmitter,
  EventReceiver,
} from "@systemic-games/pixels-core-utils";
import {
  PixelScannerListOperation,
  BluetoothState,
  Central,
  getPixel,
  Pixel,
  PixelInfo,
  PixelScanner,
  PixelStatus,
  ScannedPixelNotifier,
  ScanStatus,
} from "@systemic-games/react-native-pixels-connect";

import { logError, unsigned32ToHex } from "~/features/utils";

function pixelLog(pixel: Pick<Pixel, "pixelId">, message: string) {
  console.log(`Pixel ${unsigned32ToHex(pixel.pixelId)}: ${message}`);
}

export interface PixelsCentralEventMap {
  bluetoothState: BluetoothState;
  scannerStatus: ScanStatus;
  availablePixels: ScannedPixelNotifier[];
  activePixels: Pixel[];
  dieRoll: { pixel: Pixel; roll: number };
  dieRename: { pixel: Pixel; name: string };
  dieProfile: { pixel: Pixel; hash: number };
  dieRemoteAction: { pixel: Pixel; actionId: number };
}

// Watched Pixels are promoted to active whenever they are found (= scanned)
export class PixelsCentral {
  private readonly _evEmitter =
    createTypedEventEmitter<PixelsCentralEventMap>();
  private readonly _scanner = new PixelScanner();
  private _scannerStatus: ScanStatus = "unavailable";
  private readonly _scannedPixels: ScannedPixelNotifier[] = [];
  private readonly _watched = new Map<
    number,
    true | { pixel: Pixel; unwatch: () => void }
  >();

  get bluetoothState(): BluetoothState {
    return Central.getBluetoothState();
  }

  get scannerStatus(): ScanStatus {
    return this._scannerStatus;
  }

  get availablePixels(): ScannedPixelNotifier[] {
    return this._scannedPixels.filter((p) => !this._watched.has(p.pixelId));
  }

  // Pixels ids of all Pixels that are being watched
  get watchedPixelsIds(): number[] {
    return [...this._watched.keys()];
  }

  // Only includes Pixels that are being watched and have been found
  get activePixels(): Pixel[] {
    const pixels: Pixel[] = [];
    for (const entry of this._watched.values()) {
      if (typeof entry === "object") {
        pixels.push(entry.pixel);
      }
    }
    return pixels;
  }

  constructor() {
    this._scanner.minNotifyInterval = 200;
    this._scanner.keepAliveDuration = 5000;
    this._scanner.addListener(
      "scanListOperations",
      this._scanListener.bind(this)
    );
    // // TODO move this to Scanner class
    // const listener = ({ state }: { state: BluetoothState }) => {
    //   try {
    //     this._evEmitter.emit("bluetoothState", state);
    //   } finally {
    //     switch (state) {
    //       case "unknown":
    //       case "off":
    //       case "resetting":
    //         // Scan aborted
    //         this._updateStatus(new BluetoothUnavailableError(state));
    //         break;
    //       case "unauthorized":
    //         this._updateStatus(new BluetoothPermissionsDeniedError());
    //         break;
    //       case "ready":
    //         if (typeof this._scannerStatus !== "string") {
    //           // Reset scan error when BLE is ready
    //           this._updateStatus("stopped");
    //         }
    //         break;
    //       default:
    //         assertNever(state);
    //     }
    //   }
    // };
    // Central.addListener("bluetoothState", listener);
    // this._dispose = () => Central.removeListener("bluetoothState", listener);
  }

  dispose(): void {
    // this._dispose();
    // TODO disconnect dice
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

  startScan(duration?: number): void {
    console.log("PixelsCentral: startScan");
    this._scanner
      .start(duration)
      .then(() => {
        console.log("PixelsCentral: scan started");
      })
      .catch((e) => {
        console.log(`PixelsCentral: scan start error ${e}`);
      });
  }

  stopScan(): void {
    console.log("PixelsCentral: stopScan");
    this._scanner
      .stop()
      .then(() => {
        console.log("PixelsCentral: scan stopped");
      })
      .catch((e) => {
        console.log(`PixelsCentral: scan stop error ${e}`);
      });
  }

  isWatched(pixelId: number): boolean {
    return this._watched.has(pixelId);
  }

  watch(pixelId: number): void {
    if (!this._watched.has(pixelId)) {
      this._watched.set(pixelId, true);
      const pixel = getPixel(pixelId);
      if (pixel) {
        this._autoConnect(pixel);
      }
    }
  }

  unwatch(pixelId: number): void {
    const entry = this._watched.get(pixelId);
    if (entry) {
      this._watched.delete(pixelId);
      if (typeof entry === "object") {
        entry.unwatch();
        this._evEmitter.emit("activePixels", this.activePixels);
      }
    }
  }

  setWatchedDice(pixelIds: readonly number[]): void {
    for (const id of this.watchedPixelsIds) {
      if (!pixelIds.includes(id)) {
        this.unwatch(id);
      }
    }
    for (const id of pixelIds) {
      this.watch(id);
    }
  }

  private _updateStatus(status: ScanStatus): void {
    if (this._scannerStatus !== status) {
      this._scannerStatus = status;
      this._evEmitter.emit("scannerStatus", status);
    }
  }

  private _scanListener({ ops }: { ops: PixelScannerListOperation[] }) {
    const availableCount = this.availablePixels.length;
    for (const op of ops) {
      const t = op.type;
      switch (t) {
        case "cleared":
          console.log("PixelsCentral: cleared");
          this._scannedPixels.length = 0;
          break;
        case "scanned": {
          console.log(
            "PixelsCentral: scanned " +
              op.scannedPixel.name +
              " - " +
              unsigned32ToHex(op.scannedPixel.pixelId)
          );
          const notifier = ScannedPixelNotifier.getInstance(op.scannedPixel);
          if (
            this._scannedPixels.every((p) => p.pixelId !== notifier.pixelId)
          ) {
            this._scannedPixels.push(notifier);
            const pixel = getPixel(notifier.pixelId);
            if (pixel) {
              this._autoConnect(pixel);
            } else {
              logError(
                `PixelsCentral: no Pixel instance for ${unsigned32ToHex(
                  notifier.pixelId
                )} after getting scanned`
              );
            }
          }
          break;
        }
        case "removed": {
          const index = this._scannedPixels.findIndex(
            (p) => p.pixelId === op.pixelId
          );
          if (index >= 0) {
            console.log(
              "PixelsCentral: removed " +
                unsigned32ToHex(this._scannedPixels[index].pixelId)
            );
            this._scannedPixels.splice(index, 1);
          } else {
            console.error(
              "PixelsCentral: index out of range on remove operation"
            );
          }
          break;
        }
        default:
          assertNever(t);
      }
    }
    const available = this.availablePixels;
    if (availableCount !== available.length) {
      this._evEmitter.emit("availablePixels", this.availablePixels);
    }
  }

  private _autoConnect(pixel: Pixel): void {
    const entry = this._watched.get(pixel.pixelId);
    if (entry === true) {
      const connect = () => {
        pixelLog(pixel, "Connecting...");
        if (this._watched.has(pixel.pixelId)) {
          pixel.connect().catch((e: Error) => {
            pixelLog(pixel, `Connection error, ${e}`);
          });
        }
      };

      // Add event listeners
      const onStatus = (status: PixelStatus) => {
        if (status === "disconnected") {
          // TODO Delay reconnecting because our previous call to connect() might still be cleaning up
          setTimeout(() => connect, 1000);
        }
      };
      pixel.addEventListener("status", onStatus);
      const onRoll = (roll: number) =>
        this._evEmitter.emit("dieRoll", { pixel, roll });
      pixel.addEventListener("roll", onRoll);
      const onRename = ({ name }: PixelInfo) =>
        this._evEmitter.emit("dieRename", { pixel, name });
      pixel.addPropertyListener("name", onRename);
      const onProfileHash = (hash: number) =>
        this._evEmitter.emit("dieProfile", { pixel, hash });
      pixel.addEventListener("profileHash", onProfileHash);
      const onRemoteAction = (actionId: number) =>
        this._evEmitter.emit("dieRemoteAction", { pixel, actionId });
      pixel.addEventListener("remoteAction", onRemoteAction);

      // Callback to unsubscribe from all event listeners
      const unwatch = () => {
        pixel.removeEventListener("status", onStatus);
        pixel.removeEventListener("roll", onRoll);
        pixel.removePropertyListener("name", onRename);
        pixel.removeEventListener("profileHash", onProfileHash);
        pixel.removeEventListener("remoteAction", onRemoteAction);
        pixel.disconnect().catch((e: Error) => {
          pixelLog(pixel, `Disconnection error, ${e}`);
        });
      };

      // Keep track of Pixels we're connecting to
      this._watched.set(pixel.pixelId, { pixel, unwatch });

      // Connect to die
      connect();

      // Notify we've got a new monitored Pixel
      this._evEmitter.emit("activePixels", this.activePixels);
    }
  }
}
