import {
  assert,
  assertNever,
  createTypedEventEmitter,
  delay,
  EventReceiver,
  Mutable,
} from "@systemic-games/pixels-core-utils";
import {
  createDataSetForAnimation,
  createDataSetForProfile,
  createLibraryProfile,
  EditAnimation,
  PrebuildAnimations,
  PrebuildProfileName,
} from "@systemic-games/pixels-edit-animation";
import { DfuState } from "@systemic-games/react-native-nordic-nrf5-dfu";
import {
  Color,
  getPixelOrThrow,
  MessageOrType,
  MessageTypeValues,
  Pixel,
  PixelBatteryControllerMode,
  PixelColorway,
  PixelColorwayValues,
  PixelDieType,
  PixelDieTypeValues,
  PixelEventMap,
  PixelInfo,
  PixelInfoNotifier,
  PixelRollState,
  PixelStatus,
  ScannedPixel,
  ScannedPixelNotifier,
  ScannedPixelNotifierMutableProps,
  serializer,
  Telemetry,
} from "@systemic-games/react-native-pixels-connect";
import RNFS from "react-native-fs";

import { TelemetryData, toTelemetryData } from "./TelemetryData";
import {
  getPixelDispatcher,
  DeviceDispatcherStatic as Static,
} from "./dispatchers";
import {
  pixelBlinkId,
  pixelDischarge,
  pixelPlayProfileAnimation,
  pixelReprogramDefaultBehavior,
  pixelResetAllSettings,
  pixelSetBatteryControllerMode,
  pixelStoreValue,
  PixelValueStoreType,
} from "./extensions";

import { store } from "~/app/store";
import DfuFilesBundle from "~/features/dfu/DfuFilesBundle";
import { areSameFirmwareDates } from "~/features/dfu/areSameFirmwareDates";
import { updateFirmware } from "~/features/dfu/updateFirmware";
import { getDatedFilename } from "~/features/files/getDatedFilename";
import { getPixelValidationName } from "~/features/validation";

/**
 * Action map for {@link PixelDispatcher} class.
 * This is the list of supported actions where the property name
 * is the action name and the property type the action data type.
 */
export interface PixelDispatcherActionMap {
  connect: undefined;
  disconnect: undefined;
  reportRssi: boolean;
  blink: undefined;
  blinkId: undefined;
  playAnimation: EditAnimation;
  playProfileAnimation: number;
  playMultiAnimations: undefined;
  calibrate: undefined;
  exitValidation: undefined;
  turnOff: undefined;
  discharge: number;
  setChargerMode: PixelBatteryControllerMode;
  rename: string;
  uploadProfile: PrebuildProfileName;
  reprogramDefaultBehavior: undefined;
  resetAllSettings: undefined;
  queueDFU: undefined;
  dequeueDFU: undefined;
  setDieType: PixelDieType;
  setColorway: PixelColorway;
}

/** List of possible DFU actions. */
export type DfuAction = "none" | "upgrade" | "downgrade";

/**
 * Event map for {@link PixelDispatcher} class.
 * This is the list of supported events where the property name
 * is the event name and the property type the event data type.
 */
export type PixelDispatcherEventMap = Readonly<{
  action: keyof PixelDispatcherActionMap;
  error: Error;
  profileUploadProgress: number | undefined;
  status: PixelStatus;
  durationSinceLastActivity: number;
  hasAvailableDFU: DfuAction;
  hasActiveDFU: boolean;
  hasQueuedDFU: boolean;
  dfuState: DfuState;
  dfuProgress: number;
  telemetry: Readonly<TelemetryData>;
}>;

/**
 * The mutable properties of {@link PixelDispatcher}.
 */
export type PixelDispatcherMutableProps = ScannedPixelNotifierMutableProps &
  Pick<
    IPixelDispatcher,
    (typeof PixelDispatcher.DispatcherMutablePropsList)[number]
  >;

/** Error type thrown by {@link PixelDispatcher}. */
export class PixelDispatcherError extends Error {
  /** The Pixel for which the error occurred. */
  readonly pixel: PixelDispatcher;

  /** The original error that caused this error to be thrown. */
  readonly cause?: Error;

  constructor(pixel: PixelDispatcher, message: string, cause?: Error) {
    super(`Pixel ${pixel.name}: ${message}${cause ? ` => ${cause}` : ""}`);
    this.name = "PixelDispatcherError";
    this.pixel = pixel;
    this.cause = cause;
  }
}

/**
 * Interface with the props of {@link PixelDispatcher}.
 */
export interface IPixelDispatcher extends Omit<ScannedPixel, "type"> {
  type: "pixel" | "charger"; // TODO until we have a parent class & interface for the dispatchers
  status: PixelStatus;
  isReady: boolean;
  durationSinceLastActivity: number;
  lastScanUpdate: Date;
  isUpdatingProfile: boolean;
  hasAvailableDFU: DfuAction;
  hasQueuedDFU: boolean;
  hasActiveDFU: boolean;
  telemetryData: readonly TelemetryData[];
  isInUse: boolean;
}

/**
 * Helper class to dispatch commands to a Pixel and get notified on changes.
 */
export class PixelDispatcher
  extends ScannedPixelNotifier<PixelDispatcherMutableProps, PixelDispatcher>
  implements IPixelDispatcher
{
  // TODO implement missing notifications and remove from PixelDispatcherEventMap
  static DispatcherMutablePropsList: readonly (keyof IPixelDispatcher)[] = [
    ...ScannedPixelNotifier.ExtendedMutablePropsList,
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

  // The Pixel
  private readonly _pixel: Pixel;
  // Latest prop values coming both from scan data and Pixel instance
  private readonly _info: Mutable<ScannedPixel>;
  // More props
  private _lastDiscoTime = 0;
  private _lastActivityMs = 0;
  private _updateLastActivityTimeout?: ReturnType<typeof setTimeout>;
  private _isUpdatingProfile = false;
  private _hasAvailableDFU: DfuAction = "none";
  private _messagesLogFilePath;
  private _telemetryData: TelemetryData[] = [];
  // Our own event emitter
  private readonly _evEmitter =
    createTypedEventEmitter<PixelDispatcherEventMap>();

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

  get colorway(): PixelColorway {
    return this._info.colorway;
  }

  get dieType(): PixelDieType {
    return this._info.dieType;
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

  get rollState(): PixelRollState {
    return this._info.rollState;
  }

  get currentFace(): number {
    return this._info.currentFace;
  }

  get currentFaceIndex(): number {
    return this._info.currentFaceIndex;
  }

  get address(): number {
    return this._info.address;
  }

  get status(): PixelStatus {
    return this._pixel.status;
  }

  get isReady(): boolean {
    return this._pixel.status === "ready";
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
    return this._telemetryData;
  }

  get isInUse(): boolean {
    return (
      this.status !== "disconnected" || this.hasQueuedDFU || this.hasActiveDFU
    );
  }

  // TODO remove this member
  get pixel(): Pixel {
    return this._pixel;
  }

  static getOrCreateDispatcher(
    scannedPixel: ScannedPixelNotifier | ScannedPixel
  ): PixelDispatcher {
    return (
      getPixelDispatcher(scannedPixel.pixelId) ??
      new PixelDispatcher(
        "isNotifier" in scannedPixel
          ? scannedPixel
          : ScannedPixelNotifier.getInstance(scannedPixel)
      )
    );
  }

  private constructor(scannedPixel: ScannedPixelNotifier) {
    super(scannedPixel);
    this._info = {
      type: "pixel",
      systemId: scannedPixel.systemId,
      pixelId: scannedPixel.pixelId,
      name: scannedPixel.name,
      ledCount: scannedPixel.ledCount,
      colorway: scannedPixel.colorway,
      dieType: scannedPixel.dieType,
      firmwareDate: scannedPixel.firmwareDate,
      rssi: scannedPixel.rssi,
      batteryLevel: scannedPixel.batteryLevel,
      isCharging: scannedPixel.isCharging,
      rollState: scannedPixel.rollState,
      currentFace: scannedPixel.currentFace,
      currentFaceIndex: scannedPixel.currentFaceIndex,
      address: scannedPixel.address,
      timestamp: scannedPixel.timestamp,
    };
    this._pixel = getPixelOrThrow(scannedPixel.systemId);
    Static.instances.set(this.pixelId, this);
    // Log messages in file
    const filename = `${getDatedFilename(this.name)}~${Math.round(
      1e9 * Math.random()
    )}`;
    this._messagesLogFilePath = `${RNFS.TemporaryDirectoryPath}/${filename}.json`;
    RNFS.appendFile(this._messagesLogFilePath, "[\n").catch((e) =>
      console.error(`PixelDispatcher file write error: ${e.message}`)
    );
    const write = (action: "send" | "received", msgOrType: MessageOrType) => {
      const timestamp = Date.now();
      const type = serializer.getMessageType(msgOrType);
      const data =
        typeof msgOrType === "string"
          ? { type: MessageTypeValues[msgOrType] }
          : msgOrType;
      const obj = { timestamp, type, action, data };
      RNFS.appendFile(
        this._messagesLogFilePath,
        `  ${JSON.stringify(obj)},\n`
      ).catch((e) =>
        console.error(`PixelDispatcher file write error: ${e.message}`)
      );
    };
    // TODO remove listeners on dispose
    this._pixel.addEventListener("messageSend", (msgOrType) =>
      write("send", msgOrType)
    );
    this._pixel.addEventListener("messageReceived", (msgOrType) =>
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
    for (const prop of ScannedPixelNotifier.ExtendedMutablePropsList) {
      scannedPixel.addPropertyListener(prop, () => {
        if (copyProp(scannedPixel, this._info, prop)) {
          this.emitPropertyEvent(prop);
          if (prop === "timestamp") {
            this.emitPropertyEvent("lastScanUpdate");
            this._updateLastActivity();
          } else if (prop === "firmwareDate") {
            this._updateIsDFUAvailable();
          }
        }
      });
    }
    // Forward pixel instance property events
    for (const prop of PixelInfoNotifier.MutablePropsList) {
      this._pixel.addPropertyListener(prop, () => {
        if (copyProp(this._pixel as PixelInfo, this._info, prop)) {
          this.emitPropertyEvent(prop);
        }
      });
    }
    // Forward and monitor status
    this._pixel.addPropertyListener("status", ({ status }) => {
      this._evEmitter.emit("status", status);
      if (status === "disconnected") {
        this._lastDiscoTime = Date.now();
      }
      this._updateLastActivity();
    });
    // Telemetry
    this._pixel.addMessageListener("telemetry", (msg) => {
      const data = toTelemetryData(msg as Telemetry);
      this._telemetryData.push(data);
      this._evEmitter.emit("telemetry", data);
    });
    // Selected firmware
    this._updateIsDFUAvailable();
    store.subscribe(() => this._updateIsDFUAvailable());
    // Setup checking if around
    this._updateLastActivity();
  }

  addListener<K extends keyof PixelDispatcherEventMap>(
    type: K,
    listener: EventReceiver<PixelDispatcherEventMap[K]>
  ): void {
    this._evEmitter.addListener(type, listener);
  }

  removeListener<K extends keyof PixelDispatcherEventMap>(
    type: K,
    listener: EventReceiver<PixelDispatcherEventMap[K]>
  ): void {
    this._evEmitter.removeListener(type, listener);
  }

  dispatch<T extends keyof PixelDispatcherActionMap>(
    action: T,
    params?: PixelDispatcherActionMap[T]
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
          this._pixel.reportRssi((params as boolean) ?? true),
          action
        );
        break;
      case "blink":
        this._guard(this._pixel.blink(Color.dimOrange, { count: 2 }), action);
        break;
      case "blinkId":
        this._guard(
          pixelBlinkId(this._pixel, { brightness: 0x04, loop: true }),
          action
        );
        break;
      case "playAnimation":
        this._guard(
          this._playAnimation(params as EditAnimation) ??
            PrebuildAnimations.rainbow,
          action
        );
        break;
      case "playProfileAnimation":
        this._guard(
          pixelPlayProfileAnimation(this.pixel, (params as number) ?? 0),
          action
        );
        break;
      case "playMultiAnimations":
        this._guard(this._playMultiAnimations(), action);
        break;
      case "calibrate":
        this._guard(this._pixel.startCalibration(), action);
        break;
      case "exitValidation":
        // Exit validation mode, don't wait for response as die will restart
        this._guard(this._pixel.sendMessage("exitValidation", true), action);
        break;
      case "turnOff":
        this._guard(this._pixel.turnOff(), action);
        break;
      case "discharge":
        this._guard(
          pixelDischarge(this._pixel, (params as number) ?? 50),
          action
        );
        break;
      case "setChargerMode":
        this._guard(
          pixelSetBatteryControllerMode(
            this._pixel,
            (params as PixelBatteryControllerMode) ?? "default"
          ),
          action
        );
        break;
      case "rename":
        this._guard(
          this._pixel.rename(
            typeof params === "string" && params.length
              ? params
              : getPixelValidationName(this._pixel)
          ),
          action
        );
        break;
      case "uploadProfile":
        this._guard(
          this._uploadProfile((params as PrebuildProfileName) ?? "default"),
          action
        );
        break;
      case "reprogramDefaultBehavior":
        this._guard(pixelReprogramDefaultBehavior(this._pixel), action);
        break;
      case "resetAllSettings":
        this._guard(pixelResetAllSettings(this._pixel), action);
        break;
      case "queueDFU":
        this._queueDFU();
        break;
      case "dequeueDFU":
        this._dequeueDFU();
        break;
      case "setDieType":
        if (PixelDieTypeValues[params as PixelDieType]) {
          this._guard(
            pixelStoreValue(
              this._pixel,
              PixelValueStoreType.DieType,
              PixelDieTypeValues[params as PixelDieType]
            ),
            action
          );
        }
        break;
      case "setColorway":
        if (PixelColorwayValues[params as PixelColorway]) {
          this._guard(
            pixelStoreValue(
              this._pixel,
              PixelValueStoreType.Colorway,
              PixelColorwayValues[params as PixelColorway]
            ),
            action
          );
        }
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
      this._pixel.logMessages = true;
      this._pixel.logger = console.log;
    } else {
      this._pixel.logMessages = false;
    }
  }

  private _guard(promise: Promise<unknown>, action: string): void {
    promise?.catch((error) => {
      console.log(`[${this.name}] PixelDispatcher error: ${error}`);
      this._evEmitter.emit(
        "error",
        new PixelDispatcherError(this, `Action ${action} failed`, error)
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
    await this._pixel.connect();
    // Blink to show we're connected (but don't wait for the blink ack)
    this._pixel.blink(Color.dimBlue, { count: 2 }).catch(() => {});
  }

  private async _disconnect(): Promise<void> {
    if (this.hasActiveDFU) {
      return;
    }
    // Blink to show we're disconnecting
    try {
      await this._pixel.blink(Color.dimCyan, { count: 3 });
    } catch {}
    // Disconnect
    await this._pixel.disconnect();
  }

  private async _onUploadProgress(ev: PixelEventMap["dataTransfer"]) {
    if (ev.type === "preparing" || ev.type === "starting") {
      this._evEmitter.emit("profileUploadProgress", 0);
    } else if (ev.type === "progress") {
      this._evEmitter.emit("profileUploadProgress", ev.progressPercent);
    } else if (ev.type === "completed" || ev.type === "failed") {
      this._evEmitter.emit("profileUploadProgress", undefined);
    }
  }

  private async _playAnimation(anim: EditAnimation): Promise<void> {
    const dataSet = createDataSetForAnimation(anim).toDataSet();
    const onProgress = this._onUploadProgress.bind(this);
    try {
      this._pixel.addEventListener("dataTransfer", onProgress);
      await this._pixel.playTestAnimation(dataSet);
    } finally {
      this._pixel.removeEventListener("dataTransfer", onProgress);
    }
  }

  private async _playMultiAnimations(): Promise<void> {
    await this._playAnimation(PrebuildAnimations.rainbowAllFaces);
    await delay(6000);
    await this._playAnimation(PrebuildAnimations.rainbow);
    await delay(6000);
    await this._playAnimation(PrebuildAnimations.noise);
  }

  private async _uploadProfile(type: PrebuildProfileName): Promise<void> {
    const profile = createLibraryProfile(type, this.dieType);
    const dataSet = createDataSetForProfile(profile).toDataSet();
    const onProgress = this._onUploadProgress.bind(this);
    try {
      this._isUpdatingProfile = true;
      this._pixel.addEventListener("dataTransfer", onProgress);
      await this._pixel.transferDataSet(dataSet);
    } finally {
      this._isUpdatingProfile = false;
      this._pixel.removeEventListener("dataTransfer", onProgress);
    }
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

  //
  // DFU
  //

  private _queueDFU(): void {
    if (this.hasAvailableDFU && !Static.dfuQueue.pending.includes(this)) {
      // Queue DFU request
      Static.dfuQueue.pending.push(this);
      this._evEmitter.emit("hasQueuedDFU", true);
      // Run update immediately if it's the only pending request
      if (!Static.dfuQueue.active) {
        this._guard(this._startDFU(), "startDfu");
      } else {
        console.log(`DFU queued for Pixel ${this.name}`);
      }
    }
  }

  private _dequeueDFU(): void {
    const i = Static.dfuQueue.pending.indexOf(this);
    if (i >= 0) {
      Static.dfuQueue.pending.splice(i, 1);
      this._evEmitter.emit("hasQueuedDFU", false);
    }
  }

  private async _startDFU(): Promise<void> {
    const bundle = this._getSelectedDfuBundle();
    try {
      this._dequeueDFU();
      if (!bundle) {
        throw new Error("No DFU Files Selected");
      }
      Static.dfuQueue.active = this;
      this._evEmitter.emit("hasActiveDFU", true);
      await updateFirmware(
        { systemId: this.systemId, address: this.address },
        bundle.bootloader?.pathname,
        bundle.firmware?.pathname,
        (state) => this._evEmitter.emit("dfuState", state),
        (p) => this._evEmitter.emit("dfuProgress", p)
      );
    } finally {
      assert(Static.dfuQueue.active === this);
      Static.dfuQueue.active = undefined;
      this._evEmitter.emit("hasActiveDFU", false);
      // Run next update if any
      const pixel = Static.dfuQueue.pending[0];
      if (pixel) {
        assert(
          pixel.type === "pixel",
          "Queued DFU device is not of pixel type"
        );
        pixel._guard(pixel._startDFU(), "startDfu");
      }
    }
  }
}

export default PixelDispatcher;
