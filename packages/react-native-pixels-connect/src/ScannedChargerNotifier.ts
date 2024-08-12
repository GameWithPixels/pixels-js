import {
  PixelColorway,
  PixelDieType,
} from "@systemic-games/pixels-core-animation";
import {
  PixelInfoNotifier,
  PixelInfoNotifierMutableProps,
  PixelRollState,
} from "@systemic-games/pixels-core-connect";
import { Mutable } from "@systemic-games/pixels-core-utils";

import { ScannedCharger } from "./ScannedCharger";
import { ScannedPixel } from "./ScannedPixel";
import { NotifiersMap } from "./static";

/** Type for an object with all the mutable props of {@link ScannedChargerNotifier}. */
export type ScannedChargerNotifierMutableProps = PixelInfoNotifierMutableProps &
  Pick<
    ScannedCharger,
    (typeof ScannedChargerNotifier.ExtendedMutablePropsList)[number]
  >;

/**
 * Wraps a {@link ScannedCharger} to raise events on mutable property changes.
 */
export class ScannedChargerNotifier<
    MutableProps extends
      ScannedChargerNotifierMutableProps = ScannedChargerNotifierMutableProps,
    Type extends ScannedPixel = ScannedPixel, // TODO ScannedCharger
  >
  extends PixelInfoNotifier<MutableProps, Type>
  implements ScannedCharger
{
  static ExtendedMutablePropsList: readonly (keyof ScannedCharger)[] = [
    "timestamp", // We want to update timestamp first
    "name",
    "ledCount",
    "firmwareDate",
    "rssi",
    "batteryLevel",
    "isCharging",
  ];

  private _data: Mutable<ScannedCharger>;

  // Device type
  readonly type = "charger";

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
    return "unknown";
  }
  get dieType(): PixelDieType {
    return "unknown";
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
    return "unknown";
  }
  get currentFace(): number {
    return 0;
  }
  get currentFaceIndex(): number {
    return 0;
  }

  // Additional ScannedCharger props
  get address(): number {
    return this._data.address;
  }
  get timestamp(): Date {
    return this._data.timestamp;
  }

  static findInstance(pixelId: number): ScannedChargerNotifier | undefined {
    const notifier = NotifiersMap.get(pixelId);
    return notifier?.type === "charger" ? notifier : undefined;
  }

  static getInstance(scannedCharger: ScannedCharger): ScannedChargerNotifier {
    const notifier = ScannedChargerNotifier.findInstance(
      scannedCharger.pixelId
    );
    if (notifier) {
      notifier.updateProperties(scannedCharger);
      return notifier;
    } else {
      const newNotifier = new ScannedChargerNotifier(scannedCharger);
      NotifiersMap.set(scannedCharger.pixelId, newNotifier);
      return newNotifier;
    }
  }

  /**
   * Instantiate a {@link ScannedChargerNotifier} with the properties
   * of a {@link ScannedCharger} object.
   */
  protected constructor(scannedPixel: ScannedCharger) {
    super();
    this._data = { ...scannedPixel };
  }

  /**
   * Update the mutable properties and raise the corresponding events.
   * @param props The new values for the properties to update.
   */
  updateProperties(props: Partial<ScannedChargerNotifierMutableProps>): void {
    if (props.timestamp && this._data.timestamp < props.timestamp) {
      // Timestamp first
      if (
        props.timestamp !== undefined &&
        this.timestamp.getTime() !== props.timestamp.getTime()
      ) {
        this._data.timestamp = new Date(props.timestamp.getTime());
        this.emitPropertyEvent("timestamp");
      }
      // Other props
      for (const prop of ScannedChargerNotifier.ExtendedMutablePropsList) {
        if (prop === "firmwareDate") {
          if (
            props.firmwareDate &&
            this.firmwareDate.getTime() !== props.firmwareDate.getTime()
          ) {
            this._data.firmwareDate = new Date(props.firmwareDate.getTime());
            this.emitPropertyEvent("firmwareDate");
          }
        } else {
          const value = props[prop];
          if (value !== undefined && this._data[prop] !== value) {
            // @ts-ignore TypeScript doesn't recognize that the prop is same on both side
            this._data[prop] = value;
            this.emitPropertyEvent(prop);
          }
        }
      }
    }
  }
}
