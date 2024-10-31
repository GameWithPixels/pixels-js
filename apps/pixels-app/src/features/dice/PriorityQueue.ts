import {
  createTypedEventEmitter,
  EventReceiver,
} from "@systemic-games/pixels-core-utils";

import { logError } from "~/features/utils";

/**
 * Event map for {@link PriorityQueue} class.
 * This is the list of supported events where the property name
 * is the event name and the property type the event data type.
 */
export type PriorityQueueEventMap = Readonly<{
  queued: number;
  requeued: number;
  dequeued: number;
}>;

export class PriorityQueue {
  private readonly _evEmitter =
    createTypedEventEmitter<PriorityQueueEventMap>();

  // Note: we rely on the fact that the order of insertion is preserved
  private readonly _queues = { high: [] as number[], low: [] as number[] };

  get size(): number {
    return this._queues.high.length + this._queues.low.length;
  }

  // From lowest to highest priority
  get allIds(): number[] {
    return [...this._queues.low, ...this._queues.high];
  }

  get highPriorityIds(): number[] {
    return [...this._queues.high];
  }

  get lowPriorityIds(): number[] {
    return [...this._queues.low];
  }

  isHighPriority(id: number): boolean {
    return this._queues.high.includes(id);
  }

  isLowPriority(id: number): boolean {
    return this._queues.low.includes(id);
  }

  includes(id: number): boolean {
    return this._queues.high.includes(id) || this._queues.low.includes(id);
  }

  // Existing ids may be re-queued with a different priority
  queue(id: number, priority: "low" | "high"): void {
    const index = this._queues.high.indexOf(id);
    if (index >= 0) {
      // Item in "high" queue, update if switching queue
      if (priority !== "high" || this._queues.high.length !== index + 1) {
        this._queues.high.splice(index, 1);
        this._queues[priority].push(id);
      }
      // Always emit "change" event even if the order is the same
      this._emitEvent("requeued", id);
    } else {
      const index = this._queues.low.indexOf(id);
      if (index >= 0) {
        // Item in "low" queue, update if switching queue
        if (priority !== "low" || this._queues.low.length !== index + 1) {
          this._queues.low.splice(index, 1);
          this._queues[priority].push(id);
        }
        // Always emit "change" event even if the order is the same
        this._emitEvent("requeued", id);
      } else {
        this._queues[priority].push(id);
        this._emitEvent("queued", id);
      }
    }
  }

  dequeue(id: number): "low" | "high" | undefined {
    const index = this._queues.high.indexOf(id);
    if (index >= 0) {
      this._queues.high.splice(index, 1);
      this._emitEvent("dequeued", id);
      return "high";
    } else {
      const index = this._queues.low.indexOf(id);
      if (index >= 0) {
        this._queues.low.splice(index, 1);
        this._emitEvent("dequeued", id);
        return "low";
      }
    }
  }

  /**
   * Registers a listener function that will be called when the specified
   * event is raised.
   * See {@link PriorityQueueEventMap} for the list of events and their
   * associated data.
   * @param type A case-sensitive string representing the event type to listen for.
   * @param listener The callback function.
   */
  addListener<K extends keyof PriorityQueueEventMap>(
    type: K,
    listener: EventReceiver<PriorityQueueEventMap[K]>
  ): void {
    this._evEmitter.addListener(type, listener);
  }

  /**
   * Unregisters a listener from receiving events identified by
   * the given event name.
   * See {@link PriorityQueueEventMap} for the list of events and their
   * associated data.
   * @param type A case-sensitive string representing the event type.
   * @param listener The callback function to unregister.
   */
  removeListener<K extends keyof PriorityQueueEventMap>(
    type: K,
    listener: EventReceiver<PriorityQueueEventMap[K]>
  ): void {
    this._evEmitter.removeListener(type, listener);
  }

  /**
   * Removes all listeners, or those of the specified event type.
   * @param type A case-sensitive string representing the event type.
   */
  removeAllListeners<K extends keyof PriorityQueueEventMap>(type?: K): void {
    if (type === undefined) {
      this._evEmitter.removeAllListeners();
    } else {
      this._evEmitter.removeAllListeners(type);
    }
  }

  private _emitEvent<T extends keyof PriorityQueueEventMap>(
    name: T,
    ev: PriorityQueueEventMap[T]
  ): void {
    try {
      this._evEmitter.emit(name, ev);
    } catch (e) {
      logError(
        `PriorityQueue: Uncaught error in "${name}" event listener: ${e}`
      );
    }
  }
}
