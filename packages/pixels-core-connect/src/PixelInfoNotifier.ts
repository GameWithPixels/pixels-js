import {
  createTypedEventEmitter,
  EventReceiver,
} from "@systemic-games/pixels-core-utils";

import { PixelRollState, PixelDesignAndColor } from "./Messages";
import { PixelInfo } from "./PixelInfo";

/**
 * The mutable properties of  {@link PixelInfo}.
 * @category Pixel
 */
export type PixelInfoMutableProperties = Exclude<
  keyof PixelInfo,
  "systemId" | "pixelId" | "ledCount" | "designAndColor" | "ledCount"
>;

/**
 * Event map for {@link PixelInfoNotifier} class.
 * @category Pixel
 */
export type PixelInfoEventMap = {
  [K in PixelInfoMutableProperties]: PixelInfoNotifier;
};

/**
 * Abstract implementation of {@link PixelInfo} type with the addition
 * of events that are emitted when mutable properties change.
 * The concrete implementation is responsible of calling the
 * {@link PixelInfoNotifier.emitPropertyEvent} function when a property is mutated.
 * @category Pixel
 */
export abstract class PixelInfoNotifier implements PixelInfo {
  private readonly _infoEvEmitter =
    createTypedEventEmitter<PixelInfoEventMap>();

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
  addPropertyListener<K extends keyof PixelInfoEventMap>(
    eventName: K,
    listener: EventReceiver<PixelInfoEventMap[K]>
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
  removePropertyListener<K extends keyof PixelInfoEventMap>(
    eventName: K,
    listener: EventReceiver<PixelInfoEventMap[K]>
  ): void {
    this._infoEvEmitter.removeListener(eventName, listener);
  }

  /**
   * Emit a Pixel event. This function should be called by the concrete type
   * whenever the a property's value changes.
   * @param eventName Event name.
   * @param params Event parameters.
   */
  protected emitPropertyEvent<K extends keyof PixelInfoEventMap>(
    eventName: K
  ): void {
    this._infoEvEmitter.emit(eventName, this);
  }
}
