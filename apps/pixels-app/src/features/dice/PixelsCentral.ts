import {
  assertNever,
  createTypedEventEmitter,
  EventReceiver,
  unsigned32ToHex,
} from "@systemic-games/pixels-core-utils";
import { DfuState } from "@systemic-games/react-native-nordic-nrf5-dfu";
import {
  BluetoothNotAuthorizedError,
  BluetoothUnavailableError,
  Central,
  getPixel,
  Pixel,
  PixelScanner,
  PixelScannerEventMap,
  PixelScannerStatusEvent,
  ScannedPixelNotifier,
  ScanStartFailed,
  ScanStatus,
} from "@systemic-games/react-native-pixels-connect";

import { PixelOperationParams, PixelScheduler } from "./PixelScheduler";

import { updateFirmware } from "~/features/dfu/updateFirmware";
import { logError } from "~/features/utils";

export type PixelsCentralEventMap = Readonly<{
  // Props
  isReady: boolean;
  scanStatus: ScanStatus;
  availablePixels: readonly ScannedPixelNotifier[];
  pixels: readonly Pixel[];
  pixelInDFU: Pixel | undefined;
  // Events
  onScanError: { error: Error };
  onPixelFound: { pixel: Pixel }; // Watched Pixel was found (scanned)
  onPixelRemoved: { pixel: Pixel }; // Found Pixel was removed (unwatched)
  pixelDfuState: { pixel: Pixel; state: DfuState; error?: Error };
  pixelDfuProgress: { pixel: Pixel; progress: number };
  pixelDfuError: { pixel: Pixel; error: Error };
}>;

// Watched Pixels are added to the "pixels" list whenever they are found (= scanned)
export class PixelsCentral {
  private readonly _evEmitter =
    createTypedEventEmitter<PixelsCentralEventMap>();

  // Scanner
  private _onScannerReady?: (b: boolean) => void;
  private _onScanStatus?: (s: ScanStatus) => void;
  private readonly _scanner = new PixelScanner();
  private readonly _scannedPixels: ScannedPixelNotifier[] = [];
  private readonly _connectFromScan = new Map<number, number>(); // List of Pixels to connect to when scanning
  private readonly _scanTimeoutIds: ReturnType<typeof setTimeout>[] = [];
  private _manualScan = false; // Whether the scanner was started manually (and not by  connectToMissingPixels)
  private _scannerUnhook?: () => void;

  // Connection
  private readonly _allSchedulers = new Map<number, PixelScheduler>(); // All schedulers created so far
  private readonly _watched = new Map<number, "watched" | Pixel>();
  private readonly _disposers = new Map<number, () => void>();

  // DFU
  private _pixelInDFU?: Pixel; // The die for which we are currently doing a DFU

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
        pixels.push(entry);
      }
    }
    return pixels;
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
        // We use this event to know if Bluetooth is available for use
        if (isReady) {
          console.log("[PixelsCentral] Scanner is ready");
          for (const pixelId of this.watchedPixelsIds) {
            const entry = this._watched.get(pixelId);
            if (typeof entry === "object" && entry !== this._pixelInDFU) {
              // TODO fix for some Android phones that won't reconnect when in connecting state
              // while Bluetooth was unavailable
              this._schedule(entry.pixelId, {
                type: "connect",
                mode: "reconnect",
              });
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
    this._evEmitter.removeListener(type, listener);
    if (
      type === "isReady" &&
      this._onScannerReady &&
      this._evEmitter.listenerCount(type) <= 0
    ) {
      this._scanner.removeEventListener("isReady", this._onScannerReady);
      this._onScannerReady = undefined;
    } else if (
      type === "scanStatus" &&
      this._onScanStatus &&
      this._evEmitter.listenerCount(type) <= 0
    ) {
      this._scanner.removeEventListener("status", this._onScanStatus);
      this._onScanStatus = undefined;
    }
  }

  getPixel(pixelId: number): Pixel | undefined {
    const entry = this._watched.get(pixelId);
    return typeof entry === "object" ? entry : undefined;
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
        this._emitEvent("onScanError", {
          error: e instanceof Error ? e : new Error(String(e)),
        });
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
      this._disposers.get(pixelId)?.();
      this._disposers.delete(pixelId);
      if (typeof entry === "object") {
        this._schedule(pixelId, { type: "disconnect" });
        this._emitEvent("onPixelRemoved", { pixel: entry });
        this._emitEvent("pixels", this.pixels);
      }
    }
  }

  unwatchAll(): void {
    for (const id of this.watchedPixelsIds) {
      this.unwatch(id);
    }
  }

  getScheduler(pixelId: number): PixelScheduler {
    const scheduler = this._allSchedulers.get(pixelId);
    if (scheduler) {
      return scheduler;
    } else {
      const newScheduler = new PixelScheduler();
      this._allSchedulers.set(pixelId, newScheduler);
      return newScheduler;
    }
  }

  async updatePixelAsync({
    pixelId,
    bootloaderPath,
    firmwarePath,
  }: Readonly<{
    pixelId: number;
    bootloaderPath?: string;
    firmwarePath: string;
  }>): Promise<void> {
    if (this._pixelInDFU) {
      throw new Error("DFU in progress");
    }
    const pixel = this.getPixel(pixelId);
    if (!pixel) {
      throw new Error(`No Pixel with id ${unsigned32ToHex(pixelId)}`);
    }
    this._pixelInDFU = pixel;
    this._emitEvent("pixelInDFU", this._pixelInDFU);
    try {
      let attemptsCount = 0;
      let uploadError = false;
      while (true) {
        try {
          const recoverFromUploadError = uploadError;
          ++attemptsCount;
          uploadError = false;
          await updateFirmware({
            systemId: pixel.systemId,
            pixelId: pixel.pixelId,
            bootloaderPath,
            firmwarePath,
            recoverFromUploadError,
            dfuStateCallback: (state) => {
              if (state === "uploading") {
                uploadError = true;
              }
              this._emitEvent("pixelDfuState", { pixel, state });
            },
            dfuProgressCallback: (progress) =>
              this._emitEvent("pixelDfuProgress", { pixel, progress }),
          });
          break;
        } catch (e) {
          logError(
            `DFU${uploadError ? " update" : ""} error #${attemptsCount} ${e}`
          );
          if (attemptsCount >= 3) {
            const error = e instanceof Error ? e : new Error(String(e));
            this._emitEvent("pixelDfuError", { pixel, error });
            throw error;
          }
        }
      }
    } finally {
      if (this._pixelInDFU) {
        const pixel = this._pixelInDFU;
        if (this._watched.get(pixel.pixelId) === pixel) {
          // Connect to die after DFU
          this._schedule(pixel.pixelId, { type: "connect" });
        }
        this._pixelInDFU = undefined;
        this._emitEvent("pixelInDFU", pixel);
      }
    }
  }

  private _emitEvent<T extends keyof PixelsCentralEventMap>(
    name: T,
    ev: PixelsCentralEventMap[T]
  ): void {
    try {
      this._evEmitter.emit(name, ev);
    } catch (e) {
      logError(
        `PixelsCentral: Uncaught error in "${name}" event listener: ${e}`
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
          this._emitEvent("onScanError", {
            error: e instanceof Error ? e : new Error(String(e)),
          });
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
          this._emitEvent("onScanError", {
            error:
              stopReason === "failedToStart"
                ? new ScanStartFailed(Central.getBluetoothState())
                : stopReason === "unauthorized"
                  ? new BluetoothNotAuthorizedError()
                  : new BluetoothUnavailableError(stopReason),
          });
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
          if (op.item.type === "pixel") {
            const notifier = ScannedPixelNotifier.getInstance(op.item);
            if (
              this._scannedPixels.every((sp) => sp.pixelId !== notifier.pixelId)
            ) {
              if (!this._watched.has(notifier.pixelId)) {
                this._scannedPixels.push(notifier);
              } else if (this._connectFromScan.has(notifier.pixelId)) {
                // Connect to our die if paired and in the watched list
                this._autoConnect(notifier.pixelId);
              }
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

  private _autoConnect(pixelId: number): void {
    const pixel = getPixel(pixelId);
    if (pixel && this._watched.get(pixelId) === "watched") {
      // Attach scheduler to Pixel
      this.getScheduler(pixelId).attach(pixel);
      this._watched.set(pixelId, pixel);

      // Notify we've got a new active Pixel
      this._emitEvent("onPixelFound", { pixel });
      this._emitEvent("pixels", this.pixels);

      // Connect only if not in DFU
      const connect = () => {
        if (pixel !== this._pixelInDFU && this._watched.has(pixelId)) {
          this._schedule(pixelId, { type: "connect" });
        }
      };

      // Reconnect automatically when disconnected
      if (!this._disposers.has(pixelId)) {
        const onStatus = () => {
          pixel.status === "disconnected" && connect();
        };
        pixel.addPropertyListener("status", onStatus);
        this._disposers.set(pixelId, () =>
          pixel.removePropertyListener("status", onStatus)
        );
      } else {
        logError(
          `Disposer already exists for Pixel ${unsigned32ToHex(pixelId)}`
        );
      }

      // Connect to die
      connect();
    }
  }

  private _schedule(pixelId: number, operation: PixelOperationParams) {
    const scheduler = this.getScheduler(pixelId);
    scheduler.schedule(operation);
  }
}
