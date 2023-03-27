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
  IPixel,
  Pixel,
  PixelDesignAndColorNames,
  PixelRollStateNames,
  PixelStatus,
  PixelRollData,
  ScannedPixel,
  PixelBatteryData,
  MessageTypeValues,
} from "@systemic-games/react-native-pixels-connect";

import { getDieType } from "./DieType";
import getDfuFileInfo from "../dfu/getDfuFileInfo";

import { store } from "~/app/store";
import areSameFirmwareDates from "~/features/dfu/areSameFirmwareDates";
import updateFirmware from "~/features/dfu/updateFirmware";
import getDefaultProfile from "~/getDefaultProfile";

export type PixelDispatcherAction =
  | "connect"
  | "disconnect"
  | "reportRssi"
  | "blink"
  | "blinkId"
  | "playRainbow"
  | "calibrate"
  | "updateProfile"
  | "queueFirmwareUpdate"
  | "dequeueFirmwareUpdate"
  | "exitValidationMode"
  | "discharge"
  | "stopDischarge"
  | "enableCharging"
  | "disableCharging";

export interface PixelDispatcherEventMap {
  status: PixelStatus;
  rollState: PixelRollData;
  battery: PixelBatteryData;
  rssi: number;
  action: PixelDispatcherAction;
  error: Error;
  profileUpdateProgress: number | undefined;
  firmwareUpdateQueued: boolean;
  firmwareUpdateState: DfuState;
  firmwareUpdateProgress: number;
}

const _instances = new Map<number, PixelDispatcher>();
const _pendingDFUs: PixelDispatcher[] = [];

/**
 * Helper class to dispatch commands to a Pixel and get notified on changes.
 */
export default class PixelDispatcher implements IPixel {
  private _scannedPixel: ScannedPixel;
  private _lastBleActivity: Date;
  private _pixel: Pixel;
  private readonly _evEmitter =
    createTypedEventEmitter<PixelDispatcherEventMap>();
  private _isUpdatingProfile = false;

  get systemId(): string {
    return this._getIPixel().systemId;
  }

  get pixelId(): number {
    return this._scannedPixel.pixelId;
  }

  get name(): string {
    // TODO use Pixel instance name when connected, update code for other props too
    return this._scannedPixel.name;
  }

  get ledCount(): number {
    return this._getIPixel().ledCount;
  }

  get designAndColor(): PixelDesignAndColorNames {
    return this._getIPixel().designAndColor;
  }

  get firmwareDate(): Date {
    return this._getIPixel().firmwareDate;
  }

  get rssi(): number {
    return this._getIPixel().rssi;
  }

  get batteryLevel(): number {
    return this._getIPixel().batteryLevel;
  }

  get isCharging(): boolean {
    return this._getIPixel().isCharging;
  }

  get rollState(): PixelRollStateNames {
    return this._getIPixel().rollState;
  }

  get currentFace(): number {
    return this._getIPixel().currentFace;
  }

  get address(): number {
    return this._scannedPixel.address;
  }

  get lastBleActivity(): Date {
    return this._lastBleActivity;
  }

  get status(): PixelStatus {
    return this._pixel.status;
  }

  get isReady(): boolean {
    return this._pixel.status === "ready";
  }

  get isUpdatingProfile(): boolean {
    return this._isUpdatingProfile;
  }

  get canUpdateFirmware(): boolean {
    const dfuFiles = this._getDfuFiles();
    return (
      dfuFiles.length > 0 &&
      !areSameFirmwareDates(getDfuFileInfo(dfuFiles[0]).date, this.firmwareDate)
    );
  }

  get isUpdatingFirmware(): boolean {
    return _pendingDFUs[0] === this;
  }

  get isFirmwareUpdateQueued(): boolean {
    return _pendingDFUs.indexOf(this) > 0;
  }

  // TODO remove this member
  get pixel(): Pixel {
    return this._pixel;
  }

  static findInstance(pixelId: number) {
    return _instances.get(pixelId);
  }

  constructor(scannedPixel: ScannedPixel) {
    this._scannedPixel = scannedPixel;
    this._lastBleActivity = new Date();
    this._pixel = getPixel(scannedPixel);
    // TODO remove listeners
    this._pixel.addEventListener("status", (status) => {
      this._lastBleActivity = new Date();
      this._evEmitter.emit("status", status);
    });
    this._pixel.addEventListener("rollState", (state) =>
      this._evEmitter.emit("rollState", state)
    );
    this._pixel.addEventListener("battery", (state) =>
      this._evEmitter.emit("battery", state)
    );
    this._pixel.addEventListener("rssi", (rssi) =>
      this._evEmitter.emit("rssi", rssi)
    );
    _instances.set(this.pixelId, this);
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

  updateScannedPixel(scannedPixel: ScannedPixel): boolean {
    if (this._scannedPixel === scannedPixel) {
      return false;
    } else {
      if (this.pixelId !== scannedPixel.pixelId) {
        throw new Error("Pixel id doesn't match");
      }
      this._scannedPixel = scannedPixel;
      this._lastBleActivity = new Date();
      return true;
    }
  }

  dispatch(action: PixelDispatcherAction) {
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
        this._guard(this._discharge(50));
        break;
      case "stopDischarge":
        this._guard(this._discharge(0));
        break;
      case "updateProfile":
        this._guard(this._updateProfile());
        break;
      case "queueFirmwareUpdate":
        this._queueFirmwareUpdate();
        break;
      case "dequeueFirmwareUpdate":
        this._dequeueFirmwareUpdate();
        break;
      case "exitValidationMode":
        this._guard(this._exitValidationMode());
        break;
      case "enableCharging":
        this._guard(this._forceEnableCharging(true));
        break;
      case "disableCharging":
        this._guard(this._forceEnableCharging(false));
        break;
      default:
        assertNever(action);
    }
  }

  private _guard(promise: Promise<unknown>): void {
    promise?.catch((error) => this._evEmitter.emit("error", error));
  }

  private _getIPixel(): IPixel {
    // TODO once disconnected, should return _pixel until _scannedPixel is updated
    return this.status === "disconnected" ? this._scannedPixel : this._pixel;
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
      await this._pixel.blinkId({ brightness: 0x10, loop: true });
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

  private async _discharge(currentMA: number): Promise<void> {
    if (this.isReady) {
      await this._pixel.discharge(currentMA);
    }
  }

  private async _forceEnableCharging(enable: boolean): Promise<void> {
    if (this.isReady) {
      await this._pixel.forceEnableCharging(enable);
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

  private _getDfuFiles(): string[] {
    return store.getState().dfuFiles.dfuFiles;
  }

  private _queueFirmwareUpdate(): void {
    if (this.canUpdateFirmware && !_pendingDFUs.includes(this)) {
      // Queue DFU request
      _pendingDFUs.push(this);
      this._evEmitter.emit("firmwareUpdateQueued", true);
      // Run update immediately if it's the only pending request
      if (_pendingDFUs.length === 1) {
        this._guard(this._updateFirmware());
      }
    }
  }

  private _dequeueFirmwareUpdate(force = false): void {
    const i = _pendingDFUs.indexOf(this);
    if (i > 0 || force) {
      _pendingDFUs.splice(i);
      this._evEmitter.emit("firmwareUpdateQueued", false);
      // Run next update if any
      this._guard(_pendingDFUs[0]?._updateFirmware());
    } else if (i === 0) {
      // TODO abort ongoing DFU
    }
  }

  private async _updateFirmware(): Promise<void> {
    const filesInfo = this._getDfuFiles().map(getDfuFileInfo);
    const bootloader = filesInfo.filter((i) => i.type === "bootloader")[0];
    const firmware = filesInfo.filter((i) => i.type === "firmware")[0];
    try {
      await updateFirmware(
        this._scannedPixel.address,
        bootloader?.pathname,
        firmware?.pathname,
        (state) => this._evEmitter.emit("firmwareUpdateState", state),
        (p) => this._evEmitter.emit("firmwareUpdateProgress", p)
      );
    } finally {
      assert(_pendingDFUs[0] === this, "Unexpected queued Pixel for DFU");
      this._dequeueFirmwareUpdate(true);
    }
  }

  private async _exitValidationMode(): Promise<void> {
    if (this.isReady) {
      // Exit validation mode, don't wait for response as die will restart
      await this._pixel.sendMessage(MessageTypeValues.exitValidation, true);
    }
  }
}
