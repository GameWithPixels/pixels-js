import {
  createTypedEventEmitter,
  EventReceiver,
} from "@systemic-games/pixels-core-utils";

import { PixelRollState, PixelDesignAndColor } from "./Messages";
import { PixelInfo } from "./PixelInfo";

/**
 * The mutable properties of {@link PixelInfoNotifier}.
 * @category Pixels
 */
export type PixelInfoNotifierMutableProps = Pick<
  PixelInfo,
  | "name"
  | "firmwareDate"
  | "rssi"
  | "batteryLevel"
  | "isCharging"
  | "rollState"
  | "currentFace"
>;

/**
 * Abstract implementation of {@link PixelInfo} type with the addition
 * of events that are emitted when mutable properties change.
 * The concrete implementation is responsible of calling the
 * {@link PixelInfoNotifier.emitPropertyEvent} function when a property is mutated.
 * @category Pixels
 */
export abstract class PixelInfoNotifier<
  MutableProps extends PixelInfoNotifierMutableProps = PixelInfoNotifierMutableProps,
  Type extends PixelInfo = PixelInfo
> implements PixelInfo
{
  private readonly _infoEvEmitter = createTypedEventEmitter<{
    [K in string & keyof MutableProps]: Type;
  }>();

  abstract get systemId(): string;
  abstract get pixelId(): number;
  abstract get name(): string;
  abstract get ledCount(): number;
  abstract get designAndColor(): PixelDesignAndColor;
  abstract get firmwareDate(): Date;
  abstract get rssi(): number;
  abstract get batteryLevel(): number; // Percentage
  abstract get isCharging(): boolean;
  abstract get rollState(): PixelRollState;
  abstract get currentFace(): number; // Face value (not index)

  /**
   * Adds the given listener function to the end of the listeners array
   * for the event with the given name.
   * See {@link PixelInfoEventMap} for the list of events and their associated
   * data.
   * @param eventName The name of the event.
   * @param listener The callback function.
   */
  addPropertyListener<K extends string & keyof MutableProps>(
    eventName: K,
    listener: EventReceiver<Type>
  ): void {
    this._infoEvEmitter.addListener(eventName, listener);
  }

  /**
   * Removes the specified listener function from the listener array
   * for the event with the given name.
   * See {@link PixelInfoEventMap} for the list of events and their associated
   * data.
   * @param eventName The name of the event.
   * @param listener The callback function to unregister.
   */
  removePropertyListener<K extends string & keyof MutableProps>(
    eventName: K,
    listener: EventReceiver<Type>
  ): void {
    this._infoEvEmitter.removeListener(eventName, listener);
  }

  /**
   * Emit a Pixel event. This function should be called by the concrete type
   * whenever the a property's value changes.
   * @param eventName Event name.
   * @param params Event parameters.
   */
  protected emitPropertyEvent<K extends string & keyof MutableProps>(
    eventName: K
  ): void {
    this._infoEvEmitter.emit(
      eventName,
      //@ts-ignore 'this' is assignable to the constraint of type 'Type', but 'Type' could be instantiated with a different subtype of constraint 'PixelInfo'.ts(2345)
      this
    );
  }
}
