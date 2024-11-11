import {
  PixelInfoNotifier,
  PixelInfoNotifierMutableProps,
  PixelRollState,
} from "@systemic-games/pixels-core-connect";
import { Mutable } from "@systemic-games/pixels-core-utils";
import {
  PixelColorway,
  PixelDieType,
} from "@systemic-games/pixels-edit-animation";

import { ScannedBootloader } from "./ScannedBootloader";
import { ScannedPixel } from "./ScannedPixel";
import { ScannedBootloaderNotifiersMap } from "./static";

/** Type for an object with all the mutable props of {@link ScannedBootloaderNotifier}. */
export type ScannedBootloaderNotifierMutableProps =
  PixelInfoNotifierMutableProps &
    Pick<
      ScannedBootloader,
      (typeof ScannedBootloaderNotifier.ExtendedMutablePropsList)[number]
    >;

/**
 * Wraps a {@link ScannedBootloader} to raise events on mutable property changes.
 */
export class ScannedBootloaderNotifier<
    MutableProps extends
      ScannedBootloaderNotifierMutableProps = ScannedBootloaderNotifierMutableProps,
    Type extends ScannedPixel = ScannedPixel, // TODO ScannedBootloader
  >
  extends PixelInfoNotifier<MutableProps, Type>
  implements ScannedBootloader
{
  static ExtendedMutablePropsList: readonly (keyof ScannedBootloader)[] = [
    "timestamp", // We want to update timestamp first
    "name",
    "rssi",
  ];

  private _data: Mutable<ScannedBootloader>;

  // Device type
  readonly type = "bootloader";

  get deviceType(): ScannedBootloader["deviceType"] {
    return this._data.deviceType;
  }

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
    return 0;
  }
  get colorway(): PixelColorway {
    return "unknown";
  }
  get dieType(): PixelDieType {
    return "unknown";
  }
  get firmwareDate(): Date {
    return new Date(0);
  }
  get rssi(): number {
    return this._data.rssi;
  }
  get batteryLevel(): number {
    return 0;
  }
  get isCharging(): boolean {
    return false;
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

  // Additional ScannedBootloader props
  get address(): number {
    return this._data.address;
  }
  get timestamp(): Date {
    return this._data.timestamp;
  }

  static findInstance(pixelId: number): ScannedBootloaderNotifier | undefined {
    const notifier = ScannedBootloaderNotifiersMap.get(pixelId);
    return notifier?.type === "bootloader" ? notifier : undefined;
  }

  static getInstance(
    ScannedBootloader: ScannedBootloader
  ): ScannedBootloaderNotifier {
    const notifier = ScannedBootloaderNotifier.findInstance(
      ScannedBootloader.pixelId
    );
    if (notifier) {
      notifier.updateProperties(ScannedBootloader);
      return notifier;
    } else {
      const newNotifier = new ScannedBootloaderNotifier(ScannedBootloader);
      ScannedBootloaderNotifiersMap.set(ScannedBootloader.pixelId, newNotifier);
      return newNotifier;
    }
  }

  /**
   * Instantiate a {@link ScannedBootloaderNotifier} with the properties
   * of a {@link ScannedBootloader} object.
   */
  protected constructor(scannedBootloader: ScannedBootloader) {
    super();
    this._data = { ...scannedBootloader };
  }

  /**
   * Update the mutable properties and raise the corresponding events.
   * @param props The new values for the properties to update.
   */
  updateProperties(
    props: Partial<ScannedBootloaderNotifierMutableProps>
  ): void {
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
      for (const prop of ScannedBootloaderNotifier.ExtendedMutablePropsList) {
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
