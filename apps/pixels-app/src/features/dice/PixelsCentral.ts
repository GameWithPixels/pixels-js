import {
  assertNever,
  createTypedEventEmitter,
  delay,
  EventReceiver,
  unsigned32ToHex,
} from "@systemic-games/pixels-core-utils";
import {
  Color,
  ConnectError,
  Pixel,
  PixelConnectError,
  PixelMutableProps,
  PixelScannerEventMap,
  PixelStatus,
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

import { logError } from "~/features/utils";
import { DfuFilesInfo } from "~/hooks";

//
// Timing parameters
//

// Connection release parameters
const connectionRelease = {
  interval: 5000, // We hope it's enough to connect to a Pixel
  window: 20000, // 4 times the above interval, should allow for 3 connection releases
  maxScanDelta: 1500, // Release connection if scanned twice within this time
  minScanDuration: 500, // Avoid starting a scan if we'll be stopping it right away
  connectErrorDelta: 3000, // Maximum time between 2 connection errors to trigger a connection release
} as const;

// This delay is to avoid stopping/starting scanner too often
const stopScanDelay = connectionRelease.interval + 2000;

// Delay before trying to reconnect after a disconnect
const reconnectionDelay = 1000;

//
// Helper functions
//

function getScheduler(pixelId: number): PixelScheduler {
  return PixelScheduler.getScheduler(pixelId);
}

function getPixel(pixelId: number): Pixel | undefined {
  return PixelScheduler.getScheduler(pixelId).pixel;
}

function isConnected(status?: PixelStatus): status is "identifying" | "ready" {
  return status === "identifying" || status === "ready";
}

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
  onPixelFound: Readonly<{ pixel: Pixel }>; // Registered Pixel was found (scanned)
  onConnectionLimitReached: Readonly<{ pixel: Pixel; disconnectedId?: number }>; // Failed to connect Pixel because connection limit was reached
}>;

// Registered Pixels are added to the "pixels" list whenever they are found (= scanned)
export class PixelsCentral {
  private readonly _evEmitter =
    createTypedEventEmitter<PixelsCentralEventMap>();

  // Scanner for discovering Pixels
  private readonly _scanner = new ScanRequester(stopScanDelay);
  private readonly _onScanReady: () => void;

  // Registered Pixels
  private readonly _pixels = new Map<
    number,
    {
      lastScanTime?: number; // Timestamp of last scan
      nextDisco?: number; // Timestamp for next connection release attempt, undefined if not scheduled
      scanEndTime?: number; // Timestamp for end of scan window
      lastConnectionError?: number; // Timestamp of last connection error possibly due to connection limit
      cancelScan?: () => void;
      unhook?: () => void;
    }
  >();

  // Priority queue of Pixels to connect
  private readonly _connectQueue = new PriorityQueue();

  // DFU
  private _pixelInDfu: number | undefined;

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
    return this._pixelInDfu;
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
      data.cancelScan?.();
      data.unhook?.();
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
            const scanStatus = op.status;
            switch (scanStatus) {
              case "scanned": {
                // Always update notifier
                const notifier = ScannedPixelNotifier.getInstance(op.item);
                this._onScannedPixel(notifier);
                break;
              }
              case "lost": {
                const notifier = ScannedPixelNotifier.findInstance(
                  op.item.pixelId
                );
                notifier &&
                  this._emitEvent(
                    this._pixels.has(op.item.pixelId)
                      ? "onAvailability"
                      : "onPixelScanned",
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
    timeout = 7000
  ): Promise<boolean> {
    // Create a promise that resolves when the Pixel is scanned
    let resolver: (value: boolean) => void;
    const promise = new Promise<boolean>((resolve) => (resolver = resolve));

    // Listen for scan events
    const onScanListChange = (ev: PixelScannerEventMap["onScanListChange"]) => {
      for (const op of ev.ops) {
        if (
          op.status === "scanned" &&
          op.item.type === "pixel" &&
          op.item.pixelId === pixelId
        ) {
          resolver(true);
          break;
        }
      }
    };
    this._scanner.addListener("onScanListChange", onScanListChange);

    // Stop scanning on timeout
    const id = setTimeout(() => resolver(false), timeout);

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
  // but only if the new connection is of high priority
  tryConnect(
    pixelId: number,
    opt?: { priority?: "low" | "high" } // Default: keep or low
  ): void {
    if (
      this._pixels.has(pixelId) &&
      (!!opt?.priority || !this._connectQueue.includes(pixelId))
    ) {
      console.log(
        `>> TRY CONNECT Pixel ${unsigned32ToHex(pixelId)} with priority=${opt?.priority}`
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

  stopTryConnecting(priority: "low" | "high" = "low"): void {
    const ids =
      priority === "low"
        ? this._connectQueue.lowPriorityIds
        : this._connectQueue.highPriorityIds;
    for (const id of ids) {
      if (getScheduler(id).cancelConnecting()) {
        console.warn(`>> CANCEL connecting Pixel ${unsigned32ToHex(id)}`);
        this._connectQueue.dequeue(id);
      } else {
        const pixel = getPixel(id);
        if (
          !pixel ||
          pixel.status === "disconnecting" ||
          pixel.status === "disconnected"
        ) {
          console.warn(
            `>> REMOVING missing or disconnected Pixel ${unsigned32ToHex(id)} with status=${pixel?.status}`
          );
          this._connectQueue.dequeue(id);
        }
      }
    }
  }

  setBlinkColor(color: Readonly<Color>): void {
    PixelScheduler.blinkColor = color;
  }

  getCurrentOperation(pixelId: number): PixelOperationParams | undefined {
    return getScheduler(pixelId).currentOperation;
  }

  addSchedulerListener<K extends keyof PixelSchedulerEventMap>(
    pixelId: number,
    type: K,
    listener: EventReceiver<PixelSchedulerEventMap[K]>
  ): () => void {
    const scheduler = getScheduler(pixelId);
    scheduler.addListener(type, listener);
    return () => scheduler.removeListener(type, listener);
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
    let success = false;
    if (this._pixels.has(pixelId)) {
      if (this._pixelInDfu) {
        throw new Error("A firmware update is already in progress");
      }
      this._pixelInDfu = pixelId;
      this._emitEvent("pixelInDFU", this._pixelInDfu);

      try {
        // Try connect to die (scan immediately if not connected)
        let scanned: boolean | undefined;
        const onScanned = ({
          status,
          notifier,
        }: PixelsCentralEventMap["onPixelScanned"]) => {
          if (status === "scanned" && notifier.pixelId === pixelId) {
            console.log("###### SCANNED " + unsigned32ToHex(pixelId));
            scanned = true;
          }
        };
        this.addListener("onPixelScanned", onScanned);
        const stopScan = this.scanForPixels();
        this.stopTryConnecting();
        this.tryConnect(pixelId, { priority: "high" });
        // await new Promise<void>((resolve) => {
        //   const onStatus = ({ status }: { status: PixelStatus }) => {
        //     if (this.getPixel(pixelId)?.status === "ready") {
        //       pixel.removePropertyListener("status", onStatus);
        //       resolve();
        //     }
        //   };
        //   pixel.addPropertyListener("status", onStatus);
        // });
        try {
          for (let i = 0; i < (scanned ? 30 : 10); ++i) {
            console.log(
              "###### CHECK STATUS " +
                unsigned32ToHex(pixelId) +
                " => " +
                this.getPixel(pixelId)?.status
            );
            if (this.getPixel(pixelId)?.status === "ready") {
              break;
            }
            await delay(1000);
          }
        } finally {
          this.removeListener("onPixelScanned", onScanned);
          stopScan();
        }
        // Get Pixel instance (and check it's still registered)
        const pixel = this.getPixel(pixelId);
        if (
          pixel?.status === "ready" &&
          (!!opt.force ||
            getDieDfuAvailability(
              pixel.firmwareDate.getTime(),
              filesInfo.timestamp
            ) === "outdated")
        ) {
          console.warn("UPDATE PIXEL " + unsigned32ToHex(pixelId));
          success = await new Promise<boolean>((resolve, reject) => {
            // const scheduler = getScheduler(pixelId);
            // scheduler.addListener(type, listener);
            const disposer = this.addSchedulerListener(
              pixelId,
              "onOperationStatus",
              ({ operation, status }) => {
                if (operation.type === "updateFirmware") {
                  if (status === "starting" || status === "dropped") {
                    // Don't attempt to reconnect once DFU is starting
                    this._connectQueue.dequeue(pixelId);
                  }
                  if (
                    status === "succeeded" ||
                    status === "dropped" ||
                    status === "failed"
                  ) {
                    console.warn(
                      "Done with DFU with status=" + status + " for " + pixelId
                    );
                    disposer();
                    if (status === "failed") {
                      reject(new Error("DFU " + status));
                    } else {
                      resolve(status === "succeeded");
                    }
                  }
                }
              }
            );
            getScheduler(pixelId).schedule({
              type: "updateFirmware",
              bootloaderPath: opt?.bootloader
                ? filesInfo.bootloaderPath
                : undefined,
              firmwarePath: filesInfo.firmwarePath,
            });
          });
        } else {
          // Don't reconnect
          getScheduler(pixelId).cancelConnecting();
          this._connectQueue.dequeue(pixelId);
          if (pixel) {
            console.warn(
              "Skipping update for Pixel " + unsigned32ToHex(pixelId)
            );
          } else {
            console.warn("No PIXEL for " + unsigned32ToHex(pixelId));
          }
        }
      } finally {
        this._pixelInDfu = undefined;
        this._emitEvent("pixelInDFU", undefined);
      }
    }
    return success;
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
          scanTime < data.scanEndTime &&
          // Check if scanned twice recently
          data.lastScanTime &&
          scanTime - data.lastScanTime < connectionRelease.maxScanDelta &&
          // And that we are past the time to attempt to release a connection
          data.nextDisco &&
          data.lastScanTime > data.nextDisco && // Use last scan time to be sure we're not using a scan that occurred while disconnected
          // Make you sure we're still trying to connect
          this._connectQueue.includes(pixelId)
        ) {
          // We might end up here while being disconnected but still in the connect queue
          // (meaning a reconnection is or will be scheduled)
          const pixel = getPixel(pixelId);
          if (pixel?.status === "connecting") {
            // We've probably reach the maximum number of connections, attempt to disconnect one die
            const disconnectedId = this._tryDisconnectOne(pixelId);
            // Set new connection release time
            data.nextDisco = Date.now() + connectionRelease.interval;
            // Notify
            this._emitEvent("onConnectionLimitReached", {
              pixel,
              disconnectedId,
            });
          } else {
            data.nextDisco += reconnectionDelay;
            console.log(
              `>> SCANNED Pixel ${unsigned32ToHex(pixelId)} with status=${getPixel(pixelId)?.status}`
            );
          }
          // Schedule new scan
          this._scheduleScan(pixelId);
        } else {
          data.lastScanTime = scanTime;
          // console.log(
          //   `>> SCANNED Pixel ${unsigned32ToHex(pixelId)} ${notifier.name} delay=${Date.now() - notifier.timestamp.getTime()}`
          // );
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
    if (data && !data.unhook) {
      const pixel = getPixel(pixelId);
      if (pixel) {
        // Watch for Pixel connection status changes
        const onStatus = ({ status }: PixelMutableProps) =>
          this._onConnectionStatus(pixelId, status);
        pixel.addPropertyListener("status", onStatus);
        // Listen for scheduler events
        const scheduler = getScheduler(pixelId);
        const onOperationStatus = (
          ev: PixelSchedulerEventMap["onOperationStatus"]
        ) => this._onOperationStatus(pixel, ev);
        scheduler.addListener("onOperationStatus", onOperationStatus);
        // Store unhook function
        data.unhook = () => {
          pixel.removePropertyListener("status", onStatus);
          scheduler.removeListener("onOperationStatus", onOperationStatus);
        };
        // Notify Pixels list changed
        this._emitEvent("pixels", this.pixels);
        // Notify Pixel found
        console.log(`>> FOUND Pixel ${unsigned32ToHex(pixelId)}`);
        this._emitEvent("onPixelFound", { pixel });
        return true;
      }
    }
  }

  private _onConnectionStatus(pixelId: number, status: PixelStatus) {
    const data = this._pixels.get(pixelId);
    if (data) {
      // Keep timestamp of first connection attempt
      if (status === "connecting") {
        // Schedule scan
        this._scheduleScan(pixelId);
      } else {
        if (isConnected(status)) {
          // Prevent any further connection release attempt
          data.nextDisco = undefined;
        } else if (data.nextDisco && status === "disconnected") {
          // Postpone next connection release attempt if disconnected on timeout
          if (getPixel(pixelId)?.lastDisconnectReason === "timeout") {
            data.nextDisco =
              Math.max(data.nextDisco, Date.now()) + reconnectionDelay;
          }
        }
        // Cancel any scan request as we are no longer connecting
        data.cancelScan?.();
      }

      // Try to connect again if disconnected
      // TODO Temp fix: connecting immediately after a disconnect is causing issues
      // on Android: the device is never actually disconnected, but the MTU
      // is reset to 23 as far as the native code is concerned.
      if (status === "disconnected") {
        console.log(
          ">> DISCONNECTED Pixel " +
            unsigned32ToHex(pixelId) +
            " with reason " +
            getPixel(pixelId)?.lastDisconnectReason
        );
        setTimeout(
          () => this._scheduleConnectIfQueued(pixelId),
          reconnectionDelay
        );
      }
    } else {
      logError(
        `PixelsCentral: Trying to update status of unregistered Pixel ${unsigned32ToHex(
          pixelId
        )}`
      );
    }
  }

  _onOperationStatus(
    pixel: Pixel,
    ev: PixelSchedulerEventMap["onOperationStatus"]
  ) {
    if (ev.operation.type !== "connect") {
      return;
    }
    if (ev.status === "succeeded") {
      const data = this._pixels.get(ev.pixel.pixelId);
      if (data) {
        data.lastConnectionError = undefined;
      }
    } else if (
      ev.status === "failed" &&
      ev.error instanceof PixelConnectError &&
      ev.error.cause instanceof ConnectError &&
      ev.error.cause.nativeCode === "ERROR_GATT_ERROR"
    ) {
      const data = this._pixels.get(ev.pixel.pixelId);
      if (!data) {
        return;
      }
      const pixelId = ev.pixel.pixelId;
      // Assume the error is due to the connection limit being reached
      const now = Date.now();
      console.log(
        ">> CONNECT FAILED for Pixel " +
          unsigned32ToHex(pixelId) +
          " => " +
          JSON.stringify({
            now,
            lastConnectionErrorRelative:
              data.lastConnectionError && now - data.lastConnectionError,
            nextDiscoRelative: data.nextDisco && data.nextDisco - now,
            canDisco: data.nextDisco && now > data.nextDisco,
          })
      );
      if (
        data.lastConnectionError &&
        now - data.lastConnectionError < connectionRelease.connectErrorDelta &&
        // And that we are past the time to attempt to release a connection
        data.nextDisco &&
        now > data.nextDisco && // Use last scan time to be sure we're not using a scan that occurred while disconnected
        // Make you sure we're still trying to connect
        this._connectQueue.includes(pixelId)
      ) {
        data.lastConnectionError = undefined;
        // Try to disconnect another Pixel
        const disconnectedId = this._tryDisconnectOne(pixelId);
        // Set new connection release time
        data.nextDisco = now + connectionRelease.interval;
        // Notify
        this._emitEvent("onConnectionLimitReached", {
          pixel,
          disconnectedId,
        });
      } else {
        data.lastConnectionError = now;
      }
    }
  }

  private _scheduleConnectIfQueued(pixelId: number): void {
    // Only reconnect if Bluetooth is ready
    // (otherwise, connection will be scheduled when ready)
    if (!this.isReady) {
      return;
    }
    // Check Pixel is registered and in the connection queue
    if (this._pixels.has(pixelId) && this._connectQueue.includes(pixelId)) {
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
  // Do nothing if we're past scanEndTime
  private _scheduleScan(pixelId: number): void {
    const data = this._pixels.get(pixelId);
    if (!data) {
      return;
    }
    const now = Date.now();
    // Cancel any previous scan request
    data.cancelScan?.();
    // Reset scan parameters
    data.lastScanTime = 0;
    if (!data.scanEndTime) {
      data.scanEndTime = now + connectionRelease.window;
      // Also reset next connection release time if we are past it
      if (data.nextDisco && now > data.nextDisco) {
        data.nextDisco = undefined;
      }
    }
    // Set time to attempt a connection release if connecting
    const connecting = getPixel(pixelId)?.status === "connecting";
    if (!data.nextDisco && connecting) {
      data.nextDisco = now + connectionRelease.interval;
      this._connectQueue.isHighPriority(pixelId) &&
        console.warn(
          `Reset nextDisco for ${unsigned32ToHex(pixelId)} to ${data.nextDisco}`
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
            nextDisco: data.nextDisco,
            nextDiscoRelative: (data.nextDisco ?? 0) - now,
            beforeEnd:
              data.scanEndTime - now > connectionRelease.minScanDuration,
            shouldAttemptDisco:
              data.nextDisco && data.nextDisco < data.scanEndTime,
          }
        )}`
      );
    if (
      // Don't scan if not trying to connect
      connecting &&
      // Check if we are past the time to release a connection
      data.scanEndTime - now > connectionRelease.minScanDuration &&
      // Avoid scanning if the time of the next release connection attempt is beyond our scan window
      data.nextDisco &&
      data.nextDisco < data.scanEndTime &&
      // Only scan and release connections for high priority connection Pixels
      this._connectQueue.isHighPriority(pixelId)
    ) {
      // Schedule a scan to find out if Pixel is advertising during the connection attempt
      const startDelay = Math.max(0, data.nextDisco - now);
      if (startDelay > 0) {
        console.warn(
          `>> SCAN in ${startDelay}ms for Pixel ${unsigned32ToHex(pixelId)}`
        );
        const id = setTimeout(() => this._scheduleScan(pixelId), startDelay);
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

  private _tryDisconnectOne(pixelId: number): number | undefined {
    // Only scan and allow disconnections for high priority connection Pixels
    if (!this._connectQueue.isHighPriority(pixelId)) {
      return;
    }
    // Get all queued connections, from low to high priority
    const ids = this._connectQueue.allIds;
    const index = ids.indexOf(pixelId);
    if (index < 0) {
      return;
    }
    // Remove all low priority connections that are not yet connected
    // so they don't take up our spot
    this.stopTryConnecting();
    // Find out if a lower priority connection can be released
    const idToDisco = ids.find(
      (id, i) => i < index && isConnected(getPixel(id)?.status)
    );
    if (idToDisco) {
      console.warn(
        `>> RELEASING connected Pixel ${unsigned32ToHex(idToDisco)} for Pixel ${unsigned32ToHex(pixelId)}`
      );
      this._connectQueue.dequeue(idToDisco);
      return idToDisco;
    } else {
      console.log(
        `>> NO CONN TO RELEASE for Pixel ${unsigned32ToHex(pixelId)}`
      );
    }
  }

  private _connect(
    pixelId: number,
    opt?: { keepConnectionReleaseTimings?: boolean }
  ): void {
    const data = this._pixels.get(pixelId);
    if (!data) {
      // Pixel is not registered, this shouldn't happen
      logError(
        `PixelsCentral: Connection queued for unregistered Pixel ${unsigned32ToHex(
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
        this._scheduleScan(pixelId);
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
        // Cancel scan request if any
        this._pixels.get(pixelId)?.cancelScan?.();
        // Disconnect
        getScheduler(pixelId).schedule({ type: "disconnect" });
        this._emitEvent("connectQueue", this.connectQueue);
        // Unsubscribe from priority queue events if queue is empty
        if (!this._connectQueue.size) {
          this._connectQueue.removeAllListeners();
        }
      });
    }
  }
}
