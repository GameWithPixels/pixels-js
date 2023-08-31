import {
  assert,
  assertNever,
  createTypedEventEmitter,
  EventReceiver,
  getValueKeyName,
} from "@systemic-games/pixels-core-utils";
import {
  createDataSetForProfile,
  EditActionPlayAnimation,
  EditAnimation,
  EditAnimationRainbow,
  EditConditionFaceCompare,
  EditDataSet,
  EditProfile,
  EditRule,
} from "@systemic-games/pixels-edit-animation";
import { DfuState } from "@systemic-games/react-native-nordic-nrf5-dfu";
import {
  Color,
  getPixel,
  PixelInfo,
  Pixel,
  PixelDesignAndColor,
  PixelRollState,
  PixelStatus,
  PixelInfoNotifier,
  ScannedPixelNotifier,
  PixelInfoNotifierMutableProps,
  FaceCompareFlagsValues,
  DataSet,
  MessageOrType,
  getMessageType,
  Telemetry,
  MessageTypeValues,
  PixelBatteryState,
  PixelRollStateValues,
  PixelBatteryStateValues,
  PixelBatteryControllerStateValues,
  BatteryControllerState,
  ScannedPixel,
} from "@systemic-games/react-native-pixels-connect";
import RNFS from "react-native-fs";

import { getDieType } from "./DieType";
import { PrebuildAnimations } from "./PrebuildAnimations";
import {
  pixelBlinkId,
  pixelDischarge,
  pixelForceEnableCharging,
  pixelPlayProfileAnimation,
  pixelReprogramDefaultBehavior,
  pixelResetAllSettings,
} from "./extensions";

import { store } from "~/app/store";
import DfuFilesBundle from "~/features/dfu/DfuFilesBundle";
import { areSameFirmwareDates } from "~/features/dfu/areSameFirmwareDates";
import { updateFirmware } from "~/features/dfu/updateFirmware";
import { getDatedFilename } from "~/features/files/getDatedFilename";
import { getDefaultProfile } from "~/features/pixels/getDefaultProfile";

export type ProfileType = "default" | "tiny";

export interface PixelDispatcherActionMap {
  connect: undefined;
  disconnect: undefined;
  reportRssi: undefined;
  blink: undefined;
  blinkId: undefined;
  playAnimation: EditAnimation;
  playProfileAnimation: number;
  calibrate: undefined;
  exitValidation: undefined;
  turnOff: undefined;
  discharge: number;
  enableCharging: boolean;
  rename: string;
  uploadProfile: ProfileType;
  reprogramDefaultBehavior: undefined;
  resetAllSettings: undefined;
  queueDFU: undefined;
  dequeueDFU: undefined;
}

export type PixelDispatcherActionName = keyof PixelDispatcherActionMap;

/**
 * Event map for {@link PixelDispatcher} class.
 * This is the list of supported events where the property name
 * is the event name and the property type the event data type.
 * @category Pixels
 */
export interface PixelDispatcherEventMap {
  action: PixelDispatcherActionName;
  error: Error;
  profileUploadProgress: number | undefined;
  status: PixelStatus;
  durationSinceLastActivity: number;
  hasAvailableDFU: boolean;
  hasActiveDFU: boolean;
  hasQueuedDFU: boolean;
  dfuState: DfuState;
  dfuProgress: number;
  telemetry: Readonly<TelemetryData>;
}

export type PixelDispatcherMutableProps =
  | PixelInfoNotifierMutableProps
  // TODO implement missing notifications and remove from PixelDispatcherEventMap
  // | "status"
  // | "isReady"
  // | "durationSinceLastActivity"
  | "lastScanUpdate";
// | "isUpdatingProfile"
// | "hasAvailableDFU"
// | "hasQueuedDFU"
// | "hasActiveDFU"

export type TelemetryData = {
  accX: number;
  accY: number;
  accZ: number;
  faceConfidence: number;
  timestamp: number;
  rollState: PixelRollState;
  faceIndex: number;
  battery: number;
  batteryState: PixelBatteryState;
  batteryControllerState: BatteryControllerState;
  voltage: number;
  voltageCoil: number;
  rssi: number;
  rssiChannelIndex: number;
  mcuTemperature: number;
  batteryTemperature: number;
  internalChargeState: boolean;
  forceDisableChargingState: boolean;
  ledCurrent: number;
};

export class PixelDispatcherError extends Error {
  protected readonly _pixel: PixelDispatcher;
  protected readonly _cause?: Error;

  /** The Pixel for which the error occurred. */
  get pixel(): PixelDispatcher {
    return this._pixel;
  }

  /** The original error that caused this error to be thrown. */
  get cause(): Error | undefined {
    return this._cause;
  }

  constructor(pixel: PixelDispatcher, message: string, cause?: Error) {
    super(`Pixel ${pixel.name}: ${message}${cause ? ` => ${cause}` : ""}`);
    this.name = "PixelDispatcherError";
    this._pixel = pixel;
    this._cause = cause;
  }
}

/**
 * Helper class to dispatch commands to a Pixel and get notified on changes.
 */
class PixelDispatcher extends ScannedPixelNotifier<
  // TODO bad inheritance!
  keyof PixelDispatcherMutableProps,
  PixelDispatcher
> {
  private _scannedPixel: ScannedPixelNotifier;
  private _pixel: Pixel;
  private readonly _evEmitter =
    createTypedEventEmitter<PixelDispatcherEventMap>();
  private _lastDiscoTime = 0;
  private _lastActivityMs = 0;
  private _updateLastActivityTimeout?: ReturnType<typeof setTimeout>;
  private _isUpdatingProfile = false;
  private _isDfuAvailable = false;
  private _messagesLogFilePath;
  private _telemetryData: TelemetryData[] = [];

  private static readonly _pxInstances = new Map<number, PixelDispatcher>();
  private static _activeDFU: PixelDispatcher | undefined;
  private static readonly _pendingDFUs: PixelDispatcher[] = [];

  get systemId(): string {
    return this._getPixelInfo().systemId;
  }

  get pixelId(): number {
    return this._scannedPixel.pixelId;
  }

  get name(): string {
    // TODO use Pixel instance name when connected, update code for other props too
    return this._scannedPixel.name;
  }

  get ledCount(): number {
    return this._getPixelInfo().ledCount;
  }

  get designAndColor(): PixelDesignAndColor {
    return this._getPixelInfo().designAndColor;
  }

  get firmwareDate(): Date {
    return this._getPixelInfo().firmwareDate;
  }

  get rssi(): number {
    return this._getPixelInfo().rssi;
  }

  get batteryLevel(): number {
    return this._getPixelInfo().batteryLevel;
  }

  get isCharging(): boolean {
    return this._getPixelInfo().isCharging;
  }

  get rollState(): PixelRollState {
    return this._getPixelInfo().rollState;
  }

  get currentFace(): number {
    return this._getPixelInfo().currentFace;
  }

  get address(): number {
    return this._scannedPixel.address;
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
    return this._scannedPixel.timestamp;
  }

  get isUpdatingProfile(): boolean {
    return this._isUpdatingProfile;
  }

  get hasAvailableDFU(): boolean {
    return this._isDfuAvailable;
  }

  get hasQueuedDFU(): boolean {
    return PixelDispatcher._pendingDFUs.indexOf(this) >= 0;
  }

  get hasActiveDFU(): boolean {
    return this === PixelDispatcher._activeDFU;
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

  static findDispatcher(pixelId: number) {
    return PixelDispatcher._pxInstances.get(pixelId);
  }

  static getDispatcher(
    scannedPixel: ScannedPixelNotifier | ScannedPixel
  ): PixelDispatcher {
    return (
      PixelDispatcher._pxInstances.get(scannedPixel.pixelId) ??
      new PixelDispatcher(
        scannedPixel instanceof ScannedPixelNotifier
          ? scannedPixel
          : ScannedPixelNotifier.getInstance(scannedPixel)
      )
    );
  }

  private constructor(scannedPixel: ScannedPixelNotifier) {
    super(scannedPixel);
    this._scannedPixel = scannedPixel;
    this._pixel = getPixel(scannedPixel);
    PixelDispatcher._pxInstances.set(this.pixelId, this);
    // Log messages in file
    const filename = `${getDatedFilename(this.name)}~${Math.round(
      1e9 * Math.random()
    )}`;
    this._messagesLogFilePath = `${RNFS.TemporaryDirectoryPath}/${filename}.json`;
    console.log(
      `[${this.name}] Logging messages in: ${this._messagesLogFilePath}`
    );
    RNFS.appendFile(this._messagesLogFilePath, "[\n").catch((e) =>
      console.error(`PixelDispatcher file write error: ${e.message}`)
    );
    const write = (action: "send" | "received", msgOrType: MessageOrType) => {
      const timestamp = Date.now();
      const type = getMessageType(msgOrType);
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
    // TODO remove listeners
    this._pixel.addEventListener("messageSend", (msgOrType) =>
      write("send", msgOrType)
    );
    this._pixel.addEventListener("message", (msgOrType) =>
      write("received", msgOrType)
    );
    // Forward property events
    scannedPixel.addPropertyListener("timestamp", () => {
      this.emitPropertyEvent("timestamp");
      this.emitPropertyEvent("lastScanUpdate");
      this._updateLastActivity();
    });
    scannedPixel.addPropertyListener("firmwareDate", () => {
      this.emitPropertyEvent("firmwareDate");
      this._updateIsDFUAvailable();
    });
    const props = [
      // TODO build this list from type
      "name",
      "rssi",
      "batteryLevel",
      "isCharging",
      "rollState",
      "currentFace",
    ] as (keyof PixelInfoNotifierMutableProps)[];
    props.forEach((p) =>
      scannedPixel.addPropertyListener(p, () => this.emitPropertyEvent(p))
    );
    props.forEach((p) =>
      this._pixel.addPropertyListener(p, () => this.emitPropertyEvent(p))
    );
    // Forward and monitor status
    this._pixel.addEventListener("status", (status) => {
      this._evEmitter.emit("status", status);
      if (status === "disconnected") {
        this._lastDiscoTime = Date.now();
      }
      this._updateLastActivity();
    });
    // Telemetry
    this._pixel.addMessageListener("telemetry", (msg) => {
      const telemetry = msg as Telemetry;
      const data = {
        accX: telemetry.accXTimes1000 / 1000,
        accY: telemetry.accYTimes1000 / 1000,
        accZ: telemetry.accZTimes1000 / 1000,
        faceConfidence: telemetry.faceConfidenceTimes1000 / 1000,
        timestamp: telemetry.time,
        rollState:
          getValueKeyName(telemetry.rollState, PixelRollStateValues) ??
          "unknown",
        faceIndex: telemetry.faceIndex,
        battery: telemetry.batteryLevelPercent,
        batteryState:
          getValueKeyName(telemetry.batteryState, PixelBatteryStateValues) ??
          "error",
        batteryControllerState:
          getValueKeyName(
            telemetry.batteryControllerState,
            PixelBatteryControllerStateValues
          ) ?? "unknown",
        voltage: telemetry.voltageTimes50 / 50,
        voltageCoil: telemetry.vCoilTimes50 / 50,
        rssi: telemetry.rssi,
        rssiChannelIndex: telemetry.channelIndex,
        mcuTemperature: telemetry.mcuTemperatureTimes100 / 100,
        batteryTemperature: telemetry.batteryTemperatureTimes100 / 100,
        internalChargeState: telemetry.internalChargeState,
        forceDisableChargingState: telemetry.forceDisableChargingState,
        ledCurrent: telemetry.ledCurrent,
      };
      this._telemetryData.push(data);
      this._evEmitter.emit("telemetry", data);
    });
    // Selected firmware
    this._updateIsDFUAvailable();
    store.subscribe(() => this._updateIsDFUAvailable());
    // Setup checking if around
    this._updateLastActivity();
  }

  addEventListener<K extends keyof PixelDispatcherEventMap>(
    eventName: K,
    listener: EventReceiver<PixelDispatcherEventMap[K]>
  ): void {
    this._evEmitter.addListener(eventName, listener);
  }

  removeEventListener<K extends keyof PixelDispatcherEventMap>(
    eventName: K,
    listener: EventReceiver<PixelDispatcherEventMap[K]>
  ): void {
    this._evEmitter.removeListener(eventName, listener);
  }

  dispatch<T extends PixelDispatcherActionName>(
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
        this._guard(this._reportRssi(), action);
        break;
      case "blink":
        this._guard(this._blink(), action);
        break;
      case "blinkId":
        this._guard(this._blinkId(), action);
        break;
      case "playAnimation":
        this._guard(
          this._playAnimation(params as EditAnimation) ??
            PrebuildAnimations.rainbow,
          action
        );
        break;
      case "playProfileAnimation":
        this._guard(this._playProfileAnimation(params as number) ?? 0, action);
        break;
      case "calibrate":
        this._guard(this._calibrate(), action);
        break;
      case "exitValidation":
        this._guard(this._exitValidationMode(), action);
        break;
      case "turnOff":
        this._guard(this._pixel.turnOff(), action);
        break;
      case "discharge":
        this._guard(this._discharge((params as number) ?? 50), action);
        break;
      case "enableCharging":
        this._guard(
          this._forceEnableCharging((params as boolean) ?? true),
          action
        );
        break;
      case "rename":
        this._guard(this._pixel.rename((params as string) ?? ""), action);
        break;
      case "uploadProfile":
        this._guard(
          this._uploadProfile((params as ProfileType) ?? "default"),
          action
        );
        break;
      case "reprogramDefaultBehavior":
        this._guard(this._reprogramDefaultBehavior(), action);
        break;
      case "resetAllSettings":
        this._guard(this._resetAllSettings(), action);
        break;
      case "queueDFU":
        this._queueDFU();
        break;
      case "dequeueDFU":
        this._dequeueDFU();
        break;
      default:
        assertNever(action);
    }
  }

  asNotifier(): PixelInfoNotifier {
    // TODO see if there is a better to do this type casting
    return this as unknown as PixelInfoNotifier;
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
    promise?.catch((error) =>
      this._evEmitter.emit(
        "error",
        new PixelDispatcherError(this, `Action ${action} failed`, error)
      )
    );
  }

  private _getPixelInfo(): PixelInfo {
    // TODO once disconnected, should return _pixel until _scannedPixel is updated
    return this.status === "disconnected" ? this._scannedPixel : this._pixel;
  }

  private _updateLastActivity(): void {
    // Cancel timeout
    if (this._updateLastActivityTimeout) {
      clearTimeout(this._updateLastActivityTimeout);
    }
    this._updateLastActivityTimeout = undefined;
    // Check if still around
    const last = Math.max(
      this._lastDiscoTime,
      this._scannedPixel.timestamp.getTime()
    );
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
    // Connect
    await this._pixel.connect();
    // Blink to show we're connected (but don't wait for the blink ack)
    this._pixel.blink(Color.dimBlue, { count: 2 }).catch(() => {});
  }

  private async _disconnect(): Promise<void> {
    // Blink to show we're disconnecting
    try {
      await this._pixel.blink(Color.dimCyan, { count: 3 });
    } catch {}
    // Disconnect
    await this._pixel.disconnect();
  }

  private async _reportRssi(): Promise<void> {
    await this._pixel.reportRssi(true);
  }

  private async _blink(): Promise<void> {
    await this._pixel.blink(Color.dimOrange);
  }

  private async _blinkId(): Promise<void> {
    await pixelBlinkId(this._pixel, { brightness: 0x04, loop: true });
  }

  private async _playAnimation(anim: EditAnimation): Promise<void> {
    this._evEmitter.emit("profileUploadProgress", 0);
    const editDataSet = new EditDataSet();
    editDataSet.animations.push(anim);
    try {
      await this._pixel.playTestAnimation(editDataSet.toDataSet(), (p) =>
        this._evEmitter.emit("profileUploadProgress", p)
      );
    } finally {
      this._evEmitter.emit("profileUploadProgress", undefined);
    }
  }

  private async _playProfileAnimation(animIndex: number): Promise<void> {
    await pixelPlayProfileAnimation(this.pixel, animIndex);
  }

  private async _calibrate(): Promise<void> {
    await this._pixel.startCalibration();
  }

  private async _discharge(current: number): Promise<void> {
    await pixelDischarge(this._pixel, current);
  }

  private async _forceEnableCharging(enable: boolean): Promise<void> {
    await pixelForceEnableCharging(this._pixel, enable);
  }

  private async _uploadProfile(type: ProfileType): Promise<void> {
    const notifyProgress = (p?: number) => {
      this._evEmitter.emit("profileUploadProgress", p);
    };
    try {
      this._isUpdatingProfile = true;
      notifyProgress(0);
      let dataSet: DataSet;
      switch (type) {
        case "default":
          dataSet = getDefaultProfile(getDieType(this._pixel.ledCount));
          break;
        case "tiny": {
          const profile = new EditProfile();
          profile.name = "test";
          profile.rules.push(
            new EditRule(
              new EditConditionFaceCompare({
                flags: FaceCompareFlagsValues.less,
                face: 21,
              }),
              {
                actions: [
                  new EditActionPlayAnimation({
                    animation: new EditAnimationRainbow({
                      duration: 1,
                      faces: 0xffff,
                      count: 1,
                    }),
                  }),
                ],
              }
            )
          );
          dataSet = createDataSetForProfile(profile).toDataSet();
          break;
        }
        default:
          assertNever(type);
      }
      await this._pixel.transferDataSet(dataSet, notifyProgress);
    } finally {
      this._isUpdatingProfile = false;
      notifyProgress(undefined);
    }
  }

  private _updateIsDFUAvailable() {
    const bundle = this._getSelectedDfuBundle();
    const av =
      !!bundle && !areSameFirmwareDates(bundle.date, this.firmwareDate);
    if (this._isDfuAvailable !== av) {
      this._isDfuAvailable = av;
      this._evEmitter.emit("hasAvailableDFU", av);
    }
  }

  private _getSelectedDfuBundle(): DfuFilesBundle | undefined {
    const dfuBundles = store.getState().dfuBundles;
    const serializedBundle = dfuBundles.available[dfuBundles.selected];
    if (serializedBundle) {
      return DfuFilesBundle.create(serializedBundle);
    }
  }

  private async _exitValidationMode(): Promise<void> {
    // Exit validation mode, don't wait for response as die will restart
    await this._pixel.sendMessage("exitValidation", true);
  }

  private async _reprogramDefaultBehavior(): Promise<void> {
    await pixelReprogramDefaultBehavior(this._pixel);
  }

  private async _resetAllSettings(): Promise<void> {
    await pixelResetAllSettings(this._pixel);
  }

  //
  // DFU
  //

  private _queueDFU(): void {
    if (this.hasAvailableDFU && !PixelDispatcher._pendingDFUs.includes(this)) {
      // Queue DFU request
      PixelDispatcher._pendingDFUs.push(this);
      this._evEmitter.emit("hasQueuedDFU", true);
      // Run update immediately if it's the only pending request
      if (!PixelDispatcher._activeDFU) {
        this._guard(this._startDFU(), "startDfu");
      } else {
        console.log(`DFU queued for Pixel ${this.name}`);
      }
    }
  }

  private _dequeueDFU(): void {
    const i = PixelDispatcher._pendingDFUs.indexOf(this);
    if (i >= 0) {
      PixelDispatcher._pendingDFUs.splice(i, 1);
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
      PixelDispatcher._activeDFU = this;
      this._evEmitter.emit("hasActiveDFU", true);
      await updateFirmware(
        this._scannedPixel,
        bundle.bootloader?.pathname,
        bundle.firmware?.pathname,
        (state) => this._evEmitter.emit("dfuState", state),
        (p) => this._evEmitter.emit("dfuProgress", p)
      );
    } finally {
      assert(PixelDispatcher._activeDFU === this);
      PixelDispatcher._activeDFU = undefined;
      this._evEmitter.emit("hasActiveDFU", false);
      // Run next update if any
      const pixel = PixelDispatcher._pendingDFUs[0];
      if (pixel) {
        pixel._guard(pixel._startDFU(), "startDfu");
      }
    }
  }
}

export default PixelDispatcher;
