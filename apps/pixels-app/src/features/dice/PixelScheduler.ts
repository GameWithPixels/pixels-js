import {
  assertNever,
  createTypedEventEmitter,
  EventReceiver,
  unsigned32ToHex,
} from "@systemic-games/pixels-core-utils";
import {
  Color,
  DataSet,
  Pixel,
} from "@systemic-games/react-native-pixels-connect";

import { logError } from "~/features/utils";

export type PixelOperationParams = Readonly<
  | {
      type: "connect";
      mode?: "default" | "reconnect";
    }
  | {
      type: "disconnect";
      mode?: "default" | "turnOff";
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

export interface PixelSchedulerEventMap {
  // Properties
  currentOperationChanged: Readonly<PixelOperationParams> | undefined;
  // Events
  onOperation: {
    operation: PixelOperationParams;
    event: Readonly<
      | { type: "queued" }
      | {
          type: "processing" | "succeeded";
          pixel: Pixel;
        }
      | {
          type: "failed";
          pixel: Pixel;
          error: Error;
        }
    >;
  };
}

type ConnectParams = Omit<
  Extract<PixelOperationParams, { type: "connect" }>,
  "type"
>;
type DisconnectParams = Omit<
  Extract<PixelOperationParams, { type: "disconnect" }>,
  "type"
>;
type ResetParams = Omit<
  Extract<PixelOperationParams, { type: "resetSettings" }>,
  "type"
>;
type RenameParams = Omit<
  Extract<PixelOperationParams, { type: "rename" }>,
  "type"
>;
type BlinkParams = Omit<
  Extract<PixelOperationParams, { type: "blink" }>,
  "type"
>;
type ProfileParams = Omit<
  Extract<PixelOperationParams, { type: "programProfile" }>,
  "type"
>;

// A queue of operations to be processed by a Pixel.
// Currently a scheduler is associated with a single Pixel
// but it could be extended to switch Pixels.
// TODO introduce a timeout for each operation, interrupt current profile transfer if a new one is scheduled
export class PixelScheduler {
  private readonly _evEmitter =
    createTypedEventEmitter<PixelSchedulerEventMap>();
  private _pixel?: Pixel;
  private _currentOperation?: PixelOperationParams;
  private readonly _operations: {
    connect?: ConnectParams;
    disconnect?: DisconnectParams;
    reset?: ResetParams;
    rename?: RenameParams;
    blink?: BlinkParams;
    profile?: ProfileParams;
  } = {};
  private _triggerProcessPromise?: () => void;

  // Static properties to configure operations
  static blinkColor = Color.white;

  get currentOperation(): PixelOperationParams | undefined {
    return this._currentOperation;
  }

  get hasPendingOperation(): boolean {
    return !Object.values(this._operations).every((r) => !r);
  }

  constructor() {
    const task = async () => {
      while (true) {
        if (!this._pixel || !this.hasPendingOperation) {
          // Wait for new operation
          if (this._triggerProcessPromise) {
            logError(
              "PixelScheduler: Unexpected _processPromise in idle state"
            );
          }
          this._log("Waiting for new operation");
          await new Promise<void>((resolve) => {
            this._triggerProcessPromise = () => {
              this._triggerProcessPromise = undefined;
              resolve();
            };
          });
        } else {
          // Process next operation
          const operation = this._getNextOperation();
          if (operation) {
            const pixel = this._pixel;
            const type = operation.type;
            // Emit processing event
            this._log(`Processing operation '${type}'`);
            this._currentOperation = operation;
            this._emitEvent("onOperation", {
              operation,
              event: { type: "processing", pixel },
            });
            this._emitEvent("currentOperationChanged", this._currentOperation);
            // Process operation
            let error: Error | undefined;
            try {
              await this._processOperationAsync(pixel, operation);
            } catch (e) {
              error = e instanceof Error ? e : new Error(String(e));
            }
            // Emit result event
            this._log(
              `Operation '${type}' ${error ? "failed" : "succeeded"}${error ? `: ${error}` : ""}`
            );
            this._emitEvent("onOperation", {
              operation,
              event: error
                ? { type: "failed", pixel, error }
                : { type: "succeeded", pixel },
            });
            this._currentOperation = undefined;
            this._emitEvent("currentOperationChanged", this._currentOperation);
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
   * See {@link PixelsCentralEventMap} for the list of events and their
   * associated data.
   * @param type A case-sensitive string representing the event type to listen for.
   * @param listener The callback function.
   */
  addEventListener<K extends keyof PixelSchedulerEventMap>(
    type: K,
    listener: EventReceiver<PixelSchedulerEventMap[K]>
  ): void {
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
  removeEventListener<K extends keyof PixelSchedulerEventMap>(
    type: K,
    listener: EventReceiver<PixelSchedulerEventMap[K]>
  ): void {
    this._evEmitter.removeListener(type, listener);
  }

  attach(pixel: Pixel): void {
    if (this._pixel && this._pixel !== pixel) {
      // TODO Implement detach()
      throw new Error("Pixel already attached to another PixelScheduler");
    } else if (!this._pixel) {
      this._pixel = pixel;
      this._triggerProcessPromise?.();
    }
  }

  suspend(): void {
    // TODO
  }

  updateFirmware(): void {
    // TODO
  }

  schedule(operation: PixelOperationParams): void {
    this._log(`Scheduling operation ${operation.type}`);
    const { type } = operation;
    switch (type) {
      case "connect":
        this._operations.connect = { mode: operation.mode };
        this._operations.disconnect = undefined;
        break;
      case "disconnect":
        this._operations.disconnect = { mode: operation.mode };
        this._operations.connect = undefined;
        break;
      case "resetSettings":
        this._operations.reset = {};
        break;
      case "rename":
        this._operations.rename = { name: operation.name };
        break;
      case "blink":
        this._operations.blink = {};
        break;
      case "programProfile":
        this._operations.profile = { dataSet: operation.dataSet };
        break;
      default:
        assertNever(type);
    }
    this._triggerProcessPromise?.();
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
    console.log(
      `[PixelScheduler ${this._pixel?.name ?? "<no die>"}] ${message}`
    );
  }

  private _getNextOperation(): PixelOperationParams | undefined {
    // Operations sorted by priority
    if (this._operations.connect) {
      const mode = this._operations.connect.mode;
      this._operations.connect = undefined;
      return { type: "connect", mode };
    } else if (this._operations.reset) {
      this._operations.reset = undefined;
      return { type: "resetSettings" };
    } else if (this._operations.rename) {
      const name = this._operations.rename.name;
      this._operations.rename = undefined;
      return { type: "rename", name };
    } else if (this._operations.blink) {
      this._operations.blink = undefined;
      return { type: "blink" };
    } else if (this._operations.profile) {
      const dataSet = this._operations.profile.dataSet;
      this._operations.profile = undefined;
      return {
        type: "programProfile",
        dataSet,
      };
    } else if (this._operations.disconnect) {
      const mode = this._operations.disconnect.mode;
      this._operations.disconnect = undefined;
      return { type: "disconnect", mode };
    } else {
      return undefined;
    }
  }

  private async _processOperationAsync(
    pixel: Pixel,
    op: PixelOperationParams
  ): Promise<void> {
    // TODO add timeout
    const { type } = op;
    switch (type) {
      case "connect":
        if (op.mode === "reconnect") {
          try {
            await pixel.disconnect();
          } catch (e) {
            this._log(
              `Disconnect error before reconnecting to die ${pixel.name}: ${e}`
            );
          }
        }
        await pixel.connect();
        break;
      case "disconnect":
        if (op.mode === "turnOff") {
          await pixel.turnOff();
        } else {
          await pixel.disconnect();
        }
        break;
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
          if (hash !== pixel.profileHash) {
            this._log(`Programming profile with hash ${unsigned32ToHex(hash)}`);
            await pixel.transferDataSet(op.dataSet);
          } else {
            this._log(
              `Dice already has profile with hash ${unsigned32ToHex(hash)}`
            );
          }
        }
        break;
      default:
        assertNever(type);
    }
  }
}
