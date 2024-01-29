import { PixelDieType } from "@systemic-games/pixels-core-animation";
import {
  PixelColorway,
  PixelInfoNotifier,
  PixelInfoNotifierMutableProps,
  PixelRollState,
} from "@systemic-games/pixels-core-connect";
import { Mutable } from "@systemic-games/pixels-core-utils";

import { ScannedPixel } from "./ScannedPixel";
import { ScannedPixelNotifiersMap as instancesMap } from "./ScannedPixelNotifiersMap";

/** Type for an object with all the mutable props of {@link ScannedPixelNotifier}. */
export type ScannedPixelNotifierMutableProps = PixelInfoNotifierMutableProps &
  Pick<
    ScannedPixel,
    (typeof ScannedPixelNotifier.ExtendedMutablePropsList)[number]
  >;

/**
 * Wraps a {@link ScannedPixel} to raise events on mutable property changes.
 */
export class ScannedPixelNotifier<
    MutableProps extends ScannedPixelNotifierMutableProps = ScannedPixelNotifierMutableProps,
    Type extends ScannedPixel = ScannedPixel
  >
  extends PixelInfoNotifier<MutableProps, Type>
  implements ScannedPixel
{
  static ExtendedMutablePropsList: readonly (keyof ScannedPixel)[] = [
    "timestamp", // We want to update timestamp first
    ...PixelInfoNotifier.MutablePropsList,
  ];

  private _data: Mutable<ScannedPixel>;

  // Use flag to identify instances of ScannedPixelNotifier
  // as instanceof doesn't work after a fast refresh (RN 71)
  readonly isScannedPixelNotifier = true;

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
  get colorway(): PixelColorway {
    return this._data.colorway;
  }
  get dieType(): PixelDieType {
    return this._data.dieType;
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

  static findInstance(pixelId: number): ScannedPixelNotifier | undefined {
    return instancesMap.get(pixelId);
  }

  static getInstance(scannedPixel: ScannedPixel): ScannedPixelNotifier {
    const notifier = instancesMap.get(scannedPixel.pixelId);
    if (notifier) {
      notifier.updateProperties(scannedPixel);
      return notifier;
    } else {
      const newNotifier = new ScannedPixelNotifier(scannedPixel);
      instancesMap.set(scannedPixel.pixelId, newNotifier);
      return newNotifier;
    }
  }

  /**
   * Instantiate a {@type ScannedPixelNotifier} with the properties
   * of a {@link ScannedPixel} object.
   */
  protected constructor(scannedPixel: ScannedPixel) {
    super();
    this._data = { ...scannedPixel };
  }

  /**
   * Update the mutable properties and raise the corresponding events.
   * @param props The new values for the properties to update.
   */
  updateProperties(props: Partial<ScannedPixelNotifierMutableProps>): void {
    if (props.timestamp && this._data.timestamp < props.timestamp) {
      // Timestamp first
      if (
        props.timestamp !== undefined &&
        this.timestamp.getTime() !== props.timestamp.getTime()
      ) {
        this._data.timestamp = props.timestamp;
        this.emitPropertyEvent("timestamp");
      }
      for (const prop of ScannedPixelNotifier.ExtendedMutablePropsList) {
        if (
          prop === "firmwareDate" &&
          props.firmwareDate &&
          this.firmwareDate.getTime() !== props.firmwareDate.getTime()
        ) {
          this._data.firmwareDate = props.firmwareDate;
          this.emitPropertyEvent("firmwareDate");
        } else {
          const value = props[prop];
          if (value !== undefined)
            // @ts-ignore TypeScript doesn't recognize that the prop is same on both side
            this._data[prop] = value;
          this.emitPropertyEvent(prop);
        }
      }
    }
  }
}
