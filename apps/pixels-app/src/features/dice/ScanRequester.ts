import {
  createTypedEventEmitter,
  EventReceiver,
} from "@systemic-games/pixels-core-utils";
import {
  BluetoothNotAuthorizedError,
  BluetoothUnavailableError,
  Central,
  PixelScanner,
  PixelScannerEventMap,
  ScannedPixel,
  ScanStartFailed,
  ScanStatus,
} from "@systemic-games/react-native-pixels-connect";

class ManagedResource {
  private readonly _tokens = new Set<() => void>();
  private readonly _onTake: () => void;
  private readonly _onRelease: () => void;

  get isTaken(): boolean {
    return this._tokens.size > 0;
  }

  constructor(onTake: () => void, onRelease: () => void) {
    this._onTake = onTake;
    this._onRelease = onRelease;
  }

  // Signal that the resource is needed and return a function
  // to be called when the resource isn't required any longer.
  take(): () => void {
    // Signal that the resource is taken
    this._onTake();
    // Create token
    const releaseAsync = () => {
      // Remove token
      if (this._tokens.delete(releaseAsync)) {
        // Signal that the resource is released
        this._onRelease();
      }
    };
    // And store it
    this._tokens.add(releaseAsync);
    return releaseAsync;
  }
}

/**
 * Event map for {@link ScanRequester} class.
 * This is the list of supported events where the property name
 * is the event name and the property type the event data type.
 */
export type ManagedScannerEventMap = PixelScannerEventMap &
  Readonly<{
    isScanRequested: boolean;
    onScanError: Readonly<{ error: Error }>;
  }>;

export class ScanRequester {
  private readonly _evEmitter =
    createTypedEventEmitter<ManagedScannerEventMap>();

  private readonly _scanner = new PixelScanner();
  private readonly _scanMan;
  private readonly _onStatusCb: (
    ev: PixelScannerEventMap["onStatusChange"]
  ) => void;
  private _isScanRequested = false;

  get isScanRequested(): boolean {
    return this._isScanRequested;
  }

  get isReady(): boolean {
    return this._scanner.isReady;
  }

  get status(): ScanStatus {
    return this._scanner.status;
  }

  get scannedPixels(): ScannedPixel[] {
    return this._scanner.scannedPixels;
  }

  constructor(stopDelay = 0) {
    this._scanner.minNotifyInterval = 200;
    this._scanner.keepAliveDuration = 5000;
    // Start scan function
    const startScan = () => {
      this._scanner.startAsync().catch((e) => {
        console.error(`[ManagedScanner] Error starting scan: ${e}`);
        this._emitEvent("onScanError", { error: e });
      });
    };
    // Callback that resumes scanning when BLE is ready and the scanner is taken
    const onReady = (ready: boolean) => {
      if (ready && this._scanMan.isTaken) {
        startScan();
      } else if (!ready && !this._scanMan.isTaken && this._isScanRequested) {
        // Got this event during the delay before stopping
        this._scanner.removeListener("isReady", onReady);
        this._updateScanRequested(false);
      }
    };
    // Callback that listens for scan stop events
    this._onStatusCb = ({
      status,
      stopReason,
    }: PixelScannerEventMap["onStatusChange"]) => {
      if (status === "stopped" && stopReason && stopReason !== "success") {
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
    };
    // Create managed resource for the scanner
    this._scanMan = new ManagedResource(
      // Take
      () => {
        // Subscribe to BLE state changes once
        if (!this._isScanRequested) {
          this._scanner.addListener("isReady", onReady);
          this._updateScanRequested(true);
        }
        // And always try to start scanning
        startScan();
      },
      // Release
      () => {
        // Stop scanning if not needed anymore
        if (!this._scanMan.isTaken) {
          console.log(
            `[ManagedScanner] Scanner released, waiting ${stopDelay}ms before stopping`
          );
          // We wait a bit to avoid starting and stopping scanning too often
          // as Android won't accept more than 5 scans per minute
          const stop = () => {
            // Unsubscribe from BLE state changes
            if (!this._isScanRequested) {
              this._scanner.removeListener("isReady", onReady);
              this._updateScanRequested(false);
            }
            // Stop scanning
            this._scanner.stopAsync().catch((e) => {
              console.error(`[ManagedScanner] Error stopping scan: ${e}`);
            });
          };
          if (stopDelay) {
            // Stop after a delay if scanner not "retaken" in the meantime
            setTimeout(() => !this._scanMan.isTaken && stop(), stopDelay);
          } else {
            stop();
          }
        }
      }
    );
  }

  /**
   * Registers a listener function that will be called when the specified
   * event is raised.
   * See {@link ManagedScannerEventMap} for the list of events and their
   * associated data.
   * @param type A case-sensitive string representing the event type to listen for.
   * @param listener The callback function.
   */
  addListener<K extends keyof ManagedScannerEventMap>(
    type: K,
    listener: EventReceiver<ManagedScannerEventMap[K]>
  ): void {
    if (type === "isScanRequested") {
      this._evEmitter.addListener(type, listener);
    } else if (type === "onScanError") {
      if (this._evEmitter.listenerCount(type) === 0) {
        this._scanner.addListener("onStatusChange", this._onStatusCb);
      }
      this._evEmitter.addListener(type, listener);
    } else {
      this._scanner.addListener(
        type,
        // @ts-ignore
        listener
      );
    }
  }

  /**
   * Unregisters a listener from receiving events identified by
   * the given event name.
   * See {@link ManagedScannerEventMap} for the list of events and their
   * associated data.
   * @param type A case-sensitive string representing the event type.
   * @param listener The callback function to unregister.
   */
  removeListener<K extends keyof ManagedScannerEventMap>(
    type: K,
    listener: EventReceiver<ManagedScannerEventMap[K]>
  ): void {
    if (type === "isScanRequested") {
      this._evEmitter.removeListener(type, listener);
    } else if (type === "onScanError") {
      this._evEmitter.removeListener(type, listener);
      if (this._evEmitter.listenerCount(type) === 0) {
        this._scanner.removeListener("onStatusChange", this._onStatusCb);
      }
    } else {
      this._scanner.removeListener(
        type,
        // @ts-ignore
        listener
      );
    }
  }

  // Returns a function that stops scanning
  requestScan(): () => void {
    return this._scanMan.take();
  }

  private _emitEvent<T extends keyof ManagedScannerEventMap>(
    name: T,
    ev: ManagedScannerEventMap[T]
  ): void {
    try {
      this._evEmitter.emit(name, ev);
    } catch (e) {
      console.error(
        `[ManagedScanner] Uncaught error in "${name}" event listener: ${e}`
      );
    }
  }

  private _updateScanRequested(isReq: boolean) {
    if (this._isScanRequested !== isReq) {
      this._isScanRequested = isReq;
      this._emitEvent("isScanRequested", isReq);
    }
  }
}