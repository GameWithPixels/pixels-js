import {
  assertNever,
  createTypedEventEmitter,
  EventReceiver,
} from "@systemic-games/pixels-core-utils";
import {
  getPixel,
  Pixel,
  PixelInfo,
  PixelScanner,
  PixelStatus,
  ScannedPixelNotifier,
  PixelScannerEventMap,
  PixelScannerStatusEvent,
  ScanError,
} from "@systemic-games/react-native-pixels-connect";

import { unsigned32ToHex } from "../utils";

function pixelLog(pixel: Pick<PixelInfo, "name">, message: string) {
  console.log(`[PixelsCentral ${pixel.name}]: ${message}`);
}

export interface PixelsCentralEventMap {
  isAvailable: boolean;
  isScanning: boolean;
  lastError: ScanError;
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
  private _lastError?: ScanError;
  private readonly _scannedPixels: ScannedPixelNotifier[] = [];
  private readonly _watched = new Map<
    number,
    "watched" | { pixel: Pixel; connect: () => void; unwatch: () => void }
  >();
  private _dispose: () => void;

  get lastError(): ScanError | undefined {
    return this._lastError;
  }

  get isScanning(): boolean {
    return this._scanner.isScanning;
  }

  get availablePixels(): ScannedPixelNotifier[] {
    return this._scannedPixels.filter((sp) => !this._watched.has(sp.pixelId));
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

  get hasMissingPixels(): boolean {
    for (const entry of this._watched.values()) {
      if (entry === "watched") {
        return true;
      }
    }
    return false;
  }

  constructor() {
    this._scanner.minNotifyInterval = 200;
    this._scanner.keepAliveDuration = 5000;
    this._scanner.clearOnStop = true;
    this._scanner.autoResume = true;
    const onAvailable = (isAvailable: boolean) => {
      if (isAvailable) {
        console.log("PixelsCentral: Scanner is available");
        for (const pixelId of this.watchedPixelsIds) {
          const entry = this._watched.get(pixelId);
          if (typeof entry === "object") {
            entry.connect();
          }
        }
      }
      this._emitEvent("isAvailable", isAvailable);
    };
    const onScanning = (isScanning: boolean) =>
      this._emitEvent("isScanning", isScanning);
    const onStatus = ({ scanStatus, stopReason }: PixelScannerStatusEvent) => {
      this._lastError = scanStatus === "stopped" ? stopReason : undefined;
      if (this._lastError) {
        this._emitEvent("lastError", this._lastError);
      }
    };
    const onScanOps = ({ ops }: PixelScannerEventMap["scanListOperations"]) =>
      this._scanListListener({ ops });
    this._scanner.addListener("isAvailable", onAvailable);
    this._scanner.addListener("isScanning", onScanning);
    this._scanner.addListener("scanStatus", onStatus);
    this._scanner.addListener("scanListOperations", onScanOps);
    this._dispose = () => {
      this._scanner.removeListener("isAvailable", onAvailable);
      this._scanner.removeListener("isScanning", onScanning);
      this._scanner.removeListener("scanStatus", onStatus);
      this._scanner.removeListener("scanListOperations", onScanOps);
    };
  }

  dispose(): void {
    this._dispose();
    this.setWatchedDice([]);
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

  startScan(opt?: { timeout?: boolean; pixelId?: number }): void {
    const pixelId = opt?.pixelId;
    if (!pixelId || this._watched.get(pixelId) === "watched") {
      if (pixelId) {
        this._scanner.scanFilter = (sp) => sp.pixelId === pixelId;
      } else {
        this._scanner.scanFilter = undefined;
      }
      // Start scanning
      this._scanner
        .start(opt?.timeout ? { duration: 6000 } : undefined)
        .catch((e) => {
          console.log(`PixelsCentral: Scan start error ${e}`);
        });
    }
  }

  stopScan(): void {
    this._scanner.stop().catch((e) => {
      console.log(`PixelsCentral: Scan stop error ${e}`);
    });
  }

  isWatched(pixelId: number): boolean {
    return this._watched.has(pixelId);
  }

  watch(pixelId: number): void {
    if (!this._watched.has(pixelId)) {
      console.log(`PixelsCentral: Watching Pixel ${unsigned32ToHex(pixelId)}`);
      this._watched.set(pixelId, "watched");
      this._autoConnect(pixelId);
    }
  }

  unwatch(pixelId: number): void {
    const entry = this._watched.get(pixelId);
    if (entry) {
      console.log(
        `PixelsCentral: Un-watching Pixel ${unsigned32ToHex(pixelId)}`
      );
      this._watched.delete(pixelId);
      if (typeof entry === "object") {
        entry.unwatch();
        this._emitEvent("activePixels", this.activePixels);
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

  private _emitEvent<T extends keyof PixelsCentralEventMap>(
    name: T,
    ev: PixelsCentralEventMap[T]
  ): void {
    try {
      this._evEmitter.emit(name, ev);
    } catch (e) {
      console.error(
        `PixelCentral: Uncaught error in "${name}" event listener: ${e}`
      );
    }
  }

  private _scanListListener({
    ops,
  }: PixelScannerEventMap["scanListOperations"]) {
    const availableCount = this.availablePixels.length;
    for (const op of ops) {
      const t = op.type;
      switch (t) {
        case "cleared":
          this._scannedPixels.length = 0;
          break;
        case "scanned": {
          const notifier = ScannedPixelNotifier.getInstance(op.scannedPixel);
          if (
            this._scannedPixels.every((sp) => sp.pixelId !== notifier.pixelId)
          ) {
            this._scannedPixels.push(notifier);
            // Connect to our die if paired
            this._autoConnect(notifier.pixelId);
          }
          break;
        }
        case "removed": {
          const index = this._scannedPixels.findIndex(
            (sp) => sp.pixelId === op.pixelId
          );
          if (index >= 0) {
            this._scannedPixels.splice(index, 1);
          }
          break;
        }
        default:
          assertNever(t);
      }
    }
    const available = this.availablePixels;
    if (availableCount !== available.length) {
      this._emitEvent("availablePixels", available);
    }
  }

  private _autoConnect(pixelId: number): boolean {
    const pixel = getPixel(pixelId);
    if (pixel && this._watched.get(pixelId) === "watched") {
      // Connection function that catches errors
      const connect = () => {
        pixelLog(pixel, "Connecting...");
        if (this._watched.has(pixel.pixelId)) {
          pixel.connect().catch((e: Error) => {
            pixelLog(pixel, `Connection error => ${e}`);
          });
        }
      };

      // Add event listeners
      const onStatus = (status: PixelStatus) => {
        if (status === "disconnected") {
          // TODO Delay reconnecting because our previous call to connect() might still be cleaning up
          setTimeout(connect, 2000);
        }
      };
      pixel.addEventListener("status", onStatus);
      const onRoll = (roll: number) =>
        this._emitEvent("dieRoll", { pixel, roll });
      pixel.addEventListener("roll", onRoll);
      const onRename = ({ name }: PixelInfo) =>
        this._emitEvent("dieRename", { pixel, name });
      pixel.addPropertyListener("name", onRename);
      const onProfileHash = (hash: number) =>
        this._emitEvent("dieProfile", { pixel, hash });
      pixel.addEventListener("profileHash", onProfileHash);
      const onRemoteAction = (actionId: number) =>
        this._emitEvent("dieRemoteAction", { pixel, actionId });
      pixel.addEventListener("remoteAction", onRemoteAction);

      // Callback to unsubscribe from all event listeners
      const unwatch = () => {
        pixel.removeEventListener("status", onStatus);
        pixel.removeEventListener("roll", onRoll);
        pixel.removePropertyListener("name", onRename);
        pixel.removeEventListener("profileHash", onProfileHash);
        pixel.removeEventListener("remoteAction", onRemoteAction);
        // Catch errors on disconnect
        pixel.disconnect().catch((e: Error) => {
          pixelLog(pixel, `Disconnection error => ${e}`);
        });
      };

      // Keep track of Pixels we're connecting to
      this._watched.set(pixel.pixelId, { pixel, connect, unwatch });

      // Connect to die
      connect();

      // Notify we've got a new monitored Pixel
      this._emitEvent("activePixels", this.activePixels);
    }

    return this._watched.get(pixelId) !== "watched";
  }
}
