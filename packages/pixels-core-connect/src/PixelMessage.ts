import { serializable } from "@systemic-games/pixels-core-utils";

/**
 * Base type for all Pixel messages.
 * @remarks Messages that have no data don't require a class,
 * a {@link MessageTypeValues} is used instead.
 * @category Message
 */
export interface PixelMessage {
  /** Type of the message. */
  readonly type: number;
}

/**
 * Generic class representing any message without any data.
 * @category Message
 */
export class GenericPixelMessage implements PixelMessage {
  /** Type of the message. */
  @serializable(1)
  readonly type: number;

  constructor(type: number) {
    this.type = type;
  }
}
