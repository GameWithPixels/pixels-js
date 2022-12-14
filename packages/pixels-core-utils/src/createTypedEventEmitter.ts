import { EventEmitter } from "events";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type EventMap = Record<string, any>;
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
   * @param eventType The type of the event.
   * @param listener The callback function.
   */
  addListener<K extends EventKey<T>>(
    eventType: K,
    listener: EventReceiver<T[K]>
  ): void;
  /**
   * Removes the specified listener function from the listener array
   * for the event of the given type.
   * @param eventType The type of the event.
   * @param listener The callback function to unregister.
   */
  removeListener<K extends EventKey<T>>(
    eventType: K,
    listener: EventReceiver<T[K]>
  ): void;
  /**
   * Synchronously calls each of the listeners registered for the event named`eventName`, in the order they were registered, passing the supplied arguments
   * with the given name.
   * @param eventName The name of the event.
   * @param params Optional parameters.
   */
  emit<K extends EventKey<T>>(eventName: K, params: T[K]): void;
}

/**
 * Returns a typed event emitter that works both for Web and React Native.
 * @see https://rjzaworski.com/2019/10/event-emitters-in-typescript
 * @returns A typed event emitter.
 */
export default function createTypedEventEmitter<
  T extends EventMap
>(): TypedEventEmitter<T> {
  return new EventEmitter();
}
