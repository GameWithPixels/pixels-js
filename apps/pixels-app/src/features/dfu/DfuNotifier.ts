import {
  createTypedEventEmitter,
  EventReceiver,
} from "@systemic-games/pixels-core-utils";
import { Pixel } from "@systemic-games/react-native-pixels-connect";

export interface DfuPathnamesBundle {
  readonly timestamp: number;
  readonly firmware: string;
  readonly bootloader?: string;
}

export type DfuAvailability = "unknown" | "outdated" | "up-to-date";

export interface DfuFilesInfo {
  readonly timestamp: number;
  readonly firmwarePath: string;
  readonly bootloaderPath?: string;
}

export interface DfuNotifierAvailabilityEvent {
  pixel: Pixel;
  dfuAvailability: DfuAvailability;
}

export interface DfuNotifierEventMap {
  outdatedPixels: Pixel[];
  dfuAvailability: DfuNotifierAvailabilityEvent;
}

export class DfuNotifier {
  private readonly _evEmitter = createTypedEventEmitter<DfuNotifierEventMap>();
  private _fwTimestamp: number;
  private _pixelInDFU: Pixel | undefined;
  private _watched = new Map<
    number,
    {
      pixel: Pixel;
      dfuAvailability: DfuAvailability;
      unwatch: () => void;
    }
  >();

  get outdatedPixels(): Pixel[] {
    const pixels: Pixel[] = [];
    for (const entry of this._watched.values()) {
      if (entry.dfuAvailability === "outdated") {
        pixels.push(entry.pixel);
      }
    }
    return pixels;
  }

  constructor(firmwareTimestamp?: number) {
    this._evEmitter.setMaxListeners(100); // We expect a lot of listeners
    this._fwTimestamp = firmwareTimestamp ?? 0;
  }

  /**
   * Registers a listener function that will be called when the specified
   * event is raised.
   * See {@link DfuNotifierEventMap} for the list of events and their
   * associated data.
   * @param type A case-sensitive string representing the event type to listen for.
   * @param listener The callback function.
   */
  addEventListener<K extends keyof DfuNotifierEventMap>(
    type: K,
    listener: EventReceiver<DfuNotifierEventMap[K]>
  ): void {
    this._evEmitter.addListener(type, listener);
  }

  /**
   * Unregisters a listener from receiving events identified by
   * the given event name.
   * See {@link DfuNotifierEventMap} for the list of events and their
   * associated data.
   * @param type A case-sensitive string representing the event type.
   * @param listener The callback function to unregister.
   */
  removeEventListener<K extends keyof DfuNotifierEventMap>(
    type: K,
    listener: EventReceiver<DfuNotifierEventMap[K]>
  ): void {
    this._evEmitter.removeListener(type, listener);
  }

  getDfuAvailability(pixelId: number): DfuAvailability {
    const entry = this._watched.get(pixelId);
    return entry?.dfuAvailability ?? "unknown";
  }

  updateFirmwareTimestamp(timestamp: number): void {
    const changed = this._fwTimestamp !== timestamp;
    if (changed) {
      this._fwTimestamp = timestamp;
      for (const entry of this._watched.values()) {
        if (entry.pixel !== this._pixelInDFU) {
          this._notifyDieDfuAvailability(entry.pixel);
        }
      }
    }
  }

  watch(pixel: Pixel): void {
    if (!this._watched.has(pixel.pixelId)) {
      const onStatus = () => this._notifyDieDfuAvailability(pixel);
      pixel.addEventListener("status", onStatus);
      const onFirmwareDate = () => this._notifyDieDfuAvailability(pixel);
      pixel.addPropertyListener("firmwareDate", onFirmwareDate);
      const dfuAvailability = this._determineDieDfuAvailability(pixel);
      this._watched.set(pixel.pixelId, {
        pixel,
        dfuAvailability,
        unwatch: () => {
          pixel.removeEventListener("status", onStatus);
          pixel.removePropertyListener("firmwareDate", onFirmwareDate);
        },
      });
    }
  }

  unwatch(pixelId: number): void {
    const entry = this._watched.get(pixelId);
    if (entry) {
      entry.unwatch();
      this._watched.delete(pixelId);
    }
  }

  unwatchAll(): void {
    const pixels = [...this._watched.values()].map((v) => v.pixel);
    for (const p of pixels) {
      this.unwatch(p.pixelId);
    }
  }

  private _emitEvent<T extends keyof DfuNotifierEventMap>(
    name: T,
    ev: DfuNotifierEventMap[T]
  ): void {
    try {
      this._evEmitter.emit(name, ev);
    } catch (e) {
      console.error(
        `DfuNotifier: Uncaught error in "${name}" event listener: ${e}`
      );
    }
  }

  _determineDieDfuAvailability(pixel?: Pixel): DfuAvailability {
    return pixel?.status !== "ready" || !this._fwTimestamp
      ? "unknown"
      : pixel.firmwareDate.getTime() < this._fwTimestamp
        ? "outdated"
        : "up-to-date";
  }

  _notifyDieDfuAvailability(pixel: Pixel): void {
    const entry = this._watched.get(pixel.pixelId);
    if (entry) {
      const dfuAvailability = this._determineDieDfuAvailability(entry.pixel);
      if (entry.dfuAvailability !== dfuAvailability) {
        const notifyOutdated =
          entry.dfuAvailability === "outdated" ||
          dfuAvailability === "outdated";
        entry.dfuAvailability = dfuAvailability;
        this._emitEvent("dfuAvailability", { pixel, dfuAvailability });
        if (notifyOutdated) {
          this._emitEvent("outdatedPixels", this.outdatedPixels);
        }
      }
    }
  }
}
