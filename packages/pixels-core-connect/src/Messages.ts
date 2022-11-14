import {
  assert,
  enumValue,
  deserialize,
  serializable,
  SerializationError,
  serialize,
} from "@systemic-games/pixels-core-utils";

import Constants from "./Constants";

/**
 * Lists all the Pixel dice message types.
 * The value is used for the first byte of data in a Pixel message to identify it's type.
 * These message identifiers have to match up with the ones on the firmware.
 * @enum
 */
export const MessageTypeValues = {
  none: enumValue(0),
  whoAreYou: enumValue(),
  iAmADie: enumValue(),
  rollState: enumValue(),
  telemetry: enumValue(),
  bulkSetup: enumValue(),
  bulkSetupAck: enumValue(),
  bulkData: enumValue(),
  bulkDataAck: enumValue(),
  transferAnimationSet: enumValue(),
  transferAnimationSetAck: enumValue(),
  transferAnimationSetFinished: enumValue(),
  transferSettings: enumValue(),
  transferSettingsAck: enumValue(),
  transferSettingsFinished: enumValue(),
  transferTestAnimationSet: enumValue(),
  transferTestAnimationSetAck: enumValue(),
  transferTestAnimationSetFinished: enumValue(),
  debugLog: enumValue(),
  playAnimation: enumValue(),
  playAnimationEvent: enumValue(),
  stopAnimation: enumValue(),
  playSound: enumValue(),
  requestRollState: enumValue(),
  requestAnimationSet: enumValue(),
  requestSettings: enumValue(),
  requestTelemetry: enumValue(),
  programDefaultAnimationSet: enumValue(),
  programDefaultAnimationSetFinished: enumValue(),
  blink: enumValue(),
  blinkFinished: enumValue(),
  requestDefaultAnimationSetColor: enumValue(),
  defaultAnimationSetColor: enumValue(),
  requestBatteryLevel: enumValue(),
  batteryLevel: enumValue(),
  requestRssi: enumValue(),
  rssi: enumValue(),
  calibrate: enumValue(),
  calibrateFace: enumValue(),
  notifyUser: enumValue(),
  notifyUserAck: enumValue(),
  testHardware: enumValue(),
  testLedLoopback: enumValue(),
  ledLoopback: enumValue(),
  setTopLevelState: enumValue(),
  programDefaultParameters: enumValue(),
  programDefaultParametersFinished: enumValue(),
  setDesignAndColor: enumValue(),
  setDesignAndColorAck: enumValue(),
  setCurrentBehavior: enumValue(),
  setCurrentBehaviorAck: enumValue(),
  setName: enumValue(),
  setNameAck: enumValue(),
  sleep: enumValue(),
  exitValidation: enumValue(),
  transferInstantAnimationSet: enumValue(),
  transferInstantAnimationSetAck: enumValue(),
  transferInstantAnimationSetFinished: enumValue(),
  playInstantAnimation: enumValue(),
  stopAllAnimations: enumValue(),

  // Testing
  testBulkSend: enumValue(),
  testBulkReceive: enumValue(),
  setAllLedsToColor: enumValue(),
  attractMode: enumValue(),
  printNormals: enumValue(),
  printA2DReadings: enumValue(),
  lightUpFace: enumValue(),
  setLedToColor: enumValue(),
  debugAnimationController: enumValue(),
} as const;

/** The "enum" type for {@link MessageTypeValues}. */
export type MessageType =
  typeof MessageTypeValues[keyof typeof MessageTypeValues];

/**
 * Base type for all Pixels messages.
 * Note: messages that have no specific data don't require a class,
 * a {@link MessageTypeValue} is used instead.
 */
export interface PixelMessage {
  /** Type of the message. */
  readonly type: MessageType;
}

/**
 * Union type of {@link PixelMessage} and {@link MessageType} types.
 * Messages without parameter have no {@link PixelMessage} class to represent them,
 * instead they are represent by the corresponding {@link MessageTypeValue}.
 */
export type MessageOrType = PixelMessage | MessageType;

/**
 * Type representing a PixelMessage constructor.
 */
export type MessageClass = new () => PixelMessage;

// Lookup table from MessageType to MessageClass
let _messageClassesLookup: Readonly<Map<MessageType, MessageClass>>;
function _getMessageClass(msgType: MessageType): MessageClass | undefined {
  if (!_messageClassesLookup) {
    _messageClassesLookup = new Map(
      _getMessageClasses().map((m) => [new m().type, m])
    );
  }
  return _messageClassesLookup.get(msgType);
}

// Lookup table from MessageClass to MessageType
let _reverseMessageClassesLookup: Readonly<Map<MessageClass, MessageType>>;
function _getMessageClassType(msgClass: MessageClass): MessageType {
  if (!_reverseMessageClassesLookup) {
    _reverseMessageClassesLookup = new Map(
      _getMessageClasses().map((m) => [m, new m().type])
    );
  }
  return _reverseMessageClassesLookup.get(msgClass) ?? MessageTypeValues.none;
}

/**
 * Gets the type of the given message or message type value.
 * @param msgOrTypeOrClass A message or a message type value.
 * @returns The message type.
 */
export function getMessageType(
  msgOrTypeOrClass: MessageOrType | MessageClass
): MessageType {
  return typeof msgOrTypeOrClass === "function"
    ? _getMessageClassType(msgOrTypeOrClass)
    : typeof msgOrTypeOrClass === "number"
    ? msgOrTypeOrClass
    : msgOrTypeOrClass.type;
}

/**
 * Type predicate for {@link PixelMessage} class.
 * @param obj Any object.
 * @returns Whether the given object is a {@link PixelMessage}.
 */
export function isMessage(obj: unknown): obj is PixelMessage {
  return (obj as PixelMessage).type !== undefined;
}

/**
 * Get the message name (as listed in {@link MessageTypeValues}).
 * @param msgOrType A message or a message type value.
 * @returns The message name.
 */
export function getMessageName(
  msgOrType: MessageOrType
): keyof typeof MessageTypeValues {
  const msgType = getMessageType(msgOrType);
  for (const [key, value] of Object.entries(MessageTypeValues)) {
    if (value === msgType) {
      return key as keyof typeof MessageTypeValues;
    }
  }
  throw Error(`${msgType} is not a value in ${MessageTypeValues}`);
}

/**
 * Creates a message object for the given message type.
 * @param type Type of message.
 * @returns A PixelMessage object with the given message type.
 */
export function instantiateMessage(type: MessageType): PixelMessage {
  const ctor = _getMessageClass(type);
  if (ctor) {
    return new ctor();
  } else {
    return new GenericPixelMessage(type);
  }
}

/**
 * Serialize the given Pixel message.
 * @param msgOrType A message or a message type value.
 * @returns The serialized data.
 */
export function serializeMessage(msgOrType: MessageOrType): ArrayBuffer {
  if (typeof msgOrType === "number") {
    return Uint8Array.of(msgOrType);
  } else {
    const [dataView] = serialize(msgOrType);
    assert(dataView.byteLength > 0, "Got empty buffer from deserialization");
    assert(
      dataView.getUint8(0) === getMessageType(msgOrType),
      `Unexpected message type, got ${dataView.getUint8(0)} ` +
        `instead of ${getMessageType(msgOrType)}`
    );
    return dataView.buffer;
  }
}

/**
 * Attempts to deserialize the data of the given buffer into a Pixel message.
 * @param buffer The data to deserialize the message from.
 * @returns The deserialized message or just its type value (for messages with no class).
 */
export function deserializeMessage(buffer: ArrayBufferLike): MessageOrType {
  if (!buffer?.byteLength) {
    throw new SerializationError("Can't deserialize a null or empty buffer");
  }

  const dataView = new DataView(buffer);
  const msgType = dataView.getUint8(0);
  if (buffer.byteLength === 1) {
    return msgType;
  } else {
    const msg = instantiateMessage(msgType);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, byteRead] = deserialize(msg, dataView);
    if (byteRead !== buffer.byteLength) {
      console.log(
        `The last ${
          buffer.byteLength - byteRead
        } bytes were not read during deserialization"`
      );
    }
    assert(
      msg.type === msgType,
      `Incorrect message type after deserialization ${msg.type} but expecting ${msgType}`
    );
    return msg;
  }
}

/**
 * Generic class representing any message without any data.
 */
export class GenericPixelMessage implements PixelMessage {
  /** Type of the message. */
  @serializable(1)
  readonly type = MessageTypeValues.iAmADie;

  constructor(type: MessageType) {
    this.type = type;
  }
}

/**
 * Available combinations of Pixel designs and colors.
 * @enum
 */
export const PixelDesignAndColorValues = {
  unknown: enumValue(0),
  generic: enumValue(),
  v3Orange: enumValue(),
  v4BlackClear: enumValue(),
  v4WhiteClear: enumValue(),
  v5Grey: enumValue(),
  v5White: enumValue(),
  v5Black: enumValue(),
  v5Gold: enumValue(),
  onyxBlack: enumValue(),
  hematiteGrey: enumValue(),
  midnightGalaxy: enumValue(),
  auroraSky: enumValue(),
} as const;

/** The "enum" type for {@link PixelDesignAndColorValues}. */
export type PixelDesignAndColor =
  typeof PixelDesignAndColorValues[keyof typeof PixelDesignAndColorValues];

/** Message send by a Pixel after receiving a "WhoAmI". */
export class IAmADie implements PixelMessage {
  /** Type of the message. */
  @serializable(1)
  readonly type = MessageTypeValues.iAmADie;

  @serializable(1)
  ledCount = 0;
  @serializable(1, { padding: 1 })
  designAndColor = PixelDesignAndColorValues.generic;
  @serializable(4)
  dataSetHash = 0;
  @serializable(4)
  pixelId = 0;
  @serializable(2)
  availableFlashSize = 0;
  @serializable(4)
  buildTimestamp = 0;
}

/**
 * Pixel roll states.
 * @enum
 */
export const PixelRollStateValues = {
  // The Pixel roll state could not be determined.
  unknown: enumValue(0),

  // The Pixel is resting in a position with a face up.
  onFace: enumValue(),

  // The Pixel is being handled.
  handling: enumValue(),

  // The Pixel is rolling.
  rolling: enumValue(),

  // The Pixel is resting in a crooked position.
  crooked: enumValue(),
} as const;

/** The "enum" type for {@link PixelRollStateValues}. */
export type PixelRollState =
  typeof PixelRollStateValues[keyof typeof PixelRollStateValues];

/** Message send by a Pixel to notify of its rolling state. */
export class RollState implements PixelMessage {
  /** Type of the message. */
  @serializable(1)
  readonly type = MessageTypeValues.rollState;

  /** Current roll state. */
  @serializable(1)
  state = PixelRollStateValues.unknown;

  /** Face number (if applicable), starts at 0. */
  @serializable(1)
  faceIndex = 0;
}

/** Message send by a Pixel to notify of its telemetry data. */
export class Telemetry implements PixelMessage {
  /** Type of the message. */
  @serializable(1)
  readonly type = MessageTypeValues.telemetry;

  @serializable(4, { numberFormat: "float" })
  accX = 0;
  @serializable(4, { numberFormat: "float" })
  accY = 0;
  @serializable(4, { numberFormat: "float" })
  accZ = 0;

  @serializable(4, { numberFormat: "float" })
  jerkX = 0;
  @serializable(4, { numberFormat: "float" })
  jerkY = 0;
  @serializable(4, { numberFormat: "float" })
  jerkZ = 0;

  @serializable(4, { numberFormat: "float" })
  smoothAccX = 0;
  @serializable(4, { numberFormat: "float" })
  smoothAccY = 0;
  @serializable(4, { numberFormat: "float" })
  smoothAccZ = 0;

  @serializable(4, { numberFormat: "float" })
  sigma = 0;

  @serializable(4, { numberFormat: "float" })
  faceConfidence = 0;

  @serializable(4, { numberFormat: "signed" })
  face = 0;

  @serializable(4)
  time = 0;
}

/**
 * Message send to a Pixel to request a transfer of data.
 * This is usually done after initiating an animation transfer request
 * and followed by BulkData messages with the actual data.
 */
export class BulkSetup implements PixelMessage {
  /** Type of the message. */
  @serializable(1)
  readonly type = MessageTypeValues.bulkSetup;

  @serializable(2)
  size = 0;
}

/**
 * Message send to a Pixel to request to transfer a piece of data.
 * A BulkSetup message must be send first.
 */
export class BulkData implements PixelMessage {
  /** Type of the message. */
  @serializable(1)
  readonly type = MessageTypeValues.bulkData;

  @serializable(1)
  size = 0;
  @serializable(2)
  offset = 0;
  @serializable(Constants.maxMessageSize)
  data?: ArrayBufferLike;
}

/** Message send by a Pixel after receiving a BulkData request. */
export class BulkDataAck implements PixelMessage {
  /** Type of the message. */
  @serializable(1)
  readonly type = MessageTypeValues.bulkDataAck;

  @serializable(2)
  offset = 0;
}

/**
 * Message send to a Pixel to request a transfer of a
 * full animation data set (stored in flash memory).
 */
export class TransferAnimationSet implements PixelMessage {
  /** Type of the message. */
  @serializable(1)
  readonly type = MessageTypeValues.transferAnimationSet;

  @serializable(2)
  paletteSize = 0;
  @serializable(2)
  rgbKeyFrameCount = 0;
  @serializable(2)
  rgbTrackCount = 0;
  @serializable(2)
  keyFrameCount = 0;
  @serializable(2)
  trackCount = 0;
  @serializable(2)
  animationCount = 0;
  @serializable(2)
  animationSize = 0;
  @serializable(2)
  conditionCount = 0;
  @serializable(2)
  conditionSize = 0;
  @serializable(2)
  actionCount = 0;
  @serializable(2)
  actionSize = 0;
  @serializable(2)
  ruleCount = 0;
}

/** Message send by a Pixel after receiving a TransferAnimationSet request. */
export class TransferAnimationSetAck implements PixelMessage {
  /** Type of the message. */
  @serializable(1)
  readonly type = MessageTypeValues.transferAnimationSetAck;

  @serializable(1)
  result = 0;
}

/**
 * Message send to a Pixel to request a transfer of a
 * test animation (stored in RAM memory).
 */
export class TransferTestAnimationSet implements PixelMessage {
  /** Type of the message. */
  @serializable(1)
  readonly type = MessageTypeValues.transferTestAnimationSet;

  @serializable(2)
  paletteSize = 0;
  @serializable(2)
  rgbKeyFrameCount = 0;
  @serializable(2)
  rgbTrackCount = 0;
  @serializable(2)
  keyFrameCount = 0;
  @serializable(2)
  trackCount = 0;
  @serializable(2)
  animationSize = 0;
  @serializable(4)
  hash = 0;
}

/** Transfer animation ack values. */
export const TransferInstantAnimationsSetAckTypeValues = {
  download: enumValue(0),
  upToDate: enumValue(),
  noMemory: enumValue(),
} as const;

/** The "enum" type for {@link TransferInstantAnimationsSetAckTypeValues}. */
export type TransferInstantAnimationSetAckType =
  typeof TransferInstantAnimationsSetAckTypeValues[keyof typeof TransferInstantAnimationsSetAckTypeValues];

/** Message send by a Pixel after receiving a TransferTestAnimationSet request. */
export class TransferTestAnimationSetAck implements PixelMessage {
  /** Type of the message. */
  @serializable(1)
  readonly type = MessageTypeValues.transferTestAnimationSetAck;

  /** The expected action to be taken upon receiving this message. */
  @serializable(1)
  ackType = TransferInstantAnimationsSetAckTypeValues.download;
}

/** Message send by a Pixel to report a log message to the application. */
export class DebugLog implements PixelMessage {
  /** Type of the message. */
  @serializable(1)
  readonly type = MessageTypeValues.debugLog;

  /** The message to log. */
  @serializable(Constants.maxMessageSize)
  message = "";
}

/** Message send by a Pixel to request playing a specific sound clip. */
export class PlaySound implements PixelMessage {
  /** Type of the message. */
  @serializable(1)
  readonly type = MessageTypeValues.playSound;

  /** The id for the clip. */
  @serializable(2)
  clipId = 0;
}

/** Message send to a Pixel to have it start or stop sending telemetry messages. */
export class RequestTelemetry implements PixelMessage {
  /** Type of the message. */
  @serializable(1)
  readonly type = MessageTypeValues.requestTelemetry;

  /** The id for the clip. */
  @serializable(1)
  activate = false;
}

/** Message send to a Pixel to have it blink its LEDs. */
export class Blink implements PixelMessage {
  /** Type of the message. */
  @serializable(1)
  readonly type = MessageTypeValues.blink;

  /** Number of flashes. */
  @serializable(1)
  count = 0;

  /** Total duration in milliseconds. */
  @serializable(2)
  duration = 0;

  /** Color to blink. */
  @serializable(4)
  color = 0;

  /** Select which faces to light up. */
  @serializable(4)
  faceMask = -1;

  /** Amount of in and out fading, 0: sharp transition, 255: max fading */
  @serializable(1)
  fade = 0;
}

/** Message send by a Pixel to notify of its battery level and state. */
export class BatteryLevel implements PixelMessage {
  /** Type of the message. */
  @serializable(1)
  readonly type = MessageTypeValues.batteryLevel;

  /** The battery charge level, floating value between 0 and 1. */
  @serializable(4, { numberFormat: "float" })
  level = 0;

  /** The battery measured voltage. */
  @serializable(4, { numberFormat: "float" })
  voltage = 0;

  /** Whether the battery is charging. */
  @serializable(1)
  charging = false;
}

/** Message send by a Pixel to notify of its measured RSSI. */
export class Rssi implements PixelMessage {
  /** Type of the message. */
  @serializable(1)
  readonly type = MessageTypeValues.rssi;

  /** The RSSI value, in dBm. */
  @serializable(1, { numberFormat: "signed" })
  value = 0;

  /** The data channel index of which the RSSI is measured. */
  @serializable(1)
  channelIndex = 0;
}

/**
 * Message send by a Pixel to request the application to show
 * a message to the user, and with optionally a required action.
 */
export class NotifyUser implements PixelMessage {
  /** Type of the message. */
  @serializable(1)
  readonly type = MessageTypeValues.notifyUser;

  /** Timeout after which the die won't listen for an answer. */
  @serializable(1)
  timeoutSec = 0;

  /** Whether to display the OK button. */
  @serializable(1)
  ok = false;

  /** Whether to display the Cancel button. */
  @serializable(1)
  cancel = false;

  /** Message to show to the user. */
  @serializable(Constants.maxMessageSize - 4)
  message = "";
}

/** Message send to a Pixel in response to getting a NotifyUser request. */
export class NotifyUserAck implements PixelMessage {
  /** Type of the message. */
  @serializable(1)
  readonly type = MessageTypeValues.notifyUserAck;

  /** Whether the use selected OK or Cancel. */
  @serializable(1)
  okCancel = false;
}

/** Message send by a Pixel to notify of its measured LED loopback value. */
export class LedLoopback implements PixelMessage {
  /** Type of the message. */
  @serializable(1)
  readonly type = MessageTypeValues.ledLoopback;

  /** Some value. */
  @serializable(1)
  value = 0;
}

/** Message send to a Pixel to configure the die design and color. */
export class SetDesignAndColor implements PixelMessage {
  /** Type of the message. */
  @serializable(1)
  readonly type = MessageTypeValues.setDesignAndColor;

  /** A value from the @see PixelDesignAndColorValues enumeration.*/
  @serializable(1)
  designAndColor: PixelDesignAndColor = 0;
}

/** Message send to a Pixel to change its Bluetooth name. */
export class SetName implements PixelMessage {
  /** Type of the message. */
  @serializable(1)
  readonly type = MessageTypeValues.setName;

  /** The name to set. */
  @serializable(Constants.maxMessageSize)
  name = "";
}

/**
 * Message send to a Pixel to request a transfer of a set of
 * instant animations (stored in RAM memory)
 */
export class TransferInstantAnimationSet implements PixelMessage {
  /** Type of the message. */
  @serializable(1)
  readonly type = MessageTypeValues.transferInstantAnimationSet;

  @serializable(2)
  paletteSize = 0;
  @serializable(2)
  rgbKeyFrameCount = 0;
  @serializable(2)
  rgbTrackCount = 0;
  @serializable(2)
  keyFrameCount = 0;
  @serializable(2)
  trackCount = 0;
  @serializable(2)
  animationCount = 0;
  @serializable(2)
  animationSize = 0;
  @serializable(4)
  hash = 0;
}

/** Message send by a Pixel after receiving a TransferInstantAnimationSet request. */
export class TransferInstantAnimationSetAck implements PixelMessage {
  /** Type of the message. */
  @serializable(1)
  readonly type = MessageTypeValues.transferInstantAnimationSetAck;

  /** The expected action to be taken upon receiving this message. */
  @serializable(1)
  ackType = TransferInstantAnimationsSetAckTypeValues.download;
}

/** Message send to a Pixel to have it play an already uploaded instant animation. */
export class PlayInstantAnimation implements PixelMessage {
  /** Type of the message. */
  @serializable(1)
  readonly type = MessageTypeValues.playInstantAnimation;

  /** Animation index to play. */
  @serializable(1)
  animation = 0;

  /** Face index on which to play the animation. */
  @serializable(1)
  faceIndex = 0;

  /** Whether to play the animation forever. */
  @serializable(1)
  loop = false;
}

// Returns the list of message classes defined in this file.
function _getMessageClasses(): MessageClass[] {
  return [
    IAmADie,
    RollState,
    Telemetry,
    BulkSetup,
    BulkData,
    BulkDataAck,
    TransferAnimationSet,
    TransferAnimationSetAck,
    TransferTestAnimationSet,
    TransferTestAnimationSetAck,
    DebugLog,
    PlaySound,
    Blink,
    BatteryLevel,
    Rssi,
    NotifyUser,
    NotifyUserAck,
    LedLoopback,
    SetDesignAndColor,
    SetName,
    TransferInstantAnimationSet,
    TransferInstantAnimationSetAck,
    PlayInstantAnimation,
  ];
}
