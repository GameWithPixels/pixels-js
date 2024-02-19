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
  EditActionPlayAnimation,
  EditAnimation,
  EditAnimationRainbow,
  EditConditionFaceCompare,
  EditConditionHelloGoodbye,
  EditProfile,
  EditRule,
} from "@systemic-games/pixels-edit-animation";
import { DfuState } from "@systemic-games/react-native-nordic-nrf5-dfu";
import {
  Color,
  getPixel,
  Pixel,
  PixelColorway,
  PixelRollState,
  PixelStatus,
  PixelInfoNotifier,
  ScannedPixelNotifier,
  FaceCompareFlagsValues,
  DataSet,
  MessageOrType,
  getMessageType,
  Telemetry,
  MessageTypeValues,
  ScannedPixel,
  PixelDieType,
  HelloGoodbyeFlagsValues,
  ScannedPixelNotifierMutableProps,
  PixelInfo,
  PixelBatteryControllerMode,
  Constants,
} from "@systemic-games/react-native-pixels-connect";
import RNFS from "react-native-fs";

import { PixelDispatcherStatic as Static } from "./PixelDispatcherStatic";
import { PrebuildAnimations } from "./PrebuildAnimations";
import { TelemetryData, toTelemetryData } from "./TelemetryData";
import {
  pixelBlinkId,
  pixelDischarge,
  pixelSetBatteryControllerMode,
  pixelPlayProfileAnimation,
  pixelReprogramDefaultBehavior,
  pixelResetAllSettings,
  pixelStoreValue,
  PixelValueStoreType,
} from "./extensions";
import { getDefaultProfile } from "./getDefaultProfile";

import { store } from "~/app/store";
import DfuFilesBundle from "~/features/dfu/DfuFilesBundle";
import { areSameFirmwareDates } from "~/features/dfu/areSameFirmwareDates";
import { updateFirmware } from "~/features/dfu/updateFirmware";
import { getDatedFilename } from "~/features/files/getDatedFilename";

export const ProfileTypes = [
  "default",
  "tiny",
  "fixedRainbow",
  "fixedRainbowD4",
  "normals",
  "video",
  "waterfall",
  "waterfallRedGreen",
  "noise",
  "spin",
  "spiral",
  "redGreenSpinning",
] as const;

export type ProfileType = (typeof ProfileTypes)[number];
/**
 * Action map for {@link PixelDispatcher} class.
 * This is the list of supported actions where the property name
 * is the action name and the property type the action data type.
 */
export interface PixelDispatcherActionMap {
  connect: undefined;
  disconnect: undefined;
  reportRssi: undefined;
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
  uploadProfile: ProfileType;
  reprogramDefaultBehavior: undefined;
  resetAllSettings: undefined;
  queueDFU: undefined;
  dequeueDFU: undefined;
  setDieType: number;
}

/** List of possible DFU actions. */
export type DfuAction = "none" | "upgrade" | "downgrade";

/**
 * Event map for {@link PixelDispatcher} class.
 * This is the list of supported events where the property name
 * is the event name and the property type the event data type.
 */
export interface PixelDispatcherEventMap {
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
}

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
interface IPixelDispatcher extends ScannedPixel {
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
class PixelDispatcher
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

  static findDispatcher(pixelId: number) {
    return Static.instances.get(pixelId);
  }

  static getDispatcher(
    scannedPixel: ScannedPixelNotifier | ScannedPixel
  ): PixelDispatcher {
    // Assume we have a notifier and check flag
    // We don't use 'instanceof' as it doesn't work after a fast refresh (RN 71)
    const notifier = scannedPixel as ScannedPixelNotifier;
    return (
      Static.instances.get(scannedPixel.pixelId) ??
      new PixelDispatcher(
        notifier.isScannedPixelNotifier
          ? notifier
          : ScannedPixelNotifier.getInstance(scannedPixel)
      )
    );
  }

  private constructor(scannedPixel: ScannedPixelNotifier) {
    super(scannedPixel);
    this._info = {
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
      address: scannedPixel.address,
      timestamp: scannedPixel.timestamp,
    };
    this._pixel = getPixel(scannedPixel.systemId);
    Static.instances.set(this.pixelId, this);
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
    // Forward scanned pixel property events
    function copyProp<T, Key extends keyof T>(src: T, dst: T, key: Key) {
      dst[key] = src[key];
    }
    for (const prop of ScannedPixelNotifier.ExtendedMutablePropsList) {
      scannedPixel.addPropertyListener(prop, () => {
        copyProp(scannedPixel, this._info, prop);
        this.emitPropertyEvent(prop);
        if (prop === "timestamp") {
          this.emitPropertyEvent("lastScanUpdate");
          this._updateLastActivity();
        } else if (prop === "firmwareDate") {
          this._updateIsDFUAvailable();
        }
      });
    }
    // Forward pixel instance property events
    for (const prop of PixelInfoNotifier.MutablePropsList) {
      this._pixel.addPropertyListener(prop, () => {
        copyProp(this._pixel as PixelInfo, this._info, prop);
        this.emitPropertyEvent(prop);
      });
    }
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
      case "playMultiAnimations":
        this._guard(this._playMultiAnimations(), action);
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
      case "setChargerMode":
        this._guard(
          this._setChargerMode(
            (params as PixelBatteryControllerMode) ?? "default"
          ),
          action
        );
        break;
      case "rename":
        this._guard(this._pixel.rename((params as string) ?? "Pixel"), action);
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
      case "setDieType":
        this._guard(
          pixelStoreValue(
            this._pixel,
            PixelValueStoreType.DieType,
            params as number
          ),
          action
        );
        break;
      default:
        assertNever(action, `Unknown action ${action}`);
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
    const editDataSet = createDataSetForAnimation(anim);
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

  private async _playMultiAnimations(): Promise<void> {
    await this._playAnimation(PrebuildAnimations.rainbowAllFaces);
    await delay(6000);
    await this._playAnimation(PrebuildAnimations.rainbow);
    await delay(6000);
    await this._playAnimation(PrebuildAnimations.noise);
  }

  private async _calibrate(): Promise<void> {
    await this._pixel.startCalibration();
  }

  private async _discharge(current: number): Promise<void> {
    await pixelDischarge(this._pixel, current);
  }

  private async _setChargerMode(
    mode: PixelBatteryControllerMode
  ): Promise<void> {
    await pixelSetBatteryControllerMode(this._pixel, mode);
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
          dataSet = getDefaultProfile(this._pixel.dieType);
          break;
        case "fixedRainbow": {
          const profile = new EditProfile();
          profile.name = "fixedRainbow";
          profile.rules.push(
            new EditRule(
              new EditConditionHelloGoodbye({
                flags: HelloGoodbyeFlagsValues.hello,
              }),
              {
                actions: [
                  new EditActionPlayAnimation({
                    animation: PrebuildAnimations.fixedRainbow,
                  }),
                ],
              }
            )
          );
          dataSet = createDataSetForProfile(profile).toDataSet();
          break;
        }
        case "fixedRainbowD4": {
          const profile = new EditProfile();
          profile.name = "fixedRainbowD4";
          profile.rules.push(
            new EditRule(
              new EditConditionHelloGoodbye({
                flags: HelloGoodbyeFlagsValues.hello,
              }),
              {
                actions: [
                  new EditActionPlayAnimation({
                    animation: PrebuildAnimations.fixedRainbowD4,
                  }),
                ],
              }
            )
          );
          dataSet = createDataSetForProfile(profile).toDataSet();
          break;
        }
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
        case "normals": {
          const profile = new EditProfile();
          profile.name = "normals";
          profile.rules.push(
            new EditRule(
              new EditConditionHelloGoodbye({
                flags: HelloGoodbyeFlagsValues.hello,
              }),
              {
                actions: [
                  new EditActionPlayAnimation({
                    animation: PrebuildAnimations.pink_worm,
                  }),
                ],
              }
            )
          );
          dataSet = createDataSetForProfile(profile).toDataSet();
          break;
        }
        case "video": {
          const profile = new EditProfile();
          profile.name = "video";
          profile.rules.push(
            new EditRule(
              new EditConditionHelloGoodbye({
                flags: HelloGoodbyeFlagsValues.hello,
              }),
              {
                actions: [
                  new EditActionPlayAnimation({
                    animation: PrebuildAnimations.rainbow,
                  }),
                ],
              }
            )
          );
          profile.rules.push(
            new EditRule(
              new EditConditionFaceCompare({
                flags:
                  FaceCompareFlagsValues.greater | FaceCompareFlagsValues.equal,
                face: 1,
              }),
              {
                actions: [
                  new EditActionPlayAnimation({
                    animation: PrebuildAnimations.spiralUp,
                    face: Constants.currentFaceIndex,
                    loopCount: 1,
                  }),
                ],
              }
            )
          );
          dataSet = createDataSetForProfile(profile).toDataSet();
          break;
        }
        case "waterfall": {
          const profile = new EditProfile();
          profile.name = "video";
          profile.rules.push(
            new EditRule(
              new EditConditionHelloGoodbye({
                flags: HelloGoodbyeFlagsValues.hello,
              }),
              {
                actions: [
                  new EditActionPlayAnimation({
                    animation: PrebuildAnimations.rainbow,
                  }),
                ],
              }
            )
          );
          profile.rules.push(
            new EditRule(
              new EditConditionFaceCompare({
                flags:
                  FaceCompareFlagsValues.greater | FaceCompareFlagsValues.equal,
                face: 1,
              }),
              {
                actions: [
                  new EditActionPlayAnimation({
                    animation: PrebuildAnimations.waterfall,
                    face: Constants.currentFaceIndex,
                    loopCount: 1,
                  }),
                ],
              }
            )
          );
          dataSet = createDataSetForProfile(profile).toDataSet();
          break;
        }
        case "waterfallRedGreen": {
          const profile = new EditProfile();
          profile.name = "video";
          profile.rules.push(
            new EditRule(
              new EditConditionHelloGoodbye({
                flags: HelloGoodbyeFlagsValues.hello,
              }),
              {
                actions: [
                  new EditActionPlayAnimation({
                    animation: PrebuildAnimations.rainbow,
                  }),
                ],
              }
            )
          );
          profile.rules.push(
            new EditRule(
              new EditConditionFaceCompare({
                flags:
                  FaceCompareFlagsValues.greater | FaceCompareFlagsValues.equal,
                face: 1,
              }),
              {
                actions: [
                  new EditActionPlayAnimation({
                    animation: PrebuildAnimations.waterfallRedGreen,
                    face: Constants.currentFaceIndex,
                    loopCount: 1,
                  }),
                ],
              }
            )
          );
          dataSet = createDataSetForProfile(profile).toDataSet();
          break;
        }
        case "noise": {
          const profile = new EditProfile();
          profile.name = "video";
          profile.rules.push(
            new EditRule(
              new EditConditionHelloGoodbye({
                flags: HelloGoodbyeFlagsValues.hello,
              }),
              {
                actions: [
                  new EditActionPlayAnimation({
                    animation: PrebuildAnimations.rainbow,
                  }),
                ],
              }
            )
          );
          profile.rules.push(
            new EditRule(
              new EditConditionFaceCompare({
                flags:
                  FaceCompareFlagsValues.greater | FaceCompareFlagsValues.equal,
                face: 1,
              }),
              {
                actions: [
                  new EditActionPlayAnimation({
                    animation: PrebuildAnimations.noise,
                    face: Constants.currentFaceIndex,
                    loopCount: 1,
                  }),
                ],
              }
            )
          );
          dataSet = createDataSetForProfile(profile).toDataSet();
          break;
        }
        case "spin": {
          const profile = new EditProfile();
          profile.name = "video";
          profile.rules.push(
            new EditRule(
              new EditConditionHelloGoodbye({
                flags: HelloGoodbyeFlagsValues.hello,
              }),
              {
                actions: [
                  new EditActionPlayAnimation({
                    animation: PrebuildAnimations.rainbow,
                  }),
                ],
              }
            )
          );
          profile.rules.push(
            new EditRule(
              new EditConditionFaceCompare({
                flags:
                  FaceCompareFlagsValues.greater | FaceCompareFlagsValues.equal,
                face: 1,
              }),
              {
                actions: [
                  new EditActionPlayAnimation({
                    animation: PrebuildAnimations.spinning_rainbow,
                    face: Constants.currentFaceIndex,
                    loopCount: 1,
                  }),
                ],
              }
            )
          );
          dataSet = createDataSetForProfile(profile).toDataSet();
          break;
        }
        case "spiral": {
          const profile = new EditProfile();
          profile.name = "video";
          profile.rules.push(
            new EditRule(
              new EditConditionHelloGoodbye({
                flags: HelloGoodbyeFlagsValues.hello,
              }),
              {
                actions: [
                  new EditActionPlayAnimation({
                    animation: PrebuildAnimations.rainbow,
                  }),
                ],
              }
            )
          );
          profile.rules.push(
            new EditRule(
              new EditConditionFaceCompare({
                flags:
                  FaceCompareFlagsValues.greater | FaceCompareFlagsValues.equal,
                face: 1,
              }),
              {
                actions: [
                  new EditActionPlayAnimation({
                    animation: PrebuildAnimations.spiralUp,
                    face: Constants.currentFaceIndex,
                    loopCount: 1,
                  }),
                ],
              }
            )
          );
          dataSet = createDataSetForProfile(profile).toDataSet();
          break;
        }
        case "redGreenSpinning": {
          const profile = new EditProfile();
          profile.name = "video";
          profile.rules.push(
            new EditRule(
              new EditConditionHelloGoodbye({
                flags: HelloGoodbyeFlagsValues.hello,
              }),
              {
                actions: [
                  new EditActionPlayAnimation({
                    animation: PrebuildAnimations.rainbow,
                  }),
                ],
              }
            )
          );
          profile.rules.push(
            new EditRule(
              new EditConditionFaceCompare({
                flags:
                  FaceCompareFlagsValues.greater | FaceCompareFlagsValues.equal,
                face: 1,
              }),
              {
                actions: [
                  new EditActionPlayAnimation({
                    animation: PrebuildAnimations.spiralUp,
                    face: Constants.currentFaceIndex,
                    loopCount: 1,
                  }),
                ],
              }
            )
          );
          dataSet = createDataSetForProfile(profile).toDataSet();
          break;
        }
        default:
          assertNever(type, `Unknown profile ${type}`);
      }
      await this._pixel.transferDataSet(dataSet, notifyProgress);
    } finally {
      this._isUpdatingProfile = false;
      notifyProgress(undefined);
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
        pixel._guard(pixel._startDFU(), "startDfu");
      }
    }
  }
}

export default PixelDispatcher;
