import {
  assertNever,
  createTypedEventEmitter,
  EventReceiver,
  unsigned32ToHex,
} from "@systemic-games/pixels-core-utils";
import { DfuState } from "@systemic-games/react-native-nordic-nrf5-dfu";
import {
  getPixel,
  Pixel,
  PixelInfo,
  PixelScanner,
  ScannedPixelNotifier,
  PixelScannerEventMap,
  PixelScannerStatusEvent,
  BluetoothNotAuthorizedError,
  BluetoothUnavailableError,
  ScanStatus,
  ScanStartFailed,
  Central,
  PixelOwnMutableProps,
} from "@systemic-games/react-native-pixels-connect";
import { Platform } from "expo-modules-core";

import { updateFirmware } from "~/features/dfu/updateFirmware";
import { logError } from "~/features/utils";

function pixelLog(pixel: Pick<PixelInfo, "name">, message: string) {
  console.log(`[PixelsCentral ${pixel.name}]: ${message}`);
}

export interface PixelsCentralEventMap {
  // Props
  isReady: boolean;
  scanStatus: ScanStatus;
  availablePixels: ScannedPixelNotifier[];
  pixels: Pixel[];
  pixelInDFU: Pixel | undefined;
  // Events
  scanError: Error;
  pixelFound: { pixel: Pixel }; // Watched Pixel was found (scanned)
  pixelRemoved: { pixel: Pixel }; // Found Pixel was removed (unwatched)
  pixelDfuState: { pixel: Pixel; state: DfuState; error?: Error };
  pixelDfuProgress: { pixel: Pixel; progress: number };
  pixelDfuError: { pixel: Pixel; error: Error };
}

interface WatchedPixel {
  pixel: Pixel;
  connect: () => void;
  unwatch: () => void;
}

// Watched Pixels are added to the "pixels" list whenever they are found (= scanned)
export class PixelsCentral {
  private readonly _evEmitter =
    createTypedEventEmitter<PixelsCentralEventMap>();
  private _onScannerReady?: (b: boolean) => void;
  private _onScanStatus?: (s: ScanStatus) => void;
  private readonly _scanner = new PixelScanner();
  private readonly _scannedPixels: ScannedPixelNotifier[] = [];
  private readonly _connectFromScan = new Map<number, number>(); // List of Pixels to connect to when scanning
  private readonly _scanTimeoutIds: ReturnType<typeof setTimeout>[] = [];
  private _manualScan = false; // Whether the scanner was started manually (and not by  connectToMissingPixels)
  private readonly _watched = new Map<number, "watched" | WatchedPixel>();
  private _pixelInDFU?: Pixel; // The die for which we are currently doing a DFU
  private _scannerUnhook?: () => void;

  get isReady(): boolean {
    return this._scanner.isReady;
  }

  get scanStatus(): ScanStatus {
    return this._scanner.status;
  }

  // Pixels that are scanned but not being watched
  get availablePixels(): ScannedPixelNotifier[] {
    return this._scannedPixels.filter((sp) => !this._watched.has(sp.pixelId));
  }

  // Pixels ids of all Pixels that are being watched
  get watchedPixelsIds(): number[] {
    return [...this._watched.keys()];
  }

  // Only includes Pixels that are being watched and have been found
  get pixels(): Pixel[] {
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

  get pixelInDFU(): Pixel | undefined {
    return this._pixelInDFU;
  }

  constructor() {
    this._evEmitter.setMaxListeners(100); // We expect a lot of listeners
    this._scanner.minNotifyInterval = 200;
    this._scanner.keepAliveDuration = 5000;
  }

  /**
   * Registers a listener function that will be called when the specified
   * event is raised.
   * See {@link PixelsCentralEventMap} for the list of events and their
   * associated data.
   * @param type A case-sensitive string representing the event type to listen for.
   * @param listener The callback function.
   */
  addEventListener<K extends keyof PixelsCentralEventMap>(
    type: K,
    listener: EventReceiver<PixelsCentralEventMap[K]>
  ): void {
    if (
      type === "isReady" &&
      this._evEmitter.listenerCount(type) === 0 &&
      !this._onScannerReady
    ) {
      this._onScannerReady = (isReady: boolean) => {
        if (isReady) {
          console.log("[PixelsCentral] Scanner is ready");
          for (const pixelId of this.watchedPixelsIds) {
            const entry = this._watched.get(pixelId);
            if (typeof entry === "object") {
              const { pixel } = entry;
              pixel
                // TODO fix for some Android phones that won't reconnect if they were already in connecting stat
                .disconnect()
                .catch((e) => pixelLog(pixel, `Disconnect error ${e}`))
                .finally(() => entry.connect());
            }
          }
        }
        this._emitEvent("isReady", isReady);
      };
      this._scanner.addEventListener("isReady", this._onScannerReady);
    } else if (
      type === "scanStatus" &&
      this._evEmitter.listenerCount(type) === 0 &&
      !this._onScanStatus
    ) {
      this._onScanStatus = (status: ScanStatus) =>
        this._emitEvent("scanStatus", status);
      this._scanner.addEventListener("status", this._onScanStatus);
    }
    this._evEmitter.addListener(type, listener);
  }

  /**
   * Unregisters a listener from receiving events identified by
   * the given event name.
   * See {@link PixelsCentralEventMap} for the list of events and their
   * associated data.
   * @param type A case-sensitive string representing the event type.
   * @param listener The callback function to unregister.
   */
  removeEventListener<K extends keyof PixelsCentralEventMap>(
    type: K,
    listener: EventReceiver<PixelsCentralEventMap[K]>
  ): void {
    if (
      type === "isReady" &&
      this._onScannerReady &&
      this._evEmitter.listenerCount(type) <= 1
    ) {
      this._scanner.removeEventListener("isReady", this._onScannerReady);
      this._onScannerReady = undefined;
    } else if (
      type === "scanStatus" &&
      this._onScanStatus &&
      this._evEmitter.listenerCount(type) <= 1
    ) {
      this._scanner.removeEventListener("status", this._onScanStatus);
      this._onScanStatus = undefined;
    }
    this._evEmitter.removeListener(type, listener);
  }

  getPixel(pixelId?: number): Pixel | undefined {
    const entry = pixelId && this._watched.get(pixelId);
    return typeof entry === "object" ? entry.pixel : undefined;
  }

  // Scans for new Pixels until stopScan() is called.
  startScan(): void {
    this._internalStartScan();
  }

  // Stops an ongoing scan.
  stopScan(): void {
    this._scannerUnhook?.();
    this._scannerUnhook = undefined;
    this._scanner.stopAsync().catch((e) => {
      console.log(
        `[PixelsCentral] Scan stop error ${e} (status is ${this.scanStatus})`
      );
      // Ignore error if scanner has successfully stopped anyway
      if (this.scanStatus !== "stopped") {
        this._emitEvent(
          "scanError",
          e instanceof Error ? e : new Error(String(e))
        );
      }
    });
  }

  // Scan for Pixels during a short period of time.
  // If missing Pixels are found, then attempt to connect to them if listed in `pixelsIds`.
  // Notes:
  // - If called multiple times before the scan stops then the Pixel ids accumulates.
  // - Will be interrupted if stopScan() is called.
  connectToMissingPixels(pixelsIds: readonly number[] | number): void {
    pixelsIds = Array.isArray(pixelsIds) ? pixelsIds : [pixelsIds];
    const missingPixels = pixelsIds.filter(
      (id) => this._watched.get(id) === "watched"
    );
    if (missingPixels.length) {
      this._internalStartScan(missingPixels);
    } else {
      console.log("[PixelsCentral] No given missing Pixels to scan for");
    }
  }

  isWatched(pixelId: number): boolean {
    return this._watched.has(pixelId);
  }

  watch(pixelId: number): void {
    if (!this._watched.has(pixelId)) {
      console.log(`[PixelsCentral] Watching Pixel ${unsigned32ToHex(pixelId)}`);
      this._scanListListener({
        ops: [{ type: "removed", pixelId }],
      });
      this._watched.set(pixelId, "watched");
      this._autoConnect(pixelId);
    }
  }

  unwatch(pixelId: number): void {
    const entry = this._watched.get(pixelId);
    if (entry) {
      console.log(
        `[PixelsCentral] Un-watching Pixel ${unsigned32ToHex(pixelId)}`
      );
      this._watched.delete(pixelId);
      if (typeof entry === "object") {
        entry.unwatch();
        this._emitEvent("pixelRemoved", { pixel: entry.pixel });
        this._emitEvent("pixels", this.pixels);
      }
    }
  }

  unwatchAll(): void {
    for (const id of this.watchedPixelsIds) {
      this.unwatch(id);
    }
  }

  async updatePixelAsync({
    pixel,
    bootloaderPath,
    firmwarePath,
  }: {
    readonly pixel: Pixel;
    readonly bootloaderPath?: string;
    readonly firmwarePath: string;
  }): Promise<void> {
    if (this._pixelInDFU) {
      throw new Error("DFU in progress");
    }
    const updatePixelInDFU = (pixel?: Pixel) => {
      if (this._pixelInDFU !== pixel) {
        const entry =
          this._pixelInDFU && this._watched.get(this._pixelInDFU.pixelId);
        this._pixelInDFU = pixel;
        if (typeof entry === "object") {
          // Auto re-connect to die after DFU
          entry.connect();
        }
        this._emitEvent("pixelInDFU", pixel);
      }
    };
    updatePixelInDFU(pixel);
    try {
      let attemptsCount = 0;
      let wasUploading = false;
      while (true) {
        try {
          const recoverFromUploadError = wasUploading;
          ++attemptsCount;
          wasUploading = false;
          await updateFirmware({
            recoverFromUploadError,
            systemId: pixel.systemId,
            pixelId: pixel.pixelId,
            bootloaderPath,
            firmwarePath,
            dfuStateCallback: (state) => {
              if (state === "uploading") {
                wasUploading = true;
              } else if (state === "disconnecting") {
                wasUploading = false;
              }
              this._emitEvent("pixelDfuState", { pixel, state });
            },
            dfuProgressCallback: (progress) =>
              this._emitEvent("pixelDfuProgress", { pixel, progress }),
          });
          break;
        } catch (e) {
          logError(`DFU error ${e}${wasUploading ? " (was uploading)" : ""}`);
          if (!wasUploading || Platform.OS !== "android" || attemptsCount > 5) {
            this._emitEvent("pixelDfuError", {
              pixel,
              error: e instanceof Error ? e : new Error(String(e)),
            });
            throw e;
          }
        }
      }
    } finally {
      updatePixelInDFU(undefined);
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

  private _internalStartScan(pixelsIds?: readonly number[]) {
    if (!pixelsIds) {
      this._manualScan = true;
    }
    if (!this._scannerUnhook) {
      this._setupScanner();
    }
    // Start scanning
    this._scanner
      .startAsync()
      // Setup connect ids only if the scan started successfully
      .then(
        () =>
          pixelsIds &&
          this.scanStatus === "scanning" &&
          this._setupConnectIds(pixelsIds)
      )
      .catch((e) => {
        console.log(
          `[PixelsCentral] Scan start error ${e} (status is ${
            this.scanStatus
          }, bluetooth state is ${Central.getBluetoothState()})`
        );
        const stillHooked = !!this._scannerUnhook;
        // Unhook from scanner events as we failed to start
        this._scannerUnhook?.();
        this._scannerUnhook = undefined;
        if (stillHooked) {
          // We were still hooked, meaning no "stopped" event was received
          // and so no scan error was reported
          this._emitEvent(
            "scanError",
            e instanceof Error ? e : new Error(String(e))
          );
        }
      });
  }

  private _setupScanner() {
    console.log("[PixelsCentral] Hooking to scanner events");
    // Hook up to scanner events
    const onStatus = ({ status, stopReason }: PixelScannerStatusEvent) => {
      if (status === "stopped") {
        // Unhook event listeners when scanner is stopped
        if (!this._scannerUnhook) {
          console.warn(
            "[PixelsCentral] Not hooked on scanner despite getting stop event"
          );
        } else {
          this._scannerUnhook();
          this._scannerUnhook = undefined;
        }
        if (stopReason && stopReason !== "success") {
          console.log(`[PixelsCentral] Scan stopped with reason ${stopReason}`);
          // Convert stop reason to error
          this._emitEvent(
            "scanError",
            stopReason === "failedToStart"
              ? new ScanStartFailed(Central.getBluetoothState())
              : stopReason === "unauthorized"
                ? new BluetoothNotAuthorizedError()
                : new BluetoothUnavailableError(stopReason)
          );
        }
      }
    };
    const onScanOps = (ev: PixelScannerEventMap["scanListOperations"]) =>
      this._scanListListener(ev);
    this._scanner.addEventListener("scanStatus", onStatus);
    this._scanner.addEventListener("scanListOperations", onScanOps);
    // Setup cleanup function
    this._scannerUnhook?.();
    this._scannerUnhook = () => {
      console.log("[PixelsCentral] Unhooking from scanner events");
      this._manualScan = false;
      for (const id of this._scanTimeoutIds) {
        clearTimeout(id);
      }
      this._scanTimeoutIds.length = 0;
      this._connectFromScan.clear();
      this._scanner.removeEventListener("scanStatus", onStatus);
      this._scanner.removeEventListener("scanListOperations", onScanOps);
      // Clear scan list
      if (this._scannedPixels.length) {
        this._scannedPixels.length = 0;
        this._emitEvent("availablePixels", this.availablePixels);
      }
    };
  }

  private _setupConnectIds(pixelsIds: readonly number[]) {
    pixelsIds = [...pixelsIds]; // Keep an immutable copy
    console.log(
      `[PixelsCentral] Adding auto-connect ids ${pixelsIds
        .map(unsigned32ToHex)
        .join(", ")}`
    );
    for (const id of pixelsIds) {
      const count = this._connectFromScan.get(id) ?? 0;
      this._connectFromScan.set(id, count + 1);
    }
    const scanDuration = 6000; // A reasonable duration to scan for advertising Pixels
    this._scanTimeoutIds.push(
      setTimeout(() => {
        console.log(
          `[PixelsCentral] Removing auto-connect ids ${pixelsIds
            .map(unsigned32ToHex)
            .join(", ")}`
        );
        for (const id of pixelsIds) {
          const count = this._connectFromScan.get(id) ?? 0;
          if (count <= 1) {
            this._connectFromScan.delete(id);
          } else {
            this._connectFromScan.set(id, count - 1);
          }
        }
        // Stop scanning if we removed the last ids
        if (!this._manualScan && !this._connectFromScan.size) {
          console.log("[PixelsCentral] Stopping scan on timeout");
          this.stopScan();
        }
      }, scanDuration)
    );
  }

  private _scanListListener({
    ops,
  }: PixelScannerEventMap["scanListOperations"]): void {
    const availableCount = this.availablePixels.length;
    for (const op of ops) {
      const t = op.type;
      switch (t) {
        case "scanned": {
          const notifier = ScannedPixelNotifier.getInstance(op.scannedPixel);
          if (
            this._scannedPixels.every((sp) => sp.pixelId !== notifier.pixelId)
          ) {
            if (!this._watched.has(notifier.pixelId)) {
              this._scannedPixels.push(notifier);
            } else if (this._connectFromScan.has(notifier.pixelId)) {
              // Connect to our die if paired and in the filtered list
              this._autoConnect(notifier.pixelId);
            }
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
        if (pixel !== this._pixelInDFU && this._watched.has(pixelId)) {
          pixelLog(pixel, "Connecting...");
          pixel.connect().catch((e: Error) => {
            pixelLog(pixel, `Connection error => ${e}`);
          });
        }
      };

      // Add event listeners
      const onStatus = ({ status }: PixelOwnMutableProps) => {
        if (status === "disconnected") {
          // TODO Delay reconnecting because our previous call to connect() might still be cleaning up
          setTimeout(connect, 2000);
        }
      };
      pixel.addPropertyListener("status", onStatus);

      // Callback to unsubscribe from all event listeners
      const unwatch = () => {
        pixel.removePropertyListener("status", onStatus);
        // Catch errors on disconnect
        pixel.disconnect().catch((e: Error) => {
          pixelLog(pixel, `Disconnection error => ${e}`);
        });
      };

      // Keep track of Pixels we're connecting to
      this._watched.set(pixelId, {
        pixel,
        connect,
        unwatch,
      });

      // Notify we've got a new active Pixel
      this._emitEvent("pixelFound", { pixel });
      this._emitEvent("pixels", this.pixels);

      // Connect to die
      connect();
    }

    return this._watched.get(pixelId) !== "watched";
  }
}
