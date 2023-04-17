import {
  PixelDesignAndColor,
  PixelInfoMutableProps,
  PixelInfoNotifier,
  PixelRollState,
} from "@systemic-games/pixels-core-connect";

import { ScannedPixel } from "./ScannedPixel";

type Mutable<T> = { -readonly [P in keyof T]: T[P] };

/** Type for an object with all the mutable props of {@link ScannedPixelNotifier}. */
export type ScannedPixelNotifierUpdate = Pick<
  ScannedPixel,
  PixelInfoMutableProps | "timestamp"
>;

/** Event map for {@link ScannedPixelNotifier} class. */
export type ScannedPixelNotifierEventMap = {
  [K in keyof ScannedPixelNotifierUpdate]: ScannedPixelNotifier;
};

/**
 * Wraps a {@link ScannedPixel} to raise events on mutable property changes.
 */
export abstract class ScannedPixelNotifier
  extends PixelInfoNotifier<
    keyof ScannedPixelNotifierUpdate,
    ScannedPixelNotifier
  >
  implements ScannedPixel
{
  private _data: Mutable<ScannedPixel>;

  // PixelInfo props
  get systemId(): string {
    return this._data.systemId;
  }
  get pixelId(): number {
    return this._data.pixelId;
  }
  get name(): string {
    return this._data.name;
  }
  get ledCount(): number {
    return this._data.ledCount;
  }
  get designAndColor(): PixelDesignAndColor {
    return this._data.designAndColor;
  }
  get firmwareDate(): Date {
    return this._data.firmwareDate;
  }
  get rssi(): number {
    return this._data.rssi;
  }
  get batteryLevel(): number {
    return this._data.batteryLevel;
  }
  get isCharging(): boolean {
    return this._data.isCharging;
  }
  get rollState(): PixelRollState {
    return this._data.rollState;
  }
  get currentFace(): number {
    return this._data.currentFace;
  }

  // Additional ScannedPixel props
  get address(): number {
    return this._data.address;
  }
  get timestamp(): Date {
    return this._data.timestamp;
  }

  /**
   * Instantiate a {@type ScannedPixelNotifier} with the properties
   * of a {@link ScannedPixel} object.
   */
  constructor(scannedPixel: ScannedPixel) {
    super();
    this._data = { ...scannedPixel };
  }

  /**
   * Update the mutable properties and raise the corresponding events.
   * @param props The new values for the properties to update.
   */
  protected _updateProperties(
    props: Partial<ScannedPixelNotifierUpdate>
  ): void {
    if (props.timestamp && this._data.timestamp < props.timestamp) {
      // TODO perform this update in a generic way
      // Timestamp first
      if (
        props.timestamp !== undefined &&
        this.timestamp.getTime() !== props.timestamp.getTime()
      ) {
        this._data.timestamp = props.timestamp;
        this.emitPropertyEvent("timestamp");
      }
      if (props.name !== undefined && this.name !== props.name) {
        this._data.name = props.name;
        this.emitPropertyEvent("name");
      }
      if (
        props.firmwareDate &&
        this.firmwareDate.getTime() !== props.firmwareDate.getTime()
      ) {
        this._data.firmwareDate = props.firmwareDate;
        this.emitPropertyEvent("firmwareDate");
      }
      if (props.rssi !== undefined && this.rssi !== props.rssi) {
        this._data.rssi = props.rssi;
        this.emitPropertyEvent("rssi");
      }
      if (
        props.batteryLevel !== undefined &&
        this.batteryLevel !== props.batteryLevel
      ) {
        this._data.batteryLevel = props.batteryLevel;
        this.emitPropertyEvent("batteryLevel");
      }
      if (
        props.isCharging !== undefined &&
        this.isCharging !== props.isCharging
      ) {
        this._data.isCharging = props.isCharging;
        this.emitPropertyEvent("isCharging");
      }
      if (props.rollState !== undefined && this.rollState !== props.rollState) {
        this._data.rollState = props.rollState;
        this.emitPropertyEvent("rollState");
      }
      if (
        props.currentFace !== undefined &&
        this.currentFace !== props.currentFace
      ) {
        this._data.currentFace = props.currentFace;
        this.emitPropertyEvent("currentFace");
      }
    }
  }
}
