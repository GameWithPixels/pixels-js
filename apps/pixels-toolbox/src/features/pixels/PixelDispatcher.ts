import {
  assert,
  assertNever,
  createTypedEventEmitter,
  EventReceiver,
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
  ScannedPixelNotifierMutableProps,
  MessageOrType,
  getMessageType,
  Telemetry,
  MessageTypeValues,
} from "@systemic-games/react-native-pixels-connect";
import RNFS from "react-native-fs";

import { getDieType } from "./DieType";
import { PrebuildAnimations } from "./PrebuildAnimations";
import {
  pixelBlinkId,
  pixelDischarge,
  pixelForceEnableCharging,
  pixelReprogramDefaultBehavior,
} from "./extensions";

import { store } from "~/app/store";
import DfuFilesBundle from "~/features/dfu/DfuFilesBundle";
import areSameFirmwareDates from "~/features/dfu/areSameFirmwareDates";
import updateFirmware from "~/features/dfu/updateFirmware";
import getDatedFilename from "~/features/files/getDatedFilename";
import getDefaultProfile from "~/features/pixels/getDefaultProfile";

export type ProfileType = "default" | "tiny";

export interface PixelDispatcherActionMap {
  connect: undefined;
  disconnect: undefined;
  reportRssi: undefined;
  blink: undefined;
  blinkId: undefined;
  playAnimation: EditAnimation;
  calibrate: undefined;
  uploadProfile: ProfileType;
  queueDFU: undefined;
  dequeueDFU: undefined;
  exitValidation: undefined;
  discharge: number;
  enableCharging: boolean;
  turnOff: undefined;
  rename: string;
  reprogramDefaultBehavior: undefined;
}

export type PixelDispatcherActionName = keyof PixelDispatcherActionMap;

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
  timestamp: number;
  rssi: number;
  battery: number;
  voltage: number;
};

const _instances = new Map<number, PixelDispatcher>();
let _activeDFU: PixelDispatcher | undefined;
const _pendingDFUs: PixelDispatcher[] = [];

/**
 * Helper class to dispatch commands to a Pixel and get notified on changes.
 */
class PixelDispatcher extends ScannedPixelNotifier<
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
    return _pendingDFUs.indexOf(this) > 0;
  }

  get hasActiveDFU(): boolean {
    return this === _activeDFU;
  }

  get telemetryData(): readonly TelemetryData[] {
    return this._telemetryData;
  }

  // TODO remove this member
  get pixel(): Pixel {
    return this._pixel;
  }

  static findInstance(pixelId: number) {
    return _instances.get(pixelId);
  }

  static getInstance(scannedPixel: ScannedPixelNotifier): PixelDispatcher {
    return (
      _instances.get(scannedPixel.pixelId) ?? new PixelDispatcher(scannedPixel)
    );
  }

  private constructor(scannedPixel: ScannedPixelNotifier) {
    super(scannedPixel);
    this._scannedPixel = scannedPixel;
    this._pixel = getPixel(scannedPixel);
    _instances.set(this.pixelId, this);
    // Log messages in file
    const filename = getDatedFilename(this.name);
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
      "name",
      "rssi",
      "batteryLevel",
      "isCharging",
      "rollState",
      "currentFace",
    ] as (keyof ScannedPixelNotifierMutableProps)[];
    props.forEach((p) =>
      scannedPixel.addPropertyListener(p, () => this.emitPropertyEvent(p))
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
        timestamp: Date.now(),
        rssi: telemetry.rssi,
        battery: telemetry.batteryLevelPercent,
        voltage: (telemetry.voltageTimes50 / 50) * 1000,
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
        this._guard(this._connect());
        break;
      case "disconnect":
        this._guard(this._disconnect());
        break;
      case "reportRssi":
        this._guard(this._reportRssi());
        break;
      case "blink":
        this._guard(this._blink());
        break;
      case "blinkId":
        this._guard(this._blinkId());
        break;
      case "playAnimation":
        this._guard(
          this._playAnimation(params as EditAnimation) ??
            PrebuildAnimations.rainbow
        );
        break;
      case "calibrate":
        this._guard(this._calibrate());
        break;
      case "discharge":
        this._guard(this._discharge((params as number) ?? 50));
        break;
      case "uploadProfile":
        this._guard(this._uploadProfile((params as ProfileType) ?? "default"));
        break;
      case "queueDFU":
        this._queueDFU();
        break;
      case "dequeueDFU":
        this._dequeueDFU();
        break;
      case "exitValidation":
        this._guard(this._exitValidationMode());
        break;
      case "enableCharging":
        this._guard(this._forceEnableCharging((params as boolean) ?? true));
        break;
      case "turnOff":
        this._guard(this._pixel.turnOff());
        break;
      case "rename":
        this._guard(this._pixel.rename((params as string) ?? ""));
        break;
      case "reprogramDefaultBehavior":
        this._guard(this._reprogramDefaultBehavior());
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

  private _guard(promise: Promise<unknown>): void {
    promise?.catch((error) => this._evEmitter.emit("error", error));
  }

  private _getPixelInfo(): PixelInfo {
    // TODO once disconnected, should return _pixel until _scannedPixel is updated
    return this.status === "disconnected" ? this._scannedPixel : this._pixel;
  }

  private _updateLastActivity(): void {
    // Cancel timeout
    clearTimeout(this._updateLastActivityTimeout);
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
    if (this.isReady) {
      await this._pixel.reportRssi(true);
    }
  }

  private async _blink(): Promise<void> {
    if (this.isReady) {
      await this._pixel.blink(Color.dimOrange);
    }
  }

  private async _blinkId(): Promise<void> {
    if (this.isReady) {
      await pixelBlinkId(this._pixel, { brightness: 0x04, loop: true });
    }
  }

  private async _playAnimation(anim: EditAnimation): Promise<void> {
    if (this.isReady) {
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
  }

  private async _calibrate(): Promise<void> {
    if (this.isReady) {
      await this._pixel.startCalibration();
    }
  }

  private async _discharge(current: number): Promise<void> {
    if (this.isReady) {
      await pixelDischarge(this._pixel, current);
    }
  }

  private async _forceEnableCharging(enable: boolean): Promise<void> {
    if (this.isReady) {
      await pixelForceEnableCharging(this._pixel, enable);
    }
  }

  private async _uploadProfile(type: ProfileType): Promise<void> {
    if (this.isReady) {
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

  private _queueDFU(): void {
    if (this.hasAvailableDFU && !_pendingDFUs.includes(this)) {
      // Queue DFU request
      _pendingDFUs.push(this);
      this._evEmitter.emit("hasQueuedDFU", true);
      // Run update immediately if it's the only pending request
      if (!_activeDFU) {
        this._guard(this._startDFU());
      } else {
        console.log(`DFU queued for Pixel ${this.name}`);
      }
    }
  }

  private _dequeueDFU(): void {
    const i = _pendingDFUs.indexOf(this);
    if (i >= 0) {
      _pendingDFUs.splice(i, 1);
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
      _activeDFU = this;
      this._evEmitter.emit("hasActiveDFU", true);
      await updateFirmware(
        this._scannedPixel.address,
        bundle.bootloader?.pathname,
        bundle.firmware?.pathname,
        (state) => this._evEmitter.emit("dfuState", state),
        (p) => this._evEmitter.emit("dfuProgress", p)
      );
    } finally {
      assert(_activeDFU === this);
      _activeDFU = undefined;
      this._evEmitter.emit("hasActiveDFU", false);
      // Run next update if any
      const pixel = _pendingDFUs[0];
      if (pixel) {
        pixel._guard(pixel._startDFU());
      }
    }
  }

  private async _exitValidationMode(): Promise<void> {
    if (this.isReady) {
      // Exit validation mode, don't wait for response as die will restart
      await this._pixel.sendMessage("exitValidation", true);
    }
  }

  private async _reprogramDefaultBehavior(): Promise<void> {
    if (this.isReady) {
      await pixelReprogramDefaultBehavior(this._pixel);
    }
  }
}

export default PixelDispatcher;
