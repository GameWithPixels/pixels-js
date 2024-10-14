import {
  PixelColorway,
  PixelDieType,
} from "@systemic-games/pixels-core-animation";
import {
  createTypedEventEmitter,
  EventReceiver,
} from "@systemic-games/pixels-core-utils";

import { PixelInfo } from "./PixelInfo";
import { PixelRollState } from "./PixelRollState";

/**
 * The mutable properties of {@link PixelInfoNotifier}.
 * @category Pixels
 */
export type PixelInfoNotifierMutableProps = Pick<
  PixelInfo,
  (typeof PixelInfoNotifier.MutablePropsList)[number]
>;

/**
 * Abstract implementation of {@link PixelInfo} type with the addition
 * of events that are emitted when mutable properties change.
 * The concrete implementation is responsible of calling the
 * {@link PixelInfoNotifier.emitPropertyEvent()} function when a property is mutated.
 * @category Pixels
 */
export abstract class PixelInfoNotifier<
  MutableProps extends
    PixelInfoNotifierMutableProps = PixelInfoNotifierMutableProps,
  Type extends PixelInfo = PixelInfo,
> implements PixelInfo
{
  static MutablePropsList: readonly (keyof PixelInfo)[] = [
    "name",
    "ledCount",
    "colorway",
    "dieType",
    "firmwareDate",
    "rssi",
    "batteryLevel",
    "isCharging",
    "rollState",
    "currentFace",
    "currentFaceIndex",
  ];

  private readonly _infoEvEmitter = createTypedEventEmitter<{
    [K in string & keyof MutableProps]: Type;
  }>();

  // Device type
  abstract type: "pixel" | "charger" | "bootloader"; // TODO also "charger" & "bootloader" until we have a separate class for ScannedChargerNotifier

  // It's a notifier object
  readonly isNotifier = true;

  abstract get systemId(): string;
  abstract get pixelId(): number;
  abstract get name(): string;
  abstract get ledCount(): number;
  abstract get colorway(): PixelColorway;
  abstract get dieType(): PixelDieType;
  abstract get firmwareDate(): Date;
  abstract get rssi(): number;
  abstract get batteryLevel(): number; // Percentage
  abstract get isCharging(): boolean;
  abstract get rollState(): PixelRollState;
  abstract get currentFace(): number; // Face value
  abstract get currentFaceIndex(): number;

  constructor() {
    // Increase the default limit of listeners to avoid warnings
    this._infoEvEmitter.setMaxListeners(50);
  }

  /**
   * Adds the given listener function for the specified property.
   * @param propertyName The name of the property.
   * @param listener The callback function.
   */
  addPropertyListener<K extends string & keyof MutableProps>(
    propertyName: K,
    listener: EventReceiver<Type>
  ): void {
    this._infoEvEmitter.addListener(propertyName, listener);
  }

  /**
   * Removes the given listener function for the specified property.
   * @param propertyName The name of the property.
   * @param listener The callback function to unregister.
   */
  removePropertyListener<K extends string & keyof MutableProps>(
    propertyName: K,
    listener: EventReceiver<Type>
  ): void {
    this._infoEvEmitter.removeListener(propertyName, listener);
  }

  /**
   * Emit a Pixel event for the specified property.
   * This function should be called by the concrete type whenever
   * the a property's value changes.
   * @param propertyName Event name.
   */
  protected emitPropertyEvent<K extends string & keyof MutableProps>(
    propertyName: K
  ): void {
    this._infoEvEmitter.emit(
      propertyName,
      //@ts-ignore 'this' is assignable to the constraint of type 'Type', but 'Type' could be instantiated with a different subtype of constraint 'PixelInfo'.ts(2345)
      this
    );
  }
}
