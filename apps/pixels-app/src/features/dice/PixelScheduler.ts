import {
  assertNever,
  createTypedEventEmitter,
  EventReceiver,
  unsigned32ToHex,
} from "@systemic-games/pixels-core-utils";
import {
  Color,
  DataSet,
  getPixelsDevice,
  Pixel,
  PixelConnect,
} from "@systemic-games/react-native-pixels-connect";

import { updateFirmware } from "~/features/dfu";
import { logError } from "~/features/utils";
import { hackGetDieBrightness, isSameBrightness } from "~/hackGetDieBrightness";

type UpdateFirmwareParams = Parameters<typeof updateFirmware>[0];

export type PixelOperationParams = Readonly<
  | {
      type: "updateFirmware";
      firmwarePath: string;
      bootloaderPath?: string;
      dfuStateCallback?: UpdateFirmwareParams["dfuStateCallback"];
      dfuProgressCallback?: UpdateFirmwareParams["dfuProgressCallback"];
    }
  | {
      type: "connect";
    }
  | {
      type: "disconnect";
    }
  | {
      type: "turnOff";
    }
  | {
      type: "resetSettings";
    }
  | {
      type: "rename";
      name: string;
    }
  | {
      type: "blink";
    }
  | {
      type: "programProfile";
      dataSet: Readonly<DataSet>;
    }
>;

export type PixelSchedulerEventMap = Readonly<{
  // Properties
  currentOperation: Readonly<PixelOperationParams> | undefined;
  // Events
  onOperationStatus: Readonly<{ operation: PixelOperationParams }> &
    Readonly<
      | { status: "queued" | "dropped" }
      | {
          status: "starting" | "succeeded";
          pixel: PixelConnect;
        }
      | {
          status: "failed";
          pixel: PixelConnect;
          error: Error;
        }
    >;
}>;

type OperationsParams = Readonly<{
  connect: Omit<Extract<PixelOperationParams, { type: "connect" }>, "type">;
  disconnect: Omit<
    Extract<PixelOperationParams, { type: "disconnect" }>,
    "type"
  >;
  turnOff: Omit<Extract<PixelOperationParams, { type: "turnOff" }>, "type">;
  updateFirmware: Omit<
    Extract<PixelOperationParams, { type: "updateFirmware" }>,
    "type"
  >;
  resetSettings: Omit<
    Extract<PixelOperationParams, { type: "resetSettings" }>,
    "type"
  >;
  rename: Omit<Extract<PixelOperationParams, { type: "rename" }>, "type">;
  blink: Omit<Extract<PixelOperationParams, { type: "blink" }>, "type">;
  programProfile: Omit<
    Extract<PixelOperationParams, { type: "programProfile" }>,
    "type"
  >;
}>;

class OperationsMap {
  private readonly _operations = new Map<
    PixelOperationParams["type"],
    unknown // PixelOperationParams[keyof PixelOperationParams]
  >();

  get<K extends keyof OperationsParams>(
    type: K
  ): OperationsParams[K] | undefined {
    return this._operations.get(type) as OperationsParams[K] | undefined;
  }

  set<K extends keyof OperationsParams>(
    type: K,
    op: OperationsParams[K]
  ): void {
    this._operations.set(type, op);
  }

  delete(type: PixelOperationParams["type"]): void {
    this._operations.delete(type);
  }

  clear(): void {
    this._operations.clear();
  }

  has(type: PixelOperationParams["type"]): boolean {
    return this._operations.has(type);
  }

  get hasAny(): boolean {
    return !Object.values(this._operations).every((r) => !r);
  }
}

// A queue of operations to be processed by a Pixel.
// Note: most operations will fail if the Pixel is not connected.
// TODO introduce a timeout for each operation, interrupt current profile transfer if a new one is scheduled
export class PixelScheduler {
  private readonly _evEmitter =
    createTypedEventEmitter<PixelSchedulerEventMap>();
  private _pixel?: PixelConnect;
  private _currentOperation?: PixelOperationParams;
  private readonly _operations = new OperationsMap();
  private _triggerProcessPromise?: () => void;

  // Static properties to configure operations
  static blinkColor = Color.white;

  // All schedulers created so far (never removed!)
  private static readonly _allSchedulers = new Map<number, PixelScheduler>();

  static getScheduler(pixelId: number): PixelScheduler {
    const existing = this._allSchedulers.get(pixelId);
    const scheduler = existing ?? new PixelScheduler();
    if (!existing) {
      this._allSchedulers.set(pixelId, scheduler);
    }
    if (!scheduler._pixel) {
      scheduler._pixel = getPixelsDevice(pixelId);
      scheduler._pixel && scheduler._triggerProcessPromise?.();
    }
    return scheduler;
  }

  get currentOperation(): PixelOperationParams | undefined {
    return this._currentOperation;
  }

  get hasPendingOperation(): boolean {
    return this._operations.hasAny;
  }

  get pixel(): PixelConnect | undefined {
    return this._pixel;
  }

  constructor() {
    const task = async () => {
      while (true) {
        const operation = this._getNextOperation();
        if (this._currentOperation !== operation) {
          this._currentOperation = operation;
          this._emitEvent("currentOperation", this._currentOperation);
        }
        if (!operation) {
          // Wait for new operation
          if (this._triggerProcessPromise) {
            logError(
              "PixelScheduler: Unexpected _triggerProcessPromise in idle state"
            );
          }
          this._pixel && this._log("Waiting for new operation");
          await new Promise<void>((resolve) => {
            this._triggerProcessPromise = () => {
              this._triggerProcessPromise = undefined;
              resolve();
            };
          });
        } else {
          // Process next operation
          const pixel = this._pixel;
          const type = operation.type;
          if (pixel) {
            // Emit processing event
            this._log(`Processing operation ${type}`);
            this._emitEvent("onOperationStatus", {
              operation,
              status: "starting",
              pixel,
            });
            // Process operation
            let error: Error | undefined;
            try {
              if (pixel instanceof Pixel) {
                await this._processOpForDieAsync(pixel, operation);
              }
            } catch (e) {
              error = e instanceof Error ? e : new Error(String(e));
            }
            // Emit result event
            this._log(
              `Operation ${type} ${error ? "failed" : "succeeded"}${error ? `: ${error}` : ""}`
            );
            this._emitEvent(
              "onOperationStatus",
              error
                ? { operation, status: "failed", pixel, error }
                : { operation, status: "succeeded", pixel }
            );
          } else {
            // Emit result event
            this._log(`Operation ${type} dropped`);
            this._emitEvent("onOperationStatus", {
              operation,
              status: "dropped",
            });
          }
        }
      }
    };
    task().catch((e) =>
      logError(`PixelScheduler: Uncaught error processing operations: ${e}`)
    );
  }

  /**
   * Registers a listener function that will be called when the specified
   * event is raised.
   * See {@link PixelSchedulerEventMap} for the list of events and their
   * associated data.
   * @param type A case-sensitive string representing the event type to listen for.
   * @param listener The callback function.
   */
  addListener<K extends keyof PixelSchedulerEventMap>(
    type: K,
    listener: EventReceiver<PixelSchedulerEventMap[K]>
  ): void {
    this._evEmitter.addListener(type, listener);
  }

  /**
   * Unregisters a listener from receiving events identified by
   * the given event name.
   * See {@link PixelSchedulerEventMap} for the list of events and their
   * associated data.
   * @param type A case-sensitive string representing the event type.
   * @param listener The callback function to unregister.
   */
  removeListener<K extends keyof PixelSchedulerEventMap>(
    type: K,
    listener: EventReceiver<PixelSchedulerEventMap[K]>
  ): void {
    this._evEmitter.removeListener(type, listener);
  }

  schedule(operation: PixelOperationParams): void {
    const { type } = operation;
    this._log(`Scheduling operation ${type}`);
    switch (type) {
      case "connect":
        // Clear any pending disconnect operation
        this._operations.delete("disconnect");
        // Schedule connect operation
        this._operations.set(type, {});
        break;
      case "updateFirmware":
        this._operations.set(type, {
          firmwarePath: operation.firmwarePath,
          bootloaderPath: operation.bootloaderPath,
          dfuStateCallback: operation.dfuStateCallback,
          dfuProgressCallback: operation.dfuProgressCallback,
        });
        break;
      case "disconnect":
      case "turnOff":
      case "resetSettings":
      case "blink":
        this._operations.set(type, {});
        break;
      case "rename":
        this._operations.set(type, { name: operation.name });
        break;
      case "programProfile":
        this._operations.set(type, {
          dataSet: operation.dataSet,
        });
        break;
      default:
        assertNever(type);
    }
    this._emitEvent("onOperationStatus", {
      operation,
      status: "queued",
    });
    this._triggerProcessPromise?.();
  }

  // Schedules an operation and waits for it to complete.
  // Returns true if the operation was successful, false if it was dropped
  // and throws an error if it failed.
  scheduleAndWaitAsync(
    operation: PixelOperationParams,
    statusListener?: (
      status: PixelSchedulerEventMap["onOperationStatus"]["status"],
      error?: Error
    ) => void
  ): Promise<boolean> {
    const opType = operation.type;
    return new Promise<boolean>((resolve, reject) => {
      const onOperation = (ev: PixelSchedulerEventMap["onOperationStatus"]) => {
        if (ev.operation.type === opType) {
          const status = ev.status;
          const error = status === "failed" ? ev.error : undefined;
          try {
            statusListener?.(status, error);
          } finally {
            if (
              status === "succeeded" ||
              status === "dropped" ||
              status === "failed"
            ) {
              this.removeListener("onOperationStatus", onOperation);
              if (error) {
                reject(error);
              } else {
                resolve(status === "succeeded");
              }
            }
          }
        }
      };
      this.addListener("onOperationStatus", onOperation);
      this.schedule(operation);
    });
  }

  unschedule(operationType: PixelOperationParams["type"]): void {
    if (this._operations.get(operationType)) {
      this._log(`Un-scheduling pending operation ${operationType}`);
      this._operations.delete(operationType);
    }
  }

  isScheduled(operationType: PixelOperationParams["type"]): boolean {
    return !!this._operations.get(operationType);
  }

  // If Pixel is processing a connect operation, or has a pending connect,
  // and hasn't connected yet then cancel the operation immediately
  cancelConnecting(): boolean {
    const status = this._pixel?.status;
    if (status && status !== "identifying" && status !== "ready") {
      if (
        this.currentOperation?.type === "connect" ||
        this._operations.has("connect")
      ) {
        this._operations.delete("connect");
        this._pixel
          ?.disconnect()
          .catch((e) =>
            console.log(
              `PixelScheduler: Error cancelling connect operation: ${e}`
            )
          );
        return true;
      }
    }
    return false;
  }

  private _emitEvent<T extends keyof PixelSchedulerEventMap>(
    name: T,
    ev: PixelSchedulerEventMap[T]
  ): void {
    try {
      this._evEmitter.emit(name, ev);
    } catch (e) {
      logError(
        `PixelScheduler: Uncaught error in "${name}" event listener: ${e}`
      );
    }
  }

  private _log(message: string): void {
    const name = this._pixel?.name ?? "NOT ATTACHED";
    const id = this._pixel && unsigned32ToHex(this._pixel.pixelId);
    name && console.log(`[PixelScheduler ${name} (${id})] ${message}`);
  }

  private _getNextOperation(): PixelOperationParams | undefined {
    // Operations sorted by priority
    if (this._operations.has("connect")) {
      // Connect before doing anything else
      this._operations.delete("connect");
      return { type: "connect" };
    } else if (this._operations.has("updateFirmware")) {
      // Update firmware before running other operations
      const {
        firmwarePath,
        bootloaderPath,
        dfuStateCallback,
        dfuProgressCallback,
      } = this._operations.get("updateFirmware")!;
      this._operations.delete("updateFirmware");
      return {
        type: "updateFirmware",
        firmwarePath,
        bootloaderPath,
        dfuStateCallback,
        dfuProgressCallback,
      };
    } else if (this._operations.has("resetSettings")) {
      // Reset settings before running other operations
      this._operations.delete("resetSettings");
      return { type: "resetSettings" };
    } else if (this._operations.has("rename")) {
      const { name } = this._operations.get("rename")!;
      this._operations.delete("rename");
      return { type: "rename", name };
    } else if (this._operations.get("blink")) {
      this._operations.delete("blink");
      return { type: "blink" };
    } else if (this._operations.has("programProfile")) {
      const { dataSet } = this._operations.get("programProfile")!;
      this._operations.delete("programProfile");
      return {
        type: "programProfile",
        dataSet,
      };
    } else if (this._operations.has("turnOff")) {
      // Turnoff once all other operations are done (except disconnect)
      this._operations.delete("turnOff");
      return { type: "turnOff" };
    } else if (this._operations.has("disconnect")) {
      // Disconnect once all other operations are done
      this._operations.delete("disconnect");
      return { type: "disconnect" };
    } else {
      return undefined;
    }
  }

  private async _processOpForDieAsync(
    pixel: Pixel,
    op: PixelOperationParams
  ): Promise<void> {
    // TODO add timeout
    const { type } = op;
    switch (type) {
      case "connect":
        await pixel.connect();
        break;
      case "turnOff":
        await pixel.turnOff();
        break;
      case "disconnect":
        await pixel.disconnect();
        break;
      case "updateFirmware": {
        await updateFirmware({
          systemId: pixel.systemId,
          pixelId: pixel.pixelId,
          bootloaderPath: op.bootloaderPath,
          firmwarePath: op.firmwarePath,
          dfuStateCallback: op.dfuStateCallback,
          dfuProgressCallback: op.dfuProgressCallback,
        });
        break;
      }
      case "resetSettings":
        await pixel.sendAndWaitForResponse("clearSettings", "clearSettingsAck");
        break;
      case "rename":
        await pixel.rename(op.name);
        break;
      case "blink":
        await pixel.blink(PixelScheduler.blinkColor, {
          duration: 1000,
          count: 2,
          fade: 0.5,
        });
        break;
      case "programProfile":
        {
          const hash = DataSet.computeHash(op.dataSet.toByteArray());
          const brightness = op.dataSet.brightness / 255;
          if (
            hash !== pixel.profileHash ||
            !isSameBrightness(brightness, hackGetDieBrightness(pixel))
          ) {
            this._log(
              `Programming profile with hash ${unsigned32ToHex(hash)} and brightness ${brightness}`
            );
            await pixel.transferDataSet(op.dataSet);
          } else {
            this._log(
              `Profile with hash ${unsigned32ToHex(hash)} and brightness ${brightness} already programmed`
            );
          }
        }
        break;
      default:
        assertNever(type);
    }
  }
}
