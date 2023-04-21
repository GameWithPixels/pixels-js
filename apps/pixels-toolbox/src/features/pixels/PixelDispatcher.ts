import {
  assert,
  assertNever,
  createTypedEventEmitter,
  EventReceiver,
} from "@systemic-games/pixels-core-utils";
import {
  EditAnimationRainbow,
  EditDataSet,
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
} from "@systemic-games/react-native-pixels-connect";

import { getDieType } from "./DieType";
import {
  pixelBlinkId,
  pixelDischarge,
  pixelForceEnableCharging,
} from "./extensions";

import { store } from "~/app/store";
import DfuFilesBundle from "~/features/dfu/DfuFilesBundle";
import areSameFirmwareDates from "~/features/dfu/areSameFirmwareDates";
import updateFirmware from "~/features/dfu/updateFirmware";
import getDefaultProfile from "~/getDefaultProfile";

namespace PixelDispatcher {
  export interface ActionMap {
    connect: undefined;
    disconnect: undefined;
    reportRssi: undefined;
    blink: undefined;
    blinkId: undefined;
    playRainbow: undefined;
    calibrate: undefined;
    updateProfile: undefined;
    queueDFU: undefined;
    dequeueDFU: undefined;
    exitValidation: undefined;
    discharge: number;
    enableCharging: boolean;
  }

  export type ActionName = keyof ActionMap;

  export interface EventMap {
    action: ActionName;
    error: Error;
    profileUpdateProgress: number | undefined;
    status: PixelStatus;
    durationSinceLastActivity: number;
    isDFUAvailable: boolean;
    isDFUActive: boolean;
    isDFUQueued: boolean;
    dfuState: DfuState;
    dfuProgress: number;
  }
}

const _instances = new Map<number, PixelDispatcher>();
const _pendingDFUs: PixelDispatcher[] = [];

/**
 * Helper class to dispatch commands to a Pixel and get notified on changes.
 */
class PixelDispatcher extends PixelInfoNotifier {
  private _scannedPixel: ScannedPixelNotifier;
  private _pixel: Pixel;
  private readonly _evEmitter =
    createTypedEventEmitter<PixelDispatcher.EventMap>();
  private _lastActivityMs = 0;
  private _updateLastActivityTimeout?: ReturnType<typeof setTimeout>;
  private _isUpdatingProfile = false;
  private _isDfuAvailable = false;

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

  get isDfuAvailable(): boolean {
    return this._isDfuAvailable;
  }

  get isDfuActive(): boolean {
    return _pendingDFUs[0] === this;
  }

  get isDfuQueued(): boolean {
    return _pendingDFUs.indexOf(this) > 0;
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
    super();
    this._scannedPixel = scannedPixel;
    this._pixel = getPixel(scannedPixel);
    _instances.set(this.pixelId, this);
    // TODO remove listeners
    // TODO perform these notification in a generic way
    scannedPixel.addPropertyListener("timestamp", () => {
      this._updateLastActivity();
    });
    scannedPixel.addPropertyListener("name", () =>
      this.emitPropertyEvent("name")
    );
    scannedPixel.addPropertyListener("firmwareDate", () => {
      this.emitPropertyEvent("firmwareDate");
      this._updateIsDFUAvailable();
    });
    scannedPixel.addPropertyListener("rssi", () =>
      this.emitPropertyEvent("rssi")
    );
    scannedPixel.addPropertyListener("batteryLevel", () =>
      this.emitPropertyEvent("batteryLevel")
    );
    scannedPixel.addPropertyListener("isCharging", () =>
      this.emitPropertyEvent("isCharging")
    );
    scannedPixel.addPropertyListener("rollState", () =>
      this.emitPropertyEvent("rollState")
    );
    scannedPixel.addPropertyListener("currentFace", () =>
      this.emitPropertyEvent("currentFace")
    );
    this._pixel.addEventListener("status", (status) => {
      this._evEmitter.emit("status", status);
      this._updateLastActivity();
    });
    // Selected firmware
    store.subscribe(() => this._updateIsDFUAvailable());
    // Setup checking if around
    this._updateLastActivity();
  }

  addEventListener<K extends keyof PixelDispatcher.EventMap>(
    eventName: K,
    listener: EventReceiver<PixelDispatcher.EventMap[K]>
  ): void {
    this._evEmitter.addListener(eventName, listener);
  }

  removeEventListener<K extends keyof PixelDispatcher.EventMap>(
    eventName: K,
    listener: EventReceiver<PixelDispatcher.EventMap[K]>
  ): void {
    this._evEmitter.removeListener(eventName, listener);
  }

  dispatch<T extends PixelDispatcher.ActionName>(
    action: T,
    params?: PixelDispatcher.ActionMap[T]
  ) {
    switch (action) {
      case "connect":
        this._guard(this._pixel.connect());
        break;
      case "disconnect":
        this._guard(this._pixel.disconnect());
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
      case "playRainbow":
        this._guard(this._playRainbow());
        break;
      case "calibrate":
        this._guard(this._calibrate());
        break;
      case "discharge":
        this._guard(this._discharge((params as number) ?? 50));
        break;
      case "updateProfile":
        this._guard(this._updateProfile());
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
        this._guard(this._forceEnableCharging((params as boolean) ?? false));
        break;
      default:
        assertNever(action);
    }
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
    const ms =
      this.status !== "disconnected"
        ? 0
        : Date.now() - this._scannedPixel.timestamp.getTime();
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
      await pixelBlinkId(this._pixel, { brightness: 0x10, loop: true });
    }
  }

  private async _playRainbow(): Promise<void> {
    if (this.isReady) {
      this._evEmitter.emit("profileUpdateProgress", 0);
      const editDataSet = new EditDataSet();
      editDataSet.animations.push(
        new EditAnimationRainbow({
          duration: 6,
          count: 3,
          fade: 0.5,
          traveling: true,
        })
      );
      try {
        await this._pixel.playTestAnimation(editDataSet.toDataSet(), (p) =>
          this._evEmitter.emit("profileUpdateProgress", p)
        );
      } finally {
        this._evEmitter.emit("profileUpdateProgress", undefined);
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

  private async _updateProfile(): Promise<void> {
    if (this.isReady) {
      const notifyProgress = (p?: number) => {
        this._evEmitter.emit("profileUpdateProgress", p);
      };
      try {
        this._isUpdatingProfile = true;
        notifyProgress(0);
        const profile = getDefaultProfile(getDieType(this._pixel.ledCount));
        await this._pixel.transferDataSet(profile, notifyProgress);
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
      this._evEmitter.emit("isDFUAvailable", av);
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
    if (this.isDfuAvailable && !_pendingDFUs.includes(this)) {
      // Queue DFU request
      _pendingDFUs.push(this);
      this._evEmitter.emit("isDFUQueued", true);
      // Run update immediately if it's the only pending request
      if (_pendingDFUs.length === 1) {
        this._guard(this._startDFU());
      }
    }
  }

  private _dequeueDFU(force = false): void {
    const i = _pendingDFUs.indexOf(this);
    if (i > 0 || force) {
      _pendingDFUs.splice(i);
      this._evEmitter.emit("isDFUQueued", false);
      // Run next update if any
      this._guard(_pendingDFUs[0]?._startDFU());
    } else if (i === 0) {
      // TODO abort ongoing DFU
    }
  }

  private async _startDFU(): Promise<void> {
    const bundle = this._getSelectedDfuBundle();
    if (bundle) {
      try {
        this._evEmitter.emit("isDFUActive", true);
        await updateFirmware(
          this._scannedPixel.address,
          bundle.bootloader?.pathname,
          bundle.firmware?.pathname,
          (state) => this._evEmitter.emit("dfuState", state),
          (p) => this._evEmitter.emit("dfuProgress", p)
        );
      } finally {
        assert(_pendingDFUs[0] === this, "Unexpected queued Pixel for DFU");
        this._dequeueDFU(true);
        this._evEmitter.emit("isDFUActive", false);
      }
    }
  }

  private async _exitValidationMode(): Promise<void> {
    if (this.isReady) {
      // Exit validation mode, don't wait for response as die will restart
      await this._pixel.sendMessage("exitValidation", true);
    }
  }
}

export default PixelDispatcher;
