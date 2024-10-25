import {
  assertNever,
  createTypedEventEmitter,
  EventReceiver,
  unsigned32ToHex,
} from "@systemic-games/pixels-core-utils";
import { DfuState } from "@systemic-games/react-native-nordic-nrf5-dfu";
import {
  Color,
  ConnectError,
  Pixel,
  PixelMutableProps,
  PixelScannerEventMap,
  PixelStatusEvent,
  ScannedBootloaderNotifier,
  ScannedPixel,
  ScannedPixelNotifier,
  ScanStatus,
} from "@systemic-games/react-native-pixels-connect";

import {
  PixelOperationParams,
  PixelScheduler,
  PixelSchedulerEventMap,
} from "./PixelScheduler";
import { PriorityQueue } from "./PriorityQueue";
import { ScanRequester } from "./ScanRequester";
import { getDieDfuAvailability } from "./getDieDfuAvailability";

import { updateFirmware } from "~/features/dfu/updateFirmware";
import { logError } from "~/features/utils";
import { DfuFilesInfo } from "~/hooks";

//
// Timing parameters
//

// Connection release parameters
const connectionRelease = {
  interval: 7000, // We hope it's enough time to connect to a Pixel
  window: 20000, // Should allow for at least 2 connection releases
  maxScanDelta: 1500, // Release connection if scanned twice within this time
  gracePeriod: 5000, // Time after scan to still allow for connection release
  connectGattFailureDelta: 5000, // Maximum delay between 2 GATT failures to trigger a connection release
} as const;

// This delay is to avoid stopping/starting scanner too often
const stopScanDelay = connectionRelease.interval + 2000;

// Delay before trying to reconnect after a disconnect
const reconnectionDelay = 1000;
const reconnectionDelayTooManyErrors = 30000;

//
// Helper functions
//

function getScheduler(pixelId: number): PixelScheduler {
  return PixelScheduler.getScheduler(pixelId);
}

function getPixel(pixelId: number): Pixel | undefined {
  return PixelScheduler.getScheduler(pixelId).pixel;
}

function isConnected(
  status?: Pixel["status"]
): status is "identifying" | "ready" {
  return status === "identifying" || status === "ready";
}

function isGattFailure(error: Error): boolean {
  return (
    error?.cause instanceof ConnectError && error.cause.type === "gattFailure"
  );
}

async function waitConnectedAsync(
  pixel: Pixel,
  timeout = 20000
): Promise<boolean> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let resolveConnected: () => void;
  const onStatus = ({ status }: PixelMutableProps) =>
    isConnected(status) && resolveConnected();
  pixel.addPropertyListener("status", onStatus);
  try {
    return await new Promise<boolean>((resolve) => {
      resolveConnected = () => resolve(true);
      timeoutId = setTimeout(() => resolve(false), timeout);
      onStatus(pixel);
    });
  } finally {
    pixel.removePropertyListener("status", onStatus);
    clearTimeout(timeoutId);
  }
}

type OperationsParams = Readonly<{
  // connect: Extract<PixelOperationParams, { type: "connect" }>;
  // disconnect: Extract<PixelOperationParams, { type: "disconnect" }>;
  turnOff: Extract<PixelOperationParams, { type: "turnOff" }>;
  updateFirmware: Extract<PixelOperationParams, { type: "updateFirmware" }>;
  resetSettings: Extract<PixelOperationParams, { type: "resetSettings" }>;
  rename: Extract<PixelOperationParams, { type: "rename" }>;
  blink: Extract<PixelOperationParams, { type: "blink" }>;
  programProfile: Extract<PixelOperationParams, { type: "programProfile" }>;
}>;

/**
 * Connect queue for Pixels.
 */
export type ConnectQueue = { highPriority: number[]; lowPriority: number[] };

/**
 * Event map for {@link PixelsCentral} class.
 * This is the list of supported events where the property name
 * is the event name and the property type the event data type.
 */
export type PixelsCentralEventMap = Readonly<{
  // Props
  isReady: boolean;
  scanStatus: ScanStatus;
  pixels: readonly Pixel[];
  connectQueue: Readonly<ConnectQueue>;
  pixelInDFU: number | undefined;

  // Events
  onScanError: Readonly<{ error: Error }>;
  onAvailability: Readonly<{
    status: "available" | "lost" | "registered";
    notifier: ScannedPixelNotifier;
  }>;
  onRegisterPixel: Readonly<{ pixelId: number }>; // New registered Pixel
  onUnregisterPixel: Readonly<{ pixelId: number }>; // Pixel was unregistered
  onPixelScanned: Readonly<{
    status: "scanned" | "lost";
    notifier: ScannedPixelNotifier;
  }>;
  onInBootloader: Readonly<{
    status: "scanned" | "lost";
    notifier: ScannedBootloaderNotifier;
  }>;
  onPixelFound: Readonly<{ pixel: Pixel }>; // Registered Pixel was found (scanned)
  onConnectionLimitReached: Readonly<{
    pixelId: number;
    disconnectId?: number;
  }>; // Failed to connect Pixel because connection limit was reached
  // DFU events
  onDfuState: { pixelId: number; state: DfuState | "scanning"; error?: Error };
  onDfuProgress: { pixelId: number; progress: number };
}>;

// Registered Pixels are added to the "pixels" list whenever they are found (= scanned)
export class PixelsCentral {
  private readonly _evEmitter =
    createTypedEventEmitter<PixelsCentralEventMap>();

  // Scanner for discovering Pixels
  private readonly _scanner = new ScanRequester({
    minNotifyInterval: 300,
    keepAliveDuration: 7000,
    stopScanDelay,
  });
  private readonly _onScanReady: () => void;

  // Registered Pixels
  private readonly _pixels = new Map<
    number,
    {
      lastScanTime?: number; // Timestamp of last scan
      nextDiscoOnScan?: number; // Timestamp for next connection release attempt on scanning, undefined if not scheduled
      scanEndTime?: number; // Timestamp for end of scan window
      lastConnectError?: { time: number; error: Error }; // Timestamp of last connection error
      cancelScan?: () => void;
      cancelNextConnect?: () => void;
      disposer?: () => void;
      // Bootloader
      lastBootloaderScanTime?: number; // Timestamp of last bootloader scan, reset on Pixel scan or connection
    }
  >();

  // Priority queue of Pixels to connect
  private readonly _connectQueue = new PriorityQueue();

  // DFU
  private _pixelInDFU: number | undefined;

  get isReady(): boolean {
    return this._scanner.isReady;
  }

  get scanStatus(): ScanStatus {
    return this._scanner.status;
  }

  // Pixels ids of all Pixels that have been registered
  get registeredPixelsIds(): number[] {
    return [...this._pixels.keys()];
  }

  // List of registered Pixels that have been found
  get pixels(): Pixel[] {
    const pixels: Pixel[] = [];
    for (const pixelId of this._pixels.keys()) {
      const pixel = getPixel(pixelId);
      pixel && pixels.push(pixel);
    }
    return pixels;
  }

  get connectQueue(): ConnectQueue {
    return {
      highPriority: this._connectQueue.highPriorityIds,
      lowPriority: this._connectQueue.lowPriorityIds,
    };
  }

  get pixelInDFU(): number | undefined {
    return this._pixelInDFU;
  }

  constructor() {
    this._evEmitter.setMaxListeners(100); // We expect a lot of listeners
    this._onScanReady = () => {
      if (this._scanner.isReady) {
        // Connect to all queued dice on Bluetooth ready
        const ids = this._connectQueue.allIds.reverse();
        for (const id of ids) {
          this._connect(id);
        }
      }
    };
  }

  /**
   * Registers a listener function that will be called when the specified
   * event is raised.
   * See {@link PixelsCentralEventMap} for the list of events and their
   * associated data.
   * @param type A case-sensitive string representing the event type to listen for.
   * @param listener The callback function.
   */
  addListener<K extends keyof PixelsCentralEventMap>(
    type: K,
    listener: EventReceiver<PixelsCentralEventMap[K]>
  ): () => void {
    if (type === "isReady") {
      this._scanner.addListener(
        "isReady",
        listener as EventReceiver<PixelsCentralEventMap["isReady"]>
      );
    } else if (type === "scanStatus") {
      this._scanner.addListener(
        "status",
        listener as EventReceiver<PixelsCentralEventMap["scanStatus"]>
      );
    } else if (type === "onScanError") {
      this._scanner.addListener(
        "onScanError",
        listener as EventReceiver<PixelsCentralEventMap["onScanError"]>
      );
    } else {
      this._evEmitter.addListener(type, listener);
    }

    return () => this.removeListener(type, listener);
  }

  /**
   * Unregisters a listener from receiving events identified by
   * the given event name.
   * See {@link PixelsCentralEventMap} for the list of events and their
   * associated data.
   * @param type A case-sensitive string representing the event type.
   * @param listener The callback function to unregister.
   */
  removeListener<K extends keyof PixelsCentralEventMap>(
    type: K,
    listener: EventReceiver<PixelsCentralEventMap[K]>
  ): void {
    if (type === "isReady") {
      this._scanner.removeListener(
        "isReady",
        listener as EventReceiver<PixelsCentralEventMap["isReady"]>
      );
    } else if (type === "scanStatus") {
      this._scanner.removeListener(
        "status",
        listener as EventReceiver<PixelsCentralEventMap["scanStatus"]>
      );
    } else if (type === "onScanError") {
      this._scanner.removeListener(
        "onScanError",
        listener as EventReceiver<PixelsCentralEventMap["onScanError"]>
      );
    } else {
      this._evEmitter.removeListener(type, listener);
    }
  }

  isRegistered(pixelId: number): boolean {
    return this._pixels.has(pixelId);
  }

  // Returns the Pixel with the given id, if it is registered
  getPixel(pixelId: number): Pixel | undefined {
    if (this._pixels.has(pixelId)) {
      return getPixel(pixelId);
    }
  }

  register(pixelId: number): void {
    if (!this._pixels.size) {
      // There should be no need to unsubscribe, this is just out of caution
      this._scanner.removeListener("isReady", this._onScanReady);
      this._scanner.addListener("isReady", this._onScanReady);
    }
    if (!this._pixels.has(pixelId)) {
      console.log(
        `[PixelsCentral] Registering Pixel ${unsigned32ToHex(pixelId)}`
      );
      this._pixels.set(pixelId, {});
      this._emitEvent("onRegisterPixel", { pixelId });
      // Emit "registered" event so this Pixel is not
      // reported as available anymore
      const notifier = ScannedPixelNotifier.findInstance(pixelId);
      notifier &&
        this._emitEvent("onAvailability", {
          status: "registered",
          notifier,
        });
      // Pixels list changes only if Pixel instance exists
      if (getPixel(pixelId)) {
        // We have a Pixel instance, meaning it has already been scanned
        this._onPixelFound(pixelId);
      }
    }
  }

  unregister(pixelId: number): void {
    const data = this._pixels.get(pixelId);
    if (data) {
      console.log(
        `[PixelsCentral] Unregistering Pixel ${unsigned32ToHex(pixelId)}`
      );
      this._pixels.delete(pixelId);
      this._connectQueue.dequeue(pixelId);
      data.cancelNextConnect?.();
      data.cancelScan?.();
      data.disposer?.();
      // Unschedule any pending DFU
      getScheduler(pixelId).unschedule("updateFirmware");
      this._emitEvent("onUnregisterPixel", { pixelId });
      if (getPixel(pixelId)) {
        this._emitEvent("pixels", this.pixels);
      }
    }
    if (!this._pixels.size) {
      this._scanner.removeListener("isReady", this._onScanReady);
    }
  }

  unregisterAll(): void {
    for (const id of this.registeredPixelsIds) {
      this.unregister(id);
    }
  }

  // Scan for Pixels
  scanForPixels(): () => void {
    // Register scan list listener on first requested scans
    if (!this._scanner.isScanRequested) {
      const onScanListChange = (
        ev: PixelScannerEventMap["onScanListChange"]
      ) => {
        for (const op of ev.ops) {
          if (op.item.type === "pixel") {
            const { pixelId } = op.item;
            const scanStatus = op.status;
            switch (scanStatus) {
              case "scanned": {
                this._pixels.has(pixelId) &&
                  console.log(
                    `[PixelsCentral] Scanned Pixel ${unsigned32ToHex(pixelId)} delay=${Date.now() - op.item.timestamp.getTime()} connect=${this._connectQueue.includes(pixelId)}`
                  );
                // Always update notifier
                this._onScannedPixel(ScannedPixelNotifier.getInstance(op.item));
                break;
              }
              case "lost": {
                this._pixels.has(pixelId) &&
                  console.log(
                    `[PixelsCentral] Lost Pixel ${unsigned32ToHex(pixelId)} connect=${this._connectQueue.includes(pixelId)}`
                  );
                const notifier = ScannedPixelNotifier.findInstance(pixelId);
                notifier &&
                  this._emitEvent(
                    this._pixels.has(pixelId)
                      ? "onPixelScanned"
                      : "onAvailability",
                    {
                      status: "lost",
                      notifier,
                    }
                  );
                break;
              }
              default:
                assertNever(scanStatus);
            }
          } else if (
            op.status === "scanned" &&
            op.item.type === "bootloader" &&
            this._pixels.has(op.item.pixelId)
          ) {
            // Always update notifier
            const notifier = ScannedBootloaderNotifier.getInstance(op.item);
            const data = this._pixels.get(op.item.pixelId);
            if (data) {
              !data.lastBootloaderScanTime &&
                console.log(
                  `[PixelsCentral] Scanned Bootloader ${unsigned32ToHex(op.item.pixelId)} delay=${Date.now() - op.item.timestamp.getTime()}`
                );
              // Track time of last bootloader scan
              data.lastBootloaderScanTime = notifier.timestamp.getTime();
              // Notify
              this._emitEvent("onInBootloader", {
                status: "scanned",
                notifier,
              });
            }
          }
        }
      };
      // Unregister scan list listener when no longer scanning
      const onScanReq = (scan: boolean) => {
        if (!scan) {
          this._scanner.removeListener("isScanRequested", onScanReq);
          this._scanner.removeListener("onScanListChange", onScanListChange);
        }
      };
      this._scanner.addListener("isScanRequested", onScanReq);
      this._scanner.addListener("onScanListChange", onScanListChange);
    }
    return this._scanner.requestScan();
  }

  async waitForScannedPixelAsync(
    pixelId: number,
    timeout = 20000
  ): Promise<ScannedPixel | undefined> {
    console.log(
      `[PixelsCentral] Wait for scanning Pixel ${unsigned32ToHex(pixelId)}`
    );

    // Create a promise that resolves when the Pixel is scanned
    let resolver: (value: ScannedPixel | undefined) => void;
    const promise = new Promise<ScannedPixel | undefined>(
      (resolve) => (resolver = resolve)
    );

    // Listen for scan events
    const onScanListChange = (ev: PixelScannerEventMap["onScanListChange"]) => {
      for (const op of ev.ops) {
        if (
          op.status === "scanned" &&
          op.item.type === "pixel" &&
          op.item.pixelId === pixelId
        ) {
          resolver(op.item);
          break;
        }
      }
    };
    this._scanner.addListener("onScanListChange", onScanListChange);

    // Stop scanning on timeout
    const id = setTimeout(() => resolver(undefined), timeout);

    // Start scanning
    const stopScan = this.scanForPixels();
    try {
      return await promise;
    } finally {
      clearTimeout(id);
      this._scanner.removeListener("onScanListChange", onScanListChange);
      stopScan();
    }
  }

  // Connect to a registered Pixel, may disconnect another Pixel if necessary
  // if the new connection is of high priority
  tryConnect(
    pixelId: number,
    opt?: { priority?: "low" | "high" } // Default: keep existing priority if any, otherwise low
  ): void {
    if (
      this._pixels.has(pixelId) &&
      (!!opt?.priority || !this._connectQueue.includes(pixelId))
    ) {
      console.log(
        `[PixelsCentral] Try connect Pixel ${unsigned32ToHex(pixelId)} with priority=${opt?.priority}`
      );
      // Subscribe to priority queue events
      this._subscribeToConnectQueueEvents();
      // Queue item
      this._connectQueue.queue(pixelId, opt?.priority ?? "low");
    }
  }

  // Try to reconnect to all dice already in the connection queue
  tryReconnectDice(): void {
    for (const id of this._connectQueue.allIds) {
      this._connect(id, { keepConnectionReleaseTimings: true });
    }
  }

  setBlinkColor(color: Readonly<Color>): void {
    PixelScheduler.blinkColor = color;
  }

  getCurrentOperation(pixelId: number): PixelOperationParams | undefined {
    return getScheduler(pixelId).currentOperation;
  }

  addOperationStatusListener<T extends keyof OperationsParams>(
    pixelId: number,
    operationType: T,
    listener: EventReceiver<
      Exclude<PixelSchedulerEventMap["onOperationStatus"], "operation"> & {
        operation: OperationsParams[T]; // Specify operation type
      }
    >
  ): () => void {
    const scheduler = getScheduler(pixelId);
    const onOperationStatus = (
      ev: PixelSchedulerEventMap["onOperationStatus"]
    ) => {
      if (ev.operation.type === operationType) {
        // @ts-ignore
        listener(ev);
      }
    };
    scheduler.addListener("onOperationStatus", onOperationStatus);
    return () =>
      scheduler.removeListener("onOperationStatus", onOperationStatus);
  }

  // Connect and disconnect are managed internally
  scheduleOperation(
    pixelId: number,
    operation: Exclude<
      PixelOperationParams,
      { type: "connect" | "disconnect" | "updateFirmware" }
    >
  ): void {
    if (this._pixels.has(pixelId)) {
      getScheduler(pixelId).schedule(operation);
    }
  }

  async tryUpdateFirmware(
    pixelId: number,
    filesInfo: DfuFilesInfo,
    opt: {
      bootloader?: boolean;
      force?: boolean;
    }
  ): Promise<boolean> {
    if (this._pixelInDFU) {
      throw new Error("A firmware update is already in progress");
    }
    if (!this._pixels.has(pixelId)) {
      throw new Error("Pixel not registered");
    }

    console.log(
      `[PixelsCentral] Try update firmware for Pixel ${unsigned32ToHex(pixelId)}`
    );

    this._pixelInDFU = pixelId;
    this._emitEvent("pixelInDFU", this._pixelInDFU);

    // DFU events callbacks
    const dfuStateCallback = (state: DfuState) =>
      this._emitEvent("onDfuState", { pixelId, state });
    const dfuProgressCallback = (progress: number) =>
      this._emitEvent("onDfuProgress", { pixelId, progress });

    try {
      const startTime = Date.now();
      const bootloaderPath = opt?.bootloader
        ? filesInfo.bootloaderPath
        : undefined;
      const firmwarePath = filesInfo.firmwarePath;

      // Get timestamp from scan if Pixel is not connected
      const scannedFwDate = !isConnected(getPixel(pixelId)?.status)
        ? (await this.waitForScannedPixelAsync(pixelId))?.firmwareDate
        : undefined;

      // Get Pixel instance again as it might have been discovered during the scan
      const pixel = this.getPixel(pixelId);
      // We also might have connected during the scan
      const timestamp = (
        isConnected(pixel?.status) // Don't use old timestamp if not connected
          ? pixel.firmwareDate
          : scannedFwDate
      )?.getTime();

      // Are we in bootloader?
      const bootloaderLastScan =
        this._pixels.get(pixelId)?.lastBootloaderScanTime ?? 0;
      if (bootloaderLastScan >= startTime) {
        const bootloader = ScannedBootloaderNotifier.findInstance(pixelId);
        if (!bootloader) {
          throw new Error("Pixel not available");
        }

        // Log some info
        console.log(
          `[PixelsCentral] ❗❗❗ DFU: Pixel ${unsigned32ToHex(pixelId)} in bootloader, RSSI=${bootloader?.rssi}, last scanned ${bootloaderLastScan - startTime}ms ago`
        );

        // Start DFU and wait for completion
        await updateFirmware({
          systemId: bootloader.systemId,
          pixelId,
          bootloaderPath,
          firmwarePath,
          dfuStateCallback,
          dfuProgressCallback,
          isBootloaderMacAddress: true,
        });
        return true;
      }

      // Check that we got a timestamp
      if (!pixel || !timestamp) {
        throw new Error("Pixel not available");
      }

      // Do we need to update the firmware?
      if (
        !!opt.force ||
        getDieDfuAvailability(timestamp, filesInfo.timestamp) === "outdated"
      ) {
        // Log some info
        console.log(
          `[PixelsCentral] DFU: Pixel ${unsigned32ToHex(pixelId)} FW timestamp=${timestamp}, status=${pixel.status}, ${(() => {
            const px = isConnected(pixel.status)
              ? pixel
              : (ScannedPixelNotifier.findInstance(pixelId) ?? pixel);
            return `RSSI=${px?.rssi}, battery=${px?.batteryLevel}, charging=${px?.isCharging}`;
          })()}, scanned=${!!scannedFwDate}`
        );

        // Disconnect all other dice to improve our chances
        for (const id of this._connectQueue.allIds) {
          if (id !== pixelId) {
            this._connectQueue.dequeue(id);
          }
        }

        // Connect to Pixel if not already connected
        if (!isConnected(pixel.status)) {
          console.warn(`WAIT CONNECT Pixel ${unsigned32ToHex(pixelId)}`);
          this.tryConnect(pixelId);
          if (!(await waitConnectedAsync(pixel))) {
            // Stop connecting
            this._connectQueue.dequeue(pixelId);
            throw new Error("Connection Timeout");
          }
        }

        // Start DFU and wait for completion
        const success = await getScheduler(pixelId).scheduleAndWaitAsync(
          {
            type: "updateFirmware",
            bootloaderPath,
            firmwarePath,
            dfuStateCallback,
            dfuProgressCallback,
          },
          (status) => {
            if (status === "starting") {
              // Prevent automatic reconnection to happen during DFU
              this._connectQueue.dequeue(pixelId);
            }
          }
        );

        // Check if operation was dropped
        if (!success) {
          throw new Error("Firmware update operation dropped");
        }

        // Check if we need to reset die settings to reprogram the normals
        // TODO: What we should really do is store the fact that we need to reset
        // the settings and let the app handle the reset on the next connection
        const FW_2024_03_25 = 1711398391000;
        if (timestamp <= FW_2024_03_25 && pixel.ledCount <= 6) {
          try {
            console.warn(
              `[PixelsCentral] DFU: Resetting settings for die ${pixel.name}`
            );
            await this._reprogramNormals(pixel);
          } catch (e) {
            logError(`[PixelsCentral] DFU: Failed to reset settings: ${e}`);
          }
        }

        // Return success even if we failed to reset settings
        return true;
      } else {
        console.log(
          `[PixelsCentral] DFU: Pixel ${unsigned32ToHex(pixelId)} already up-to-date`
        );
        return false;
      }
    } finally {
      this._pixelInDFU = undefined;
      this._emitEvent("pixelInDFU", undefined);
    }
  }

  private async _reprogramNormals(pixel: Pixel): Promise<void> {
    try {
      // Reconnect
      this.tryConnect(pixel.pixelId, { priority: "high" });
      if (!(await waitConnectedAsync(pixel))) {
        throw new Error("Failed to reconnect after DFU");
      }
      // Reset settings
      const success = await getScheduler(pixel.pixelId).scheduleAndWaitAsync({
        type: "resetSettings",
      });
      if (!success) {
        throw new Error("Reset settings operation dropped");
      }
    } finally {
      // Hack to make sure we disconnect
      this._pixelInDFU = undefined;
      // Disconnect
      this._connectQueue.dequeue(pixel.pixelId);
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

  private _onScannedPixel(notifier: ScannedPixelNotifier): void {
    const pixelId = notifier.pixelId;
    const data = this._pixels.get(pixelId);
    if (data) {
      // Not in bootloader if getting scanned
      this._notifyNotInBootloader(pixelId, data);
      // Report Pixel as available
      this._emitEvent("onPixelScanned", { status: "scanned", notifier });
      // Emit event if Pixel registered and scanned for the first time
      if (this._onPixelFound(pixelId)) {
        // Try to connect if queued for connection
        this._scheduleConnectIfQueued(pixelId);
      } else {
        // Track time of last scan
        const scanTime = notifier.timestamp.getTime();
        if (
          // Check that we are still scanning for this Pixel
          data.scanEndTime &&
          scanTime < data.scanEndTime + connectionRelease.gracePeriod &&
          // Check if scanned twice recently
          data.lastScanTime &&
          scanTime - data.lastScanTime < connectionRelease.maxScanDelta &&
          // And that we are past the time to attempt to release a connection
          data.nextDiscoOnScan &&
          data.lastScanTime > data.nextDiscoOnScan && // Use last scan time to be sure we're not using a scan that occurred while disconnected
          // Only for dice connecting as high priority
          this._connectQueue.isHighPriority(pixelId)
        ) {
          // We might end up here while being disconnected but still in the connect queue
          // (meaning a reconnection is or will be scheduled)
          if (getPixel(pixelId)?.status === "connecting") {
            // Set new connection release time
            data.nextDiscoOnScan = Date.now() + connectionRelease.interval;
            // We've probably reach the maximum number of connections, attempt to disconnect one die
            this._tryReleaseOneConnection(pixelId);
          } else {
            data.nextDiscoOnScan += reconnectionDelay;
          }
          // Schedule new scan
          this._scheduleScan(pixelId, data);
        } else {
          data.lastScanTime = scanTime;
        }
      }
    } else {
      // Report Pixel as available
      this._emitEvent("onAvailability", {
        status: "available",
        notifier,
      });
    }
  }

  private _onPixelFound(pixelId: number): true | undefined {
    // Emit event once for registered Pixels
    const data = this._pixels.get(pixelId);
    if (data && !data.disposer) {
      const pixel = getPixel(pixelId);
      if (pixel) {
        // Watch for Pixel connection status changes
        const onStatus = ({ status, reason }: PixelStatusEvent) =>
          this._onConnectionStatus(pixelId, status, reason);
        pixel.addEventListener("statusChanged", onStatus);
        // Listen for scheduler events
        const scheduler = getScheduler(pixelId);
        const onConnectOpStatus = (
          ev: PixelSchedulerEventMap["onOperationStatus"]
        ) =>
          ev.operation.type === "connect" &&
          ev.status === "failed" &&
          this._onConnectOperationFailed(pixel, ev.error);

        scheduler.addListener("onOperationStatus", onConnectOpStatus);
        // Store unhook function
        data.disposer = () => {
          pixel.removeEventListener("statusChanged", onStatus);
          scheduler.removeListener("onOperationStatus", onConnectOpStatus);
        };
        // Notify Pixels list changed
        this._emitEvent("pixels", this.pixels);
        // Notify Pixel found
        this._emitEvent("onPixelFound", { pixel });
        return true;
      }
    }
  }

  private _onConnectionStatus(
    pixelId: number,
    status: PixelStatusEvent["status"],
    reason: PixelStatusEvent["reason"]
  ): void {
    const data = this._pixels.get(pixelId);
    if (data) {
      // Keep timestamp of first connection attempt
      if (status === "connecting") {
        // Schedule scan
        this._scheduleScan(pixelId, data);
      } else {
        if (isConnected(status)) {
          // Not in bootloader if connected
          this._notifyNotInBootloader(pixelId, data);
          // Reset connection error
          data.lastConnectError = undefined;
          // Prevent any further connection release attempt
          data.nextDiscoOnScan = undefined;
        } else if (data.nextDiscoOnScan && status === "disconnected") {
          // Postpone next connection release attempt if disconnected on timeout
          if (reason === "timeout") {
            data.nextDiscoOnScan =
              Math.max(data.nextDiscoOnScan, Date.now()) + reconnectionDelay;
          }
        }
        // Cancel any pending connection attempt and scan request
        data.cancelNextConnect?.();
        data.cancelScan?.();
      }
    } else {
      logError(
        `PixelsCentral: Trying to update status of unregistered Pixel ${unsigned32ToHex(
          pixelId
        )}`
      );
    }
  }

  private _notifyNotInBootloader(
    pixelId: number,
    data: NonNullable<ReturnType<typeof this._pixels.get>>
  ): void {
    if (data.lastBootloaderScanTime) {
      data.lastBootloaderScanTime = undefined;
      const notifier = ScannedBootloaderNotifier.findInstance(pixelId);
      notifier &&
        this._emitEvent("onInBootloader", { status: "lost", notifier });
    }
  }

  _onConnectOperationFailed(pixel: Pixel, error: Error) {
    const data = this._pixels.get(pixel.pixelId);
    if (!data) {
      return;
    }

    // Check if we got 2 errors in a short time
    const now = Date.now();
    const last = data.lastConnectError;
    const tooManyErrors =
      last && now - last.time < reconnectionDelayTooManyErrors;
    tooManyErrors &&
      console.log(
        `[PixelsCentral] ⚠️ Too many connection errors for Pixel ${unsigned32ToHex(
          pixel.pixelId
        )}`
      );

    // Connection failed, try to connect again
    // TODO Temp fix: connecting immediately after a disconnect is causing issues
    // on Android: the device is never actually disconnected, but the MTU
    // is reset to 23 as far as the native code is concerned.
    data.cancelNextConnect?.();
    const id = setTimeout(
      () => this._scheduleConnectIfQueued(pixel.pixelId),
      tooManyErrors ? reconnectionDelayTooManyErrors : reconnectionDelay
    );
    data.cancelNextConnect = () => {
      clearTimeout(id);
      data.cancelNextConnect = undefined;
    };

    // Keep last connection error (if not already "consumed" by the too many errors check)
    data.lastConnectError = tooManyErrors ? undefined : { time: now, error };

    // Special case: double GATT failure
    // Assumes GATT failure is caused by the connection limit being reached
    if (tooManyErrors && isGattFailure(last.error) && isGattFailure(error)) {
      console.log(
        `[PixelsCentral] ⚠️ Double gatt failure for Pixel ${unsigned32ToHex(
          pixel.pixelId
        )} => ${JSON.stringify({
          now,
          lastConnectionLimitErrorRelative: now - last.time,
          // nextDiscoRelative: data.nextDisco && data.nextDisco - now,
          // canDisco: data.nextDisco && now > data.nextDisco,
        })}`
      );
      if (
        // Check that the last GATT failure was recent enough
        now - last.time < connectionRelease.connectGattFailureDelta &&
        // And that we are past the time to attempt to release a connection
        // data.nextDisco &&
        // now > data.nextDisco &&
        // Only for dice connecting as high priority
        this._connectQueue.isHighPriority(pixel.pixelId)
      ) {
        data.lastConnectError = undefined;
        // Set new connection release time
        // data.nextDiscoOnScan = now + connectionRelease.interval;
        // Try to disconnect another Pixel
        const disconnectedId = this._tryReleaseOneConnection(pixel.pixelId);
        // Notify
        if (disconnectedId) {
          this._scheduleConnectIfQueued(pixel.pixelId);
        }
      }
    }
  }

  private _scheduleConnectIfQueued(pixelId: number): void {
    // Cancel any pending connection attempt
    const data = this._pixels.get(pixelId);
    if (!data) {
      return;
    }
    data.cancelNextConnect?.();
    // Only reconnect if Bluetooth is ready
    // (otherwise, connection will be scheduled when ready)
    if (!this.isReady) {
      return;
    }
    // Check Pixel is registered and in the connection queue
    if (this._connectQueue.includes(pixelId)) {
      const scheduler = getScheduler(pixelId);
      // Schedule connection
      if (scheduler.pixel?.status === "disconnected") {
        scheduler.schedule({ type: "connect" });
      }
      // else: will try to connect when status becomes "disconnected"
    }
  }

  // Starts a scan if next connection release time is reached,
  // otherwise schedules a scan
  // Do nothing if we're past scanEndTime pr not a high priority connection
  private _scheduleScan(
    pixelId: number,
    data: NonNullable<ReturnType<typeof this._pixels.get>>
  ): void {
    const now = Date.now();
    // Cancel any previous scan request
    data.cancelScan?.();
    // Reset scan parameters
    data.lastScanTime = 0;
    if (!data.scanEndTime) {
      data.scanEndTime = now + connectionRelease.window;
      // Also reset next connection release time if we are past it
      if (data.nextDiscoOnScan && now > data.nextDiscoOnScan) {
        data.nextDiscoOnScan = undefined;
      }
    }

    // Set time to attempt a connection release if connecting
    const connecting = getPixel(pixelId)?.status === "connecting";
    if (!data.nextDiscoOnScan && connecting) {
      data.nextDiscoOnScan = now + connectionRelease.interval;
      this._connectQueue.isHighPriority(pixelId) &&
        console.warn(
          `Reset nextDisco for ${unsigned32ToHex(pixelId)} to ${data.nextDiscoOnScan}`
        );
    }
    // Check if we should schedule a scan
    this._connectQueue.isHighPriority(pixelId) &&
      console.warn(
        `SCHEDULE SCAN PARAMS for Pixel ${unsigned32ToHex(pixelId)} ${JSON.stringify(
          {
            connecting,
            now,
            scanEndTime: data.scanEndTime,
            scanEndTimeRelative: data.scanEndTime - now,
            nextDisco: data.nextDiscoOnScan,
            nextDiscoRelative: (data.nextDiscoOnScan ?? 0) - now,
            shouldAttemptDisco:
              data.nextDiscoOnScan && data.nextDiscoOnScan < data.scanEndTime,
          }
        )}`
      );
    if (
      // Don't scan if not trying to connect
      connecting &&
      // Check that we are not past the time to release a connection
      now < data.scanEndTime &&
      // Avoid scanning if the time of the next release connection attempt is beyond our scan window
      data.nextDiscoOnScan &&
      data.nextDiscoOnScan < data.scanEndTime &&
      // Only scan and release connections for high priority connection Pixels
      this._connectQueue.isHighPriority(pixelId)
    ) {
      // Schedule a scan to find out if Pixel is advertising during the connection attempt
      const startDelay = Math.max(0, data.nextDiscoOnScan - now);
      if (startDelay > 0) {
        console.warn(
          `>> SCAN in ${startDelay}ms for Pixel ${unsigned32ToHex(pixelId)}`
        );
        const id = setTimeout(
          () => this._scheduleScan(pixelId, data),
          startDelay
        );
        data.cancelScan = () => {
          console.warn(
            `>> CANCEL SCHEDULED SCAN TIMEOUT for Pixel ${unsigned32ToHex(pixelId)}`
          );
          clearTimeout(id);
          data.cancelScan = undefined;
        };
      } else {
        const stopDelay = data.scanEndTime - now;
        console.log(
          `>> SCAN for Pixel ${unsigned32ToHex(pixelId)} stopDelay=${stopDelay}`
        );
        // Start scan
        const stopScan = this.scanForPixels();
        // Stop scanning when past the scan window
        const id = setTimeout(() => stopScan(), stopDelay);
        data.cancelScan = () => {
          console.warn(`>> STOP SCAN for Pixel ${unsigned32ToHex(pixelId)}`);
          clearTimeout(id);
          stopScan();
          data.cancelScan = undefined;
        };
      }
    }
  }

  private _tryReleaseOneConnection(pixelId: number): number | undefined {
    // Remove all low priority connections that are not yet connected
    // so they don't take up our spot
    for (const id of this._connectQueue.lowPriorityIds) {
      if (!isConnected(getPixel(id)?.status)) {
        this._connectQueue.dequeue(id);
      }
    }
    // Get all queued connections, from low to high priority
    const ids = this._connectQueue.allIds;
    const index = ids.indexOf(pixelId);
    if (index < 0) {
      logError(
        `PixelsCentral: Connection release request for not connecting Pixel ${unsigned32ToHex(
          pixelId
        )}`
      );
      return;
    }
    // Find out if a lower priority connection can be released
    const idToDisco = ids.find(
      (id, i) => i < index && isConnected(getPixel(id)?.status)
    );
    if (idToDisco) {
      console.log(
        `[PixelsCentral] ⚠️ Disconnecting Pixel ${unsigned32ToHex(
          idToDisco
        )} on behalf of Pixel ${unsigned32ToHex(pixelId)}`
      );
      this._connectQueue.dequeue(idToDisco);
    }
    // Notify
    this._emitEvent("onConnectionLimitReached", {
      pixelId,
      disconnectId: idToDisco,
    });
    return idToDisco;
  }

  private _connect(
    pixelId: number,
    opt?: { keepConnectionReleaseTimings?: boolean }
  ): void {
    const data = this._pixels.get(pixelId);
    if (!data) {
      // Pixel is not registered, this shouldn't happen
      logError(
        `PixelsCentral: Connection request for unregistered Pixel ${unsigned32ToHex(
          pixelId
        )}`
      );
      return;
    }
    const pixel = getPixel(pixelId);
    if (pixel) {
      // We have a Pixel instance, try to connect
      this._scheduleConnectIfQueued(pixelId);

      if (!opt?.keepConnectionReleaseTimings) {
        // Allow again for scanning to release a connection
        // (or extend the current scan time window)
        data.scanEndTime = 0;
        this._scheduleScan(pixelId, data);
      }
    } else {
      // Need to first discover dice to access its Pixel instance,
      // it will connect upon discovery
      this.waitForScannedPixelAsync(pixelId).catch((e) => {
        logError(
          `PixelsCentral: Error waiting for Pixel ${unsigned32ToHex(
            pixelId
          )} to be scanned: ${e}`
        );
      });
    }
  }

  private _subscribeToConnectQueueEvents() {
    if (!this._connectQueue.size) {
      this._connectQueue.addListener("queued", (pixelId) => {
        this._connect(pixelId);
        this._emitEvent("connectQueue", this.connectQueue);
      });
      this._connectQueue.addListener("requeued", (pixelId) => {
        this._connect(pixelId);
        this._emitEvent("connectQueue", this.connectQueue);
      });
      this._connectQueue.addListener("dequeued", (pixelId) => {
        console.log(
          `[PixelsCentral] Pixel ${unsigned32ToHex(pixelId)} with status=${getPixel(pixelId)?.status} removed from connect queue`
        );
        // Cancel any pending connection attempt and scan request
        const data = this._pixels.get(pixelId);
        data?.cancelNextConnect?.();
        data?.cancelScan?.();
        // Disconnect
        if (
          !getScheduler(pixelId).cancelConnecting() &&
          // If doing a DFU, let it take care of disconnecting
          this._pixelInDFU !== pixelId
        ) {
          getScheduler(pixelId).schedule({ type: "disconnect" });
        }
        this._emitEvent("connectQueue", this.connectQueue);
        // Unsubscribe from priority queue events if queue is empty
        if (!this._connectQueue.size) {
          this._connectQueue.removeAllListeners();
        }
      });
    }
  }
}
