import {
  assert,
  deserialize,
  SerializationError,
  serialize,
} from "@systemic-games/pixels-core-utils";

import { GenericPixelMessage, PixelMessage } from "./PixelMessage";

/**
 * Type representing a PixelMessage constructor.
 * @category Message
 */
export type MessageClass = new () => PixelMessage;

/**
 * Serialization helper for Pixels devices messages.
 * @category Message
 */
export class MessageSerializer<MessageType extends string> {
  readonly _messageTypeValues: Readonly<Map<MessageType, number>>;
  readonly _messageClasses: readonly MessageClass[];

  // Lookup table from message type value to message name
  readonly _messageNamesLookup: Readonly<MessageType[]> = [];

  // Lookup table from MessageClass to MessageType
  readonly _reverseMsgClassesLookup: Readonly<Map<MessageClass, number>> =
    new Map();

  // Lookup table from message type value to MessageClass
  readonly _messageClassesLookup: Readonly<Map<number, MessageClass>> =
    new Map();

  constructor(
    messageTypeValues: readonly [MessageType, number][],
    messageClasses: readonly MessageClass[]
  ) {
    this._messageTypeValues = new Map(messageTypeValues);
    this._messageClasses = messageClasses;
  }

  /**
   * Gets the type of the given message or message type value.
   * @param msgOrTypeOrClass A message or a message type value.
   * @returns The message type.
   * @category Message
   */
  getMessageTypeValue(
    msgOrTypeOrClass: PixelMessage | MessageType | MessageClass
  ): number {
    return typeof msgOrTypeOrClass === "function"
      ? this._getMessageTypeValue(msgOrTypeOrClass)
      : typeof msgOrTypeOrClass === "string"
        ? this._checkGetMessageTypeValue(msgOrTypeOrClass)
        : msgOrTypeOrClass.type;
  }

  /**
   * Get the message name (as listed in {@link MessageTypeValues}).
   * @param msgOrTypeOrTypeValue A message or a message type value
   *                             or the numerical value of a message type.
   * @returns The message name.
   * @category Message
   */
  getMessageType(
    msgOrTypeOrTypeValue: PixelMessage | MessageType | number
  ): MessageType {
    if (typeof msgOrTypeOrTypeValue === "string") {
      return msgOrTypeOrTypeValue;
    } else {
      const typeValue =
        typeof msgOrTypeOrTypeValue === "number"
          ? msgOrTypeOrTypeValue
          : msgOrTypeOrTypeValue.type;
      const type = this._getMessageNameFromValue(typeValue);
      if (type) {
        return type;
      }
      throw Error(
        `getMessageName: ${typeValue} is not a value in MessageTypeValues`
      );
    }
  }

  /**
   * Creates a message object for the given message type.
   * @param type Type of message.
   * @returns A PixelMessage object with the given message type.
   * @category Message
   */
  instantiateMessage(type: MessageType): PixelMessage {
    const typeValue = this._checkGetMessageTypeValue(type);
    const ctor = this._getMessageClass(typeValue);
    if (ctor) {
      return new ctor();
    } else {
      return new GenericPixelMessage(typeValue);
    }
  }

  /**
   * Serialize the given Pixel message.
   * @param msgOrTypeOrTypeValue A message or a message type value
   *                             or the numerical value of a message type.
   * @returns The serialized data.
   * @category Message
   */
  serialize(
    msgOrTypeOrTypeValue: PixelMessage | MessageType | number
  ): ArrayBuffer {
    if (typeof msgOrTypeOrTypeValue === "object") {
      const msg = msgOrTypeOrTypeValue;
      const [dataView] = serialize(msg);
      assert(dataView.byteLength > 0, "Got empty buffer from deserialization");
      assert(
        dataView.getUint8(0) === this.getMessageTypeValue(msg),
        `Unexpected message type, got ${dataView.getUint8(0)} ` +
          `instead of ${this.getMessageTypeValue(msg)}`
      );
      return dataView.buffer;
    } else {
      const typeValue =
        typeof msgOrTypeOrTypeValue === "number"
          ? msgOrTypeOrTypeValue
          : this._messageTypeValues.get(msgOrTypeOrTypeValue);
      assert(typeValue, `No Pixel message value for ${msgOrTypeOrTypeValue}`);
      return Uint8Array.of(typeValue);
    }
  }

  /**
   * Attempts to deserialize the data of the given buffer into a Pixel message.
   * @param dataView The data to deserialize the message from.
   * @returns The deserialized message or just its type value (for messages with no class).
   * @category Message
   */
  deserializeMessage(dataView: DataView): PixelMessage | MessageType {
    if (!dataView.byteLength) {
      throw new SerializationError("Can't deserialize an empty buffer");
    }
    const msgTypeValue = dataView.getUint8(0);
    if (dataView.byteLength === 1) {
      return this.getMessageType(msgTypeValue);
    } else {
      const msg = this.instantiateMessage(this.getMessageType(msgTypeValue));
      const bytesRead = deserialize(msg, dataView);
      if (bytesRead !== dataView.byteLength) {
        console.warn(
          `The last ${
            dataView.byteLength - bytesRead
          } bytes were not read while deserializing message of type ${msg.type}`
        );
      }
      assert(
        msg.type === msgTypeValue,
        `Incorrect message type after deserializing ${msg.type} but expecting ${msgTypeValue}`
      );
      return msg;
    }
  }

  private _getMessageNameFromValue(typeValue: number): MessageType | undefined {
    if (!this._messageNamesLookup.length) {
      const lookup = this._messageNamesLookup as MessageType[];
      for (const [key, value] of this._messageTypeValues) {
        lookup[value] = key as MessageType;
      }
    }
    return this._messageNamesLookup[typeValue];
  }

  private _getMessageTypeValue(msgClass: MessageClass): number {
    if (!this._reverseMsgClassesLookup) {
      const lookup = this._reverseMsgClassesLookup as Map<MessageClass, number>;
      for (const ctor of this._messageClasses) {
        lookup.set(ctor, new ctor().type);
      }
    }
    return (
      this._reverseMsgClassesLookup.get(msgClass) ?? 0 // none
    );
  }

  private _getMessageClass(msgTypeValue: number): MessageClass | undefined {
    if (!this._messageClassesLookup.size) {
      const lookup = this._messageClassesLookup as Map<number, MessageClass>;
      for (const ctor of this._messageClasses) {
        lookup.set(new ctor().type, ctor);
      }
    }
    return this._messageClassesLookup.get(msgTypeValue);
  }

  // Get message type value from message type
  private _checkGetMessageTypeValue(msgType: MessageType): number {
    const typeValue = this._messageTypeValues.get(msgType);
    assert(typeValue, `No Pixel message type value for ${msgType}`);
    return typeValue;
  }
}
