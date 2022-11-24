import { assertUnreachable } from "@systemic-games/pixels-core-utils";
import { DfuState } from "@systemic-games/react-native-nordic-nrf5-dfu";
import {
  Color,
  getPixel,
  IPixel,
  Pixel,
  PixelDesignAndColorNames,
  PixelRollStateNames,
  PixelStatus,
  ScannedPixel,
} from "@systemic-games/react-native-pixels-connect";
// TODO lift up to core
import createTypedEventEmitter, {
  EventReceiver,
} from "~/../../../packages/pixels-core-connect/src/createTypedEventEmitter";

import getDfuFileInfo from "../dfu/getDfuFileInfo";

import { store } from "~/app/store";
import updateFirmware from "~/features/dfu/updateFirmware";
import standardProfile from "~/standardProfile";

export type PixelDispatcherAction =
  | "connect"
  | "disconnect"
  | "blink"
  | "updateProfile"
  | "updateFirmware";

export interface PixelDispatcherEventMap {
  action: PixelDispatcherAction;
  error: Error;
  profileUpdateProgress: number | undefined;
  firmwareUpdateState: DfuState;
  firmwareUpdateProgress: number;
}

export default class PixelDispatcher implements IPixel {
  private _scannedPixel: ScannedPixel;
  private _pixel: Pixel;
  private readonly _evEmitter =
    createTypedEventEmitter<PixelDispatcherEventMap>();

  get systemId(): string {
    return this._activePixel().systemId;
  }

  get pixelId(): number {
    return this._activePixel().pixelId;
  }

  get name(): string {
    return this._activePixel().name;
  }

  get ledCount(): number {
    return this._activePixel().ledCount;
  }

  get designAndColor(): PixelDesignAndColorNames {
    return this._activePixel().designAndColor;
  }

  get firmwareDate(): Date {
    return this._activePixel().firmwareDate;
  }

  get rssi(): number {
    return this._activePixel().rssi;
  }

  get batteryLevel(): number {
    // TODO rounding shouldn't be needed
    return Math.round(this._activePixel().batteryLevel);
  }

  get isCharging(): boolean {
    return this._activePixel().isCharging;
  }

  get rollState(): PixelRollStateNames {
    return this._activePixel().rollState;
  }

  get currentFace(): number {
    return this._activePixel().currentFace;
  }

  get address(): number {
    return this._scannedPixel.address;
  }

  get status(): PixelStatus {
    return this._pixel.status;
  }

  // TODO remove this member
  get pixel(): Pixel {
    return this._pixel;
  }

  constructor(scannedPixel: ScannedPixel) {
    this._scannedPixel = scannedPixel;
    this._pixel = getPixel(scannedPixel);
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

  updateScannedPixel(scannedPixel: ScannedPixel) {
    if (this._scannedPixel.pixelId !== scannedPixel.pixelId) {
      throw new Error("Pixel id doesn't match");
    }
    this._scannedPixel = scannedPixel;
  }

  dispatch(action: PixelDispatcherAction) {
    const watch = (promise?: Promise<unknown>) =>
      promise?.catch((error) => this._evEmitter.emit("error", error));
    switch (action) {
      case "connect":
        watch(this._pixel.connect());
        break;
      case "disconnect":
        watch(this._pixel.disconnect());
        break;
      case "blink":
        watch(this._pixel.blink(Color.dimOrange));
        break;
      case "updateProfile":
        watch(this._updateProfile());
        break;
      case "updateFirmware":
        watch(this._updateFirmware());
        break;
      default:
        assertUnreachable(action);
    }
  }

  private _activePixel() {
    // TODO once disconnected, should return _pixel until _scannedPixel is updated
    return this.status === "disconnected" ? this._scannedPixel : this._pixel;
  }

  private async _updateProfile() {
    this._evEmitter.emit("profileUpdateProgress", 0);
    try {
      await this._pixel.transferDataSet(standardProfile, (p) =>
        this._evEmitter.emit("profileUpdateProgress", 100 * p)
      );
    } finally {
      this._evEmitter.emit("profileUpdateProgress", undefined);
    }
  }

  private async _updateFirmware() {
    const filesInfo = store.getState().dfuFiles.dfuFiles.map(getDfuFileInfo);
    const bootloader = filesInfo.filter((i) => i.type === "bootloader")[0];
    const firmware = filesInfo.filter((i) => i.type === "firmware")[0];
    await updateFirmware(
      this._scannedPixel.address,
      bootloader?.pathname,
      firmware?.pathname,
      (state) => this._evEmitter.emit("firmwareUpdateState", state),
      (progress) => this._evEmitter.emit("firmwareUpdateProgress", progress)
    );
  }
}
