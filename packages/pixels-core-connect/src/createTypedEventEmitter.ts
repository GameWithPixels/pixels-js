import { EventEmitter } from "events";
// EventTarget in browsers

// https://rjzaworski.com/2019/10/event-emitters-in-typescript

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type EventMap = Record<string, any>;
export type EventKey<T extends EventMap> = string & keyof T;
export type EventReceiver<T> = (params: T) => void;

export interface TypedEventEmitter<T extends EventMap> {
  addListener<K extends EventKey<T>>(
    eventType: K,
    listener: EventReceiver<T[K]>
  ): void;
  removeListener<K extends EventKey<T>>(
    eventType: K,
    listener: EventReceiver<T[K]>
  ): void;
  emit<K extends EventKey<T>>(eventName: K, params: T[K]): void;
}

export default function createTypedEventEmitter<
  T extends EventMap
>(): TypedEventEmitter<T> {
  return new EventEmitter();
}
