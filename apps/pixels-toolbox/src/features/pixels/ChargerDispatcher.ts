import {
  assertNever,
  createTypedEventEmitter,
  EventReceiver,
  Mutable,
} from "@systemic-games/pixels-core-utils";
import { DfuState } from "@systemic-games/react-native-nordic-nrf5-dfu";
import {
  Charger,
  ChargerMessages,
  Color,
  getCharger,
  Pixel,
  PixelStatus,
  ScannedCharger,
  ScannedChargerNotifier,
  ScannedChargerNotifierMutableProps,
} from "@systemic-games/react-native-pixels-connect";
import RNFS from "react-native-fs";

import { IPixelDispatcher } from "./PixelDispatcher";
import { TelemetryData } from "./TelemetryData";
import {
  getChargerDispatcher,
  DeviceDispatcherStatic as Static,
} from "./dispatchers";

import { store } from "~/app/store";
import DfuFilesBundle from "~/features/dfu/DfuFilesBundle";
import { areSameFirmwareDates } from "~/features/dfu/areSameFirmwareDates";
import { getDatedFilename } from "~/features/files/getDatedFilename";

/**
 * Action map for {@link ChargerDispatcher} class.
 * This is the list of supported actions where the property name
 * is the action name and the property type the action data type.
 */
export interface ChargerDispatcherActionMap {
  connect: undefined;
  disconnect: undefined;
  reportRssi: boolean;
  blink: undefined;
  rename: string;
  queueDFU: undefined;
  dequeueDFU: undefined;
}

/** List of possible DFU actions. */
export type DfuAction = "none" | "upgrade" | "downgrade";

/**
 * Event map for {@link ChargerDispatcher} class.
 * This is the list of supported events where the property name
 * is the event name and the property type the event data type.
 */
export type ChargerDispatcherEventMap = Readonly<{
  action: keyof ChargerDispatcherActionMap;
  error: Error;
  status: PixelStatus;
  durationSinceLastActivity: number;
  hasAvailableDFU: DfuAction;
  hasActiveDFU: boolean;
  hasQueuedDFU: boolean;
  dfuState: DfuState;
  dfuProgress: number;
}>;

/**
 * The mutable properties of {@link ChargerDispatcher}.
 */
export type ChargerDispatcherMutableProps = ScannedChargerNotifierMutableProps &
  Pick<
    IPixelDispatcher,
    (typeof ChargerDispatcher.DispatcherMutablePropsList)[number]
  >;

/** Error type thrown by {@link ChargerDispatcher}. */
export class ChargerDispatcherError extends Error {
  /** The Charger for which the error occurred. */
  readonly pixel: ChargerDispatcher;

  /** The original error that caused this error to be thrown. */
  readonly cause?: Error;

  constructor(pixel: ChargerDispatcher, message: string, cause?: Error) {
    super(`Charger ${pixel.name}: ${message}${cause ? ` => ${cause}` : ""}`);
    this.name = "ChargerDispatcherError";
    this.pixel = pixel;
    this.cause = cause;
  }
}

/**
 * Helper class to dispatch commands to a Charger and get notified on changes.
 */
export class ChargerDispatcher
  extends ScannedChargerNotifier<
    ChargerDispatcherMutableProps,
    ChargerDispatcher &
      Readonly<{ type: "die"; address: number; timestamp: Date }>
  >
  implements IPixelDispatcher
{
  // TODO implement missing notifications and remove from ChargerDispatcherEventMap
  static DispatcherMutablePropsList: readonly (keyof IPixelDispatcher)[] = [
    ...ScannedChargerNotifier.ExtendedMutablePropsList,
    // "status",
    // "isReady",
    // "durationSinceLastActivity",
    "lastScanUpdate",
    // "isUpdatingProfile",
    // "hasAvailableDFU",
    // "hasQueuedDFU",
    // "hasActiveDFU",
    // "isInUse",
  ];

  // The Charger
  private readonly _charger: Charger;
  // Latest prop values coming both from scan data and Charger instance
  private readonly _info: Mutable<ScannedCharger>;
  // More props
  private _lastDiscoTime = 0;
  private _lastActivityMs = 0;
  private _updateLastActivityTimeout?: ReturnType<typeof setTimeout>;
  private _isUpdatingProfile = false;
  private _hasAvailableDFU: DfuAction = "none";
  private _messagesLogFilePath;
  // Our own event emitter
  private readonly _evEmitter =
    createTypedEventEmitter<ChargerDispatcherEventMap>();

  static MutablePropsList: readonly [
    "name",
    "ledCount",
    "firmwareDate",
    "rssi",
    "batteryLevel",
    "isCharging",
  ];

  get systemId(): string {
    return this._info.systemId;
  }

  get pixelId(): number {
    return this._info.pixelId;
  }

  get name(): string {
    return this._info.name;
  }

  get ledCount(): number {
    return this._info.ledCount;
  }

  get firmwareDate(): Date {
    return this._info.firmwareDate;
  }

  get rssi(): number {
    return this._info.rssi;
  }

  get batteryLevel(): number {
    return this._info.batteryLevel;
  }

  get isCharging(): boolean {
    return this._info.isCharging;
  }

  get address(): number {
    return this._info.address;
  }

  get status(): PixelStatus {
    return this._charger.status;
  }

  get isReady(): boolean {
    return this._charger.status === "ready";
  }

  // Time in ms, 0 when connected
  get durationSinceLastActivity(): number {
    return this._lastActivityMs;
  }

  get lastScanUpdate(): Date {
    return this._info.timestamp;
  }

  get isUpdatingProfile(): boolean {
    return this._isUpdatingProfile;
  }

  get hasAvailableDFU(): DfuAction {
    return this._hasAvailableDFU;
  }

  get hasQueuedDFU(): boolean {
    return Static.dfuQueue.pending.indexOf(this) >= 0;
  }

  get hasActiveDFU(): boolean {
    return this === Static.dfuQueue.active;
  }

  get telemetryData(): readonly TelemetryData[] {
    return [];
  }

  get isInUse(): boolean {
    return (
      this.status !== "disconnected" || this.hasQueuedDFU || this.hasActiveDFU
    );
  }

  // TODO remove this member
  get charger(): Charger {
    return this._charger;
  }

  // TODO remove this member
  get pixel(): Pixel {
    return this._charger as unknown as Pixel;
  }

  static getOrCreateDispatcher(
    scannedCharger: ScannedChargerNotifier | ScannedCharger
  ): ChargerDispatcher {
    return (
      getChargerDispatcher(scannedCharger.pixelId) ??
      new ChargerDispatcher(
        "isNotifier" in scannedCharger
          ? scannedCharger
          : ScannedChargerNotifier.getInstance(scannedCharger)
      )
    );
  }

  private constructor(scannedCharger: ScannedChargerNotifier) {
    super(scannedCharger);
    this._info = {
      type: "charger",
      systemId: scannedCharger.systemId,
      pixelId: scannedCharger.pixelId,
      name: scannedCharger.name,
      ledCount: scannedCharger.ledCount,
      firmwareDate: scannedCharger.firmwareDate,
      rssi: scannedCharger.rssi,
      batteryLevel: scannedCharger.batteryLevel,
      isCharging: scannedCharger.isCharging,
      address: scannedCharger.address,
      timestamp: scannedCharger.timestamp,
    };
    this._charger =
      getCharger(scannedCharger.systemId) ??
      (() => {
        throw new Error("Charger not found");
      })();
    Static.instances.set(this.pixelId, this);
    // Log messages in file
    const filename = `${getDatedFilename(this.name)}~${Math.round(
      1e9 * Math.random()
    )}`;
    this._messagesLogFilePath = `${RNFS.TemporaryDirectoryPath}/${filename}.json`;
    RNFS.appendFile(this._messagesLogFilePath, "[\n").catch((e) =>
      console.error(`ChargerDispatcher file write error: ${e.message}`)
    );
    const write = (
      action: "send" | "received",
      msgOrType: ChargerMessages.ChargerMessageOrType
    ) => {
      const timestamp = Date.now();
      const type = ChargerMessages.serializer.getMessageType(msgOrType);
      const data =
        typeof msgOrType === "string"
          ? { type: ChargerMessages.ChargerMessageTypeValues[msgOrType] }
          : msgOrType;
      const obj = { timestamp, type, action, data };
      RNFS.appendFile(
        this._messagesLogFilePath,
        `  ${JSON.stringify(obj)},\n`
      ).catch((e) =>
        console.error(`ChargerDispatcher file write error: ${e.message}`)
      );
    };
    // TODO remove listeners on dispose
    this._charger.addEventListener("messageSend", (msgOrType) =>
      write("send", msgOrType)
    );
    this._charger.addEventListener("messageReceived", (msgOrType) =>
      write("received", msgOrType)
    );
    // Forward scanned pixel property events
    function copyProp<T, Key extends keyof T>(src: T, dst: T, key: Key) {
      if (dst[key] !== src[key]) {
        dst[key] = src[key];
        return true;
      }
      return false;
    }
    for (const prop of ScannedChargerNotifier.ExtendedMutablePropsList) {
      scannedCharger.addPropertyListener(prop, () => {
        if (copyProp(scannedCharger, this._info, prop)) {
          this.emitPropertyEvent(prop);
          if (prop === "timestamp") {
            this.emitPropertyEvent("lastScanUpdate");
            this._updateLastActivity();
          } else if (prop === "firmwareDate") {
            // this._updateIsDFUAvailable();
          }
        }
      });
    }
    // Forward charger instance property events
    for (const prop of ChargerDispatcher.MutablePropsList) {
      this._charger.addPropertyListener(prop, () => {
        if (
          copyProp(
            this._charger as Omit<ScannedCharger, "address" | "timestamp">,
            this._info,
            prop
          )
        ) {
          this.emitPropertyEvent(prop);
        }
      });
    }
    // Forward and monitor status
    this._charger.addPropertyListener("status", ({ status }) => {
      this._evEmitter.emit("status", status);
      if (status === "disconnected") {
        this._lastDiscoTime = Date.now();
      }
      this._updateLastActivity();
    });
    // Selected firmware
    // this._updateIsDFUAvailable();
    // store.subscribe(() => this._updateIsDFUAvailable());
    // Setup checking if around
    this._updateLastActivity();
  }

  addListener<K extends keyof ChargerDispatcherEventMap>(
    type: K,
    listener: EventReceiver<ChargerDispatcherEventMap[K]>
  ): void {
    this._evEmitter.addListener(type, listener);
  }

  removeListener<K extends keyof ChargerDispatcherEventMap>(
    type: K,
    listener: EventReceiver<ChargerDispatcherEventMap[K]>
  ): void {
    this._evEmitter.removeListener(type, listener);
  }

  dispatch<T extends keyof ChargerDispatcherActionMap>(
    action: T,
    params?: ChargerDispatcherActionMap[T]
  ) {
    switch (action) {
      case "connect":
        this._guard(this._connect(), action);
        break;
      case "disconnect":
        this._guard(this._disconnect(), action);
        break;
      case "reportRssi":
        this._guard(
          this._charger.reportRssi((params as boolean) ?? true),
          action
        );
        break;
      case "blink":
        this._guard(
          this._charger.blink(Color.dimOrange, { count: 2, fade: 64 }),
          action
        );
        break;
      case "rename":
        this._guard(
          this._charger.rename(
            typeof params === "string" && params.length ? params : "Charger"
          ),
          action
        );
        break;
      case "queueDFU":
        break;
      case "dequeueDFU":
        break;
      default:
        assertNever(action, `Unknown action ${action}`);
    }
  }

  async exportMessages(uri: string): Promise<void> {
    console.log(`[${this.name}] Saving messages log in: ${uri}`);
    await RNFS.copyFile(this._messagesLogFilePath, uri);
    await RNFS.appendFile(uri, "]\n");
  }

  logMessages(enable = true): void {
    if (enable) {
      this._charger.logMessages = true;
      this._charger.logger = console.log;
    } else {
      this._charger.logMessages = false;
    }
  }

  private _guard(promise: Promise<unknown>, action: string): void {
    promise?.catch((error) => {
      console.log(`[${this.name}] ChargerDispatcher error: ${error}`);
      this._evEmitter.emit(
        "error",
        new ChargerDispatcherError(this, `Action ${action} failed`, error)
      );
    });
  }

  private _updateLastActivity(): void {
    // Cancel timeout
    if (this._updateLastActivityTimeout) {
      clearTimeout(this._updateLastActivityTimeout);
    }
    this._updateLastActivityTimeout = undefined;
    // Check if still around
    const last = Math.max(this._lastDiscoTime, this.lastScanUpdate.getTime());
    const ms = this.status !== "disconnected" ? 0 : Date.now() - last;
    if (this._lastActivityMs !== ms) {
      // Notify if changed
      this._lastActivityMs = ms;
      this._evEmitter.emit("durationSinceLastActivity", ms);
    }
    // Check again in 5 seconds
    this._updateLastActivityTimeout = setTimeout(
      () => this._updateLastActivity(),
      5000
    );
  }

  private async _connect(): Promise<void> {
    if (this.hasActiveDFU) {
      return;
    }
    // Connect
    await this._charger.connect();
  }

  private async _disconnect(): Promise<void> {
    if (this.hasActiveDFU) {
      return;
    }
    // Disconnect
    await this._charger.disconnect();
  }

  private _updateIsDFUAvailable() {
    const bundle = this._getSelectedDfuBundle();
    const isDiff =
      !!bundle && !areSameFirmwareDates(bundle.date, this.firmwareDate);
    const av = !isDiff
      ? "none"
      : bundle.date > this.firmwareDate
        ? "upgrade"
        : "downgrade";
    if (this._hasAvailableDFU !== av) {
      this._hasAvailableDFU = av;
      this._evEmitter.emit("hasAvailableDFU", av);
    }
  }

  private _getSelectedDfuBundle(): DfuFilesBundle | undefined {
    const dfuBundles = store.getState().dfuFiles;
    const serializedBundle = dfuBundles.available[dfuBundles.selected];
    if (serializedBundle) {
      return DfuFilesBundle.create(serializedBundle);
    }
  }
}

export default ChargerDispatcher;
