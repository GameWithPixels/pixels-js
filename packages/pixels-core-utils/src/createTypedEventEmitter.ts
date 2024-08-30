import { EventEmitter } from "events";

export type EventMap = Readonly<Record<string, any>>;
export type EventKey<T extends EventMap> = string & keyof T;
export type EventReceiver<T> = (params: T) => void;

/**
 * Typed event emitter that works both for Web and React Native.
 * @typeParam
 */
export interface TypedEventEmitter<T extends EventMap> {
  /**
   * Adds the specified listener function to the end of the listeners array
   * for the event of the given type.
   * @param type A case-sensitive string representing the event type to listen for.
   * @param listener The callback function.
   * @returns A reference to the `EventEmitter`.
   */
  addListener<K extends EventKey<T>>(
    type: K,
    listener: EventReceiver<T[K]>
  ): this;

  /**
   * Removes the specified listener function from the listener array
   * for the event of the given type.
   * @param type A case-sensitive string representing the event type.
   * @param listener The callback function to unregister.
   * @returns A reference to the `EventEmitter`.
   */
  removeListener<K extends EventKey<T>>(
    type: K,
    listener: EventReceiver<T[K]>
  ): this;

  /**
   * Synchronously calls each of the listeners registered for the given
   * event type, in the order they were registered, passing the supplied
   * arguments.
   * @param type A case-sensitive string representing the event type.
   * @param params Optional parameters.
   * @returns Whether the event had listeners.
   */
  emit<K extends EventKey<T>>(type: K, params: T[K]): boolean;

  /**
   * Returns the number of listeners for the event of the given type.
   * @param type A case-sensitive string representing the event type.
   * @returns The number of listeners.
   */
  listenerCount<K extends EventKey<T>>(type: K): number;

  /**
   * Removes all listeners, or those of the specified event type.
   * @param type A case-sensitive string representing the event type.
   * @returns A reference to the `EventEmitter`.
   */
  removeAllListeners(type?: string | number): this;

  /**
   * By default `EventEmitter`s will print a warning if more than 10
   * listeners are added for a particular event.
   * Use this function to modify the default threshold.
   * @param n Number of listeners before printing a warning.
   *          The value can be set to`Infinity` (or `0`) to indicate
   *          an unlimited number of listeners.
   * @returns A reference to the `EventEmitter`.
   */
  setMaxListeners(n: number): this;

  /**
   * Gets the current max listener value for this `EventEmitter`.
   */
  getMaxListeners(): number;
}

/**
 * Returns a typed event emitter that works both for Web and React Native.
 * @see https://rjzaworski.com/2019/10/event-emitters-in-typescript
 * @returns A typed event emitter.
 */
export function createTypedEventEmitter<
  T extends EventMap,
>(): TypedEventEmitter<T> {
  return new EventEmitter();
}
