import {
  Constants as AnimConstants,
  PixelDieTypeValues,
} from "@systemic-games/pixels-core-animation";
import {
  assert,
  enumValue,
  deserialize,
  serializable,
  SerializationError,
  serialize,
  byteSizeOf,
} from "@systemic-games/pixels-core-utils";

import { Constants } from "./Constants";

/**
 * Lists all the Pixel dice message types.
 * The value is used for the first byte of data in a Pixel message to identify it's type.
 * These message identifiers have to match up with the ones on the firmware.
 * @enum
 * @category Message
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
  remoteAction: enumValue(),
  requestRollState: enumValue(),
  requestAnimationSet: enumValue(),
  requestSettings: enumValue(),
  requestTelemetry: enumValue(),
  programDefaultAnimationSet: enumValue(),
  programDefaultAnimationSetFinished: enumValue(),
  blink: enumValue(),
  blinkAck: enumValue(),
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
  storeValue: enumValue(),
  storeValueAck: enumValue(),
  setTopLevelState: enumValue(),
  programDefaultParameters: enumValue(),
  programDefaultParametersFinished: enumValue(),
  setDesignAndColor: enumValue(),
  setDesignAndColorAck: enumValue(),
  setCurrentBehavior: enumValue(),
  setCurrentBehaviorAck: enumValue(),
  setName: enumValue(),
  setNameAck: enumValue(),
  powerOperation: enumValue(),
  exitValidation: enumValue(),
  transferInstantAnimationSet: enumValue(),
  transferInstantAnimationSetAck: enumValue(),
  transferInstantAnimationSetFinished: enumValue(),
  playInstantAnimation: enumValue(),
  stopAllAnimations: enumValue(),
  requestTemperature: enumValue(),
  temperature: enumValue(),
  setBatteryControllerMode: enumValue(),
  _unused: enumValue(),
  discharge: enumValue(),
  blinkId: enumValue(),
  blinkIdAck: enumValue(),
  transferTest: enumValue(),
  transferTestAck: enumValue(),
  transferTestFinished: enumValue(),
  clearSettings: enumValue(),
  clearSettingsAck: enumValue(),

  // Testing
  testBulkSend: enumValue(),
  testBulkReceive: enumValue(),
  setAllLEDsToColor: enumValue(),
  attractMode: enumValue(),
  printNormals: enumValue(),
  printA2DReadings: enumValue(),
  lightUpFace: enumValue(),
  setLEDToColor: enumValue(),
  debugAnimationController: enumValue(),
} as const;

/**
 * The names for the "enum" type {@link MessageTypeValues}.
 * @category Message
 */
export type MessageType = keyof typeof MessageTypeValues;

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
 * Union type of {@link PixelMessage} and {@link MessageType} types.
 * Messages without parameter have no {@link PixelMessage} class to represent them,
 * instead they are represent by the corresponding {@link MessageTypeValues}.
 * @category Message
 */
export type MessageOrType = PixelMessage | MessageType;

/**
 * Type representing a PixelMessage constructor.
 * @category Message
 */
export type MessageClass = new () => PixelMessage;

// Lookup table from message type value to message name
const _messageNamesLookup: Readonly<MessageType[]> = [];
function _getMessageNameFromValue(typeValue: number): MessageType | undefined {
  if (!_messageNamesLookup.length) {
    const lookup = _messageNamesLookup as MessageType[];
    for (const [key, value] of Object.entries(MessageTypeValues)) {
      lookup[value] = key as MessageType;
    }
  }
  return _messageNamesLookup[typeValue];
}

// Lookup table from MessageClass to MessageType
const _reverseMsgClassesLookup: Readonly<Map<MessageClass, number>> = new Map();
function _getMessageTypeValue(msgClass: MessageClass): number {
  if (!_reverseMsgClassesLookup) {
    const lookup = _reverseMsgClassesLookup as Map<MessageClass, number>;
    for (const ctor of _getMessageClasses()) {
      lookup.set(ctor, new ctor().type);
    }
  }
  return _reverseMsgClassesLookup.get(msgClass) ?? MessageTypeValues.none;
}

// Lookup table from message type value to MessageClass
const _messageClassesLookup: Readonly<Map<number, MessageClass>> = new Map();
function _getMessageClass(msgTypeValue: number): MessageClass | undefined {
  if (!_messageClassesLookup.size) {
    const lookup = _messageClassesLookup as Map<number, MessageClass>;
    for (const ctor of _getMessageClasses()) {
      lookup.set(new ctor().type, ctor);
    }
  }
  return _messageClassesLookup.get(msgTypeValue);
}

// Get message type value from message type
function _checkGetMessageTypeValue(msgType: MessageType): number {
  const typeValue = MessageTypeValues[msgType];
  assert(typeValue, `No Pixel message type value for ${msgType}`);
  return typeValue;
}

/**
 * Gets the type of the given message or message type value.
 * @param msgOrTypeOrClass A message or a message type value.
 * @returns The message type.
 * @category Message
 */
export function getMessageTypeValue(
  msgOrTypeOrClass: MessageOrType | MessageClass
): number {
  return typeof msgOrTypeOrClass === "function"
    ? _getMessageTypeValue(msgOrTypeOrClass)
    : typeof msgOrTypeOrClass === "string"
      ? _checkGetMessageTypeValue(msgOrTypeOrClass)
      : msgOrTypeOrClass.type;
}

/**
 * Get the message name (as listed in {@link MessageTypeValues}).
 * @param msgOrType A message or a message type value.
 * @returns The message name.
 * @category Message
 */
export function getMessageType(
  msgOrTypeOrTypeValue: MessageOrType | number
): MessageType {
  if (typeof msgOrTypeOrTypeValue === "string") {
    return msgOrTypeOrTypeValue;
  } else {
    const typeValue =
      typeof msgOrTypeOrTypeValue === "number"
        ? msgOrTypeOrTypeValue
        : msgOrTypeOrTypeValue.type;
    const type = _getMessageNameFromValue(typeValue);
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
export function instantiateMessage(type: MessageType): PixelMessage {
  const typeValue = _checkGetMessageTypeValue(type);
  const ctor = _getMessageClass(typeValue);
  if (ctor) {
    return new ctor();
  } else {
    return new GenericPixelMessage(typeValue);
  }
}

/**
 * Serialize the given Pixel message.
 * @param msgOrType A message or a message type value.
 * @returns The serialized data.
 * @category Message
 */
export function serializeMessage(
  msgOrTypeOrTypeValue: MessageOrType | number
): ArrayBuffer {
  if (typeof msgOrTypeOrTypeValue === "object") {
    const msg = msgOrTypeOrTypeValue;
    const [dataView] = serialize(msg);
    assert(dataView.byteLength > 0, "Got empty buffer from deserialization");
    assert(
      dataView.getUint8(0) === getMessageTypeValue(msg),
      `Unexpected message type, got ${dataView.getUint8(0)} ` +
        `instead of ${getMessageTypeValue(msg)}`
    );
    return dataView.buffer;
  } else {
    const typeValue =
      typeof msgOrTypeOrTypeValue === "number"
        ? msgOrTypeOrTypeValue
        : MessageTypeValues[msgOrTypeOrTypeValue];
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
export function deserializeMessage(dataView: DataView): MessageOrType {
  if (!dataView.byteLength) {
    throw new SerializationError("Can't deserialize an empty buffer");
  }
  const msgTypeValue = dataView.getUint8(0);
  if (dataView.byteLength === 1) {
    return getMessageType(msgTypeValue);
  } else {
    const msg = instantiateMessage(getMessageType(msgTypeValue));
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

/**
 * The possible chip models used for Pixels dice.
 * @enum
 * @category Message
 */
export const PixelChipModelValues = {
  unknown: enumValue(0),
  nRF52810: enumValue(),
} as const;

/**
 * The names for the "enum" type {@link PixelChipModelValues}.
 * @category Message
 */
export type PixelChipModel = keyof typeof PixelChipModelValues;

/**
 * Available Pixels dice colorways.
 * @enum
 * @category Message
 */
export const PixelColorwayValues = {
  unknown: enumValue(0),
  onyxBlack: enumValue(),
  hematiteGrey: enumValue(),
  midnightGalaxy: enumValue(),
  auroraSky: enumValue(),
  clear: enumValue(),
  custom: 0xff,
} as const;

/**
 * The names for the "enum" type {@link PixelColorwayValues}.
 * @category Message
 */
export type PixelColorway = keyof typeof PixelColorwayValues;

export interface MessageChunk {
  // On initialization: size of serializable object
  // After deserialization: number of bytes read from buffer
  chunkSize: number;
}

export class VersionInfoChunk implements MessageChunk {
  /** Size in bytes of the version info data chunk. */
  @serializable(1)
  chunkSize = byteSizeOf(this);

  @serializable(2)
  firmwareVersion = 0;

  @serializable(4)
  buildTimestamp = 0;

  @serializable(2)
  settingsVersion = 0;

  @serializable(2)
  compatStandardApiVersion = 0;

  @serializable(2)
  compatExtendedApiVersion = 0;

  @serializable(2)
  compatManagementApiVersion = 0;
}

export class DieInfoChunk implements MessageChunk {
  /** Size in bytes of the die info data chunk. */
  @serializable(1)
  chunkSize = byteSizeOf(this);

  /** The Pixel id. */
  @serializable(4)
  pixelId = 0;

  @serializable(1)
  chipModel = PixelChipModelValues.unknown;

  @serializable(1)
  dieType = PixelDieTypeValues.unknown;

  /** Number of LEDs. */
  @serializable(1)
  ledCount = 0;

  /** Die look. */
  @serializable(1)
  colorway = PixelColorwayValues.unknown;
}

export class CustomDesignAndColorNameChunk implements MessageChunk {
  @serializable(1)
  chunkSize = 0;

  @serializable(0, { terminator: true })
  name = "";
}

export class DieNameChunk implements MessageChunk {
  @serializable(1)
  chunkSize = 0;

  @serializable(0, { terminator: true })
  name = "";
}

export class SettingsInfoChunk implements MessageChunk {
  /** Size in bytes of the settings info data chunk. */
  @serializable(1)
  chunkSize = byteSizeOf(this);

  /** Hash of the uploaded profile. */
  @serializable(4)
  profileDataHash = 0;

  /** Amount of available flash to store data. */
  @serializable(4)
  availableFlash = 0;

  /** Total amount of flash that can be used to store data */
  @serializable(4)
  totalUsableFlash = 0;
}

export class StatusInfoChunk implements MessageChunk {
  /** Size in bytes of the battery info data chunk. */
  @serializable(1)
  chunkSize = byteSizeOf(this);

  // Battery

  /** The battery charge level in percent. */
  @serializable(1)
  batteryLevelPercent = 0;

  /** The charging state of the battery. */
  @serializable(1)
  batteryState = PixelBatteryStateValues.ok;

  // Rolls

  /** Current roll state. */
  @serializable(1)
  rollState = PixelRollStateValues.unknown;

  /** Face index, starts at 0. */
  @serializable(1)
  currentFaceIndex = 0;
}

/**
 * Message send by a Pixel after receiving a "WhoAmI" message.
 * @category Message
 */
export class IAmADie implements PixelMessage {
  @serializable(1)
  readonly type = MessageTypeValues.iAmADie;

  versionInfo = new VersionInfoChunk();
  dieInfo = new DieInfoChunk();
  customDesignAndColorName = new CustomDesignAndColorNameChunk();
  dieName = new DieNameChunk();
  settingsInfo = new SettingsInfoChunk();
  statusInfo = new StatusInfoChunk();
}

/**
 * Message send by a Pixel running a legacy firmware,
 * after receiving a "WhoAmI" message.
 * @category Message
 */
export class LegacyIAmADie implements PixelMessage {
  /** Type of the message. */
  @serializable(1)
  readonly type = MessageTypeValues.iAmADie;

  /** Number of LEDs. */
  @serializable(1)
  ledCount = 0;

  /** Die look. */
  @serializable(1)
  colorway = PixelColorwayValues.unknown;

  /** Type of die. */
  @serializable(1)
  dieType = PixelDieTypeValues.unknown;

  /** Hash of the uploaded profile. */
  @serializable(4)
  dataSetHash = 0;

  /** The Pixel id. */
  @serializable(4)
  pixelId = 0;

  /** Amount of available flash. */
  @serializable(2)
  availableFlashSize = 0;

  /** UNIX timestamp in seconds for the date of the firmware. */
  @serializable(4)
  buildTimestamp = 0;

  // Roll state

  /** Current roll state. */
  @serializable(1)
  rollState = PixelRollStateValues.unknown;

  /** Face index, starts at 0. */
  @serializable(1)
  currentFaceIndex = 0;

  // Battery level

  /** The battery charge level in percent. */
  @serializable(1)
  batteryLevelPercent = 0;

  /** The charging state of the battery. */
  @serializable(1)
  batteryState = PixelBatteryStateValues.ok;

  static readonly expectedSize = 22;
}

/**
 * Pixel roll states.
 * @enum
 * @category Message
 */
export const PixelRollStateValues = {
  /** The Pixel roll state could not be determined. */
  unknown: enumValue(0),

  /** The Pixel is resting in a position with a face up. */
  onFace: enumValue(),

  /** The Pixel is being handled. */
  handling: enumValue(),

  /** The Pixel is rolling. */
  rolling: enumValue(),

  /** The Pixel is resting in a crooked position. */
  crooked: enumValue(),
} as const;

/**
 * The names for the "enum" type {@link PixelRollStateValues}.
 * @category Message
 */
export type PixelRollState = keyof typeof PixelRollStateValues;

/**
 * Message send by a Pixel to notify of its rolling state.
 * @category Message
 */
export class RollState implements PixelMessage {
  /** Type of the message. */
  @serializable(1)
  readonly type = MessageTypeValues.rollState;

  /** Current roll state. */
  @serializable(1)
  state = PixelRollStateValues.unknown;

  /** Index of the face facing up (if applicable). */
  @serializable(1)
  faceIndex = 0;
}

/**
 * Available Pixel battery controller modes.
 * @enum
 * @category Message
 */
export const PixelBatteryControllerModeValues = {
  /** Charging allowed. */
  default: enumValue(0),

  /** Disable charging. */
  forceDisableCharging: enumValue(),

  /** Ignore battery temperature. */
  forceEnableCharging: enumValue(),
} as const;

/**
 * The names for the "enum" type {@link PixelBatteryControllerModeValues}.
 * @category Message
 */
export type PixelBatteryControllerMode =
  keyof typeof PixelBatteryControllerModeValues;

/**
 * Message send by a Pixel to notify of its telemetry data.
 * @category Message
 */
export class Telemetry implements PixelMessage {
  /** Type of the message. */
  @serializable(1)
  readonly type = MessageTypeValues.telemetry;

  // Accelerometer

  @serializable(2, { numberFormat: "signed" })
  accXTimes1000 = 0;
  @serializable(2, { numberFormat: "signed" })
  accYTimes1000 = 0;
  @serializable(2, { numberFormat: "signed" })
  accZTimes1000 = 0;

  @serializable(4, { numberFormat: "signed" })
  faceConfidenceTimes1000 = 0;

  /** Firmware time in ms for when the data was gathered. */
  @serializable(4)
  timeMs = 0;

  /** Current roll state. */
  @serializable(1)
  rollState = PixelRollStateValues.unknown;

  /** Index of the face facing up (if applicable). */
  @serializable(1)
  faceIndex = 0;

  // Battery & power

  /** The battery charge level in percent. */
  @serializable(1)
  batteryLevelPercent = 0;

  /** The charging state of the battery. */
  @serializable(1)
  batteryState = PixelBatteryStateValues.ok;

  /** The internal state of the battery controller itself. */
  @serializable(1)
  batteryControllerState = PixelBatteryControllerStateValues.ok;

  /** The measured battery voltage multiplied by 50. */
  @serializable(1)
  voltageTimes50 = 0;

  /** The measured coil voltage multiplied by 50. */
  @serializable(1)
  vCoilTimes50 = 0;

  // RSSI

  /** The RSSI value, in dBm. */
  @serializable(1, { numberFormat: "signed" })
  rssi = 0;

  /** The data channel index of which the RSSI is measured. */
  @serializable(1)
  channelIndex = 0;

  // Temperature

  /**
   * The microcontroller temperature, in celsius, times 100 (i.e. 500 == 5 degrees C).
   * If the die was unable to read the temperature, value will be 0xffff.
   */
  @serializable(2)
  mcuTemperatureTimes100 = 0;

  /**
   * The battery temperature, in celsius, times 100 (i.e. 500 == 5 degrees C).
   */
  @serializable(2)
  batteryTemperatureTimes100 = 0;

  /** Internal charge state */
  @serializable(1)
  internalChargeState = false;

  /** Internal disabling of charging (because of temperature for instance) */
  @serializable(1)
  batteryControllerMode = PixelBatteryControllerModeValues.default;

  /** led power draw in mA */
  @serializable(1)
  ledCurrent = 0;
}

/**
 * Message send to a Pixel to request a transfer of data.
 * This is usually done after initiating an animation transfer request
 * and followed by BulkData messages with the actual data.
 * @category Message
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
 * @category Message
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

/**
 * Message send by a Pixel after receiving a BulkData request.
 * @category Message
 */
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
 * @category Message
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

/**
 * Message send by a Pixel after receiving a TransferAnimationSet request.
 * @category Message
 */
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
 * @category Message
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

/**
 * Transfer animation ack values.
 * @enum
 * @category Message
 */
export const TransferInstantAnimationsSetAckTypeValues = {
  /** Die is ready to download animation set. */
  download: enumValue(0),
  /** Die already has the contents of the animation set. */
  upToDate: enumValue(),
  /** Die doesn't have enough memory to store animation set. */
  noMemory: enumValue(),
} as const;

/**
 * The names for the "enum" type {@link TransferInstantAnimationsSetAckTypeValues}.
 * @category Message
 */
export type TransferInstantAnimationsSetAckType =
  keyof typeof TransferInstantAnimationsSetAckTypeValues;

/**
 * Message send by a Pixel after receiving a TransferTestAnimationSet request.
 * @category Message
 */
export class TransferTestAnimationSetAck implements PixelMessage {
  /** Type of the message. */
  @serializable(1)
  readonly type = MessageTypeValues.transferTestAnimationSetAck;

  /** The expected action to be taken upon receiving this message. */
  @serializable(1)
  ackType = TransferInstantAnimationsSetAckTypeValues.download;
}

/**
 * Message send by a Pixel to report a log message to the application.
 * @category Message
 */
export class DebugLog implements PixelMessage {
  /** Type of the message. */
  @serializable(1)
  readonly type = MessageTypeValues.debugLog;

  /** The message to log. */
  @serializable(0, { terminator: true })
  message = "";
}

/**
 * Message send by a Pixel to request running a specific remote action.
 * @category Message
 */
export class RemoteAction implements PixelMessage {
  /** Type of the message. */
  @serializable(1)
  readonly type = MessageTypeValues.remoteAction;

  /** Type of remote action. */
  // @serializable(1)
  // readonly remoteActionType: RemoteActionType = 0;

  /** The action id to run. */
  @serializable(2)
  actionId = 0;
}

/**
 * Available modes for telemetry requests.
 * @enum
 * @category Message
 */
export const TelemetryRequestModeValues = {
  /* Request Pixel to stop automatically sending telemetry updates. */
  off: enumValue(0),

  /* Request Pixel to immediately send a single telemetry update. */
  once: enumValue(),

  /* Request Pixel to automatically send telemetry updates. */
  automatic: enumValue(),
} as const;

/**
 * The names for the "enum" type {@link TelemetryRequestModeValues}.
 * @category Message
 */
export type TelemetryRequestMode = keyof typeof TelemetryRequestModeValues;

/**
 * Message send to a Pixel to have it start or stop sending telemetry messages.
 * @category Message
 */
export class RequestTelemetry implements PixelMessage {
  /** Type of the message. */
  @serializable(1)
  readonly type = MessageTypeValues.requestTelemetry;

  @serializable(1)
  requestMode = TelemetryRequestModeValues.off;

  @serializable(2)
  minInterval = 0; // Milliseconds, 0 for no cap on rate
}

/**
 * Message send to a Pixel to have it blink its LEDs.
 * @category Message
 */
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
  faceMask: number = AnimConstants.faceMaskAll;

  /** Amount of in and out fading, 0: sharp transition, 255: max fading. */
  @serializable(1)
  fade = 0;

  /** Whether to indefinitely loop the animation. */
  @serializable(1)
  loop = false;
}

/**
 * The different possible battery charging states.
 * @enum
 * @category Message
 */
export const PixelBatteryStateValues = {
  /** Battery looks fine, nothing is happening. */
  ok: enumValue(0),
  /** Battery level is low, notify user they should recharge. */
  low: enumValue(),
  /** Battery is currently recharging. */
  charging: enumValue(),
  /** Battery is full and finished charging. */
  done: enumValue(),
  /**
   * Coil voltage is bad, die is probably positioned incorrectly.
   * Note that currently this state is triggered during transition between charging and not charging...
   */
  badCharging: enumValue(),
  /** Charge state doesn't make sense (charging but no coil voltage detected for instance). */
  error: enumValue(),
} as const;

/**
 * The names for the "enum" type {@link PixelBatteryStateValues}.
 * @category Message
 */
export type PixelBatteryState = keyof typeof PixelBatteryStateValues;

/**
 * The different possible battery charging states.
 * @enum
 * @category Message
 */
export const PixelBatteryControllerStateValues = {
  unknown: enumValue(0),
  // Battery looks fine, nothing is happening
  ok: enumValue(),
  // Battery voltage is so low the die might turn off at any time
  empty: enumValue(),
  // Battery level is low, notify user they should recharge
  low: enumValue(),
  // Coil voltage is bad, but we don't know yet if that's because we just put the die
  // on the coil, or if indeed the die is incorrectly positioned
  transitionOn: enumValue(),
  // Coil voltage is bad, but we don't know yet if that's because we removed the die and
  // the coil cap is still discharging, or if indeed the die is incorrectly positioned
  transitionOff: enumValue(),
  // Coil voltage is bad, die is probably positioned incorrectly
  // Note that currently this state is triggered during transition between charging and not charging...
  badCharging: enumValue(),
  // Charge state doesn't make sense (charging but no coil voltage detected for instance)
  error: enumValue(),
  // Battery is currently recharging, but still really low
  chargingLow: enumValue(),
  // Battery is currently recharging
  charging: enumValue(),
  // Battery is currently cooling down
  cooldown: enumValue(),
  // Battery is currently recharging, but at 99%
  trickle: enumValue(),
  // Battery is full and finished charging
  done: enumValue(),
  // Battery is too cold
  lowTemp: enumValue(),
  // Battery is too hot
  highTemp: enumValue(),
} as const;

/**
 * The names for the "enum" type {@link PixelBatteryControllerStateValues}.
 * @category Message
 */
export type PixelBatteryControllerState =
  keyof typeof PixelBatteryControllerStateValues;

/**
 * Message send by a Pixel to notify of its battery level and state.
 * @category Message
 */
export class BatteryLevel implements PixelMessage {
  /** Type of the message. */
  @serializable(1)
  readonly type = MessageTypeValues.batteryLevel;

  /** The battery charge level in percent. */
  @serializable(1)
  levelPercent = 0;

  /** The charging state of the battery. */
  @serializable(1)
  state = PixelBatteryStateValues.ok;
}

/**
 * Message send to a Pixel to configure RSSI reporting.
 * @category Message
 */
export class RequestRssi implements PixelMessage {
  /** Type of the message. */
  @serializable(1)
  readonly type = MessageTypeValues.requestRssi;

  /** Telemetry mode used for sending the RSSI update(s). */
  @serializable(1)
  requestMode = TelemetryRequestModeValues.off;

  /**
   * Minimum interval in milliseconds between two updates.
   * (0 for no cap on rate)
   */
  @serializable(2)
  minInterval = 0;
}

/**
 * Message send by a Pixel to notify of its measured RSSI.
 * @category Message
 */
export class Rssi implements PixelMessage {
  /** Type of the message. */
  @serializable(1)
  readonly type = MessageTypeValues.rssi;

  /** The RSSI value, in dBm. */
  @serializable(1, { numberFormat: "signed" })
  value = 0;
}

/**
 * Message send by a Pixel to request the application to show
 * a message to the user, and with optionally a required action.
 * @category Message
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

/**
 * Message send to a Pixel in response to getting a NotifyUser request.
 * @category Message
 */
export class NotifyUserAck implements PixelMessage {
  /** Type of the message. */
  @serializable(1)
  readonly type = MessageTypeValues.notifyUserAck;

  /** Whether the use selected OK or Cancel. */
  @serializable(1)
  okCancel = false;
}

/**
 * Message send to a Pixel to store a 32 bits value.
 * @category Message
 */
export class StoreValue implements PixelMessage {
  /** Type of the message. */
  @serializable(1)
  readonly type = MessageTypeValues.storeValue;

  /** Value to write. */
  @serializable(4)
  value = 0;
}

/**
 * The different possible result of requesting to store a value.
 * @enum
 * @category Message
 */
export const StoreValueResultValues = {
  /** Value stored successfully. */
  success: enumValue(0),
  /** Some error occurred. */
  unknownError: enumValue(),
  /** Store is full, value wasn't saved. */
  storeFull: enumValue(),
  /**
   * Store request was discarded because the value is outside of the
   * valid range (value can't be 0).
   */
  invalidRange: enumValue(),
  /* Operation not permitted in the current die state. */
  notPermitted: enumValue(),
} as const;

/**
 * The names for the "enum" type {@link StoreValueResultValues}.
 * @category Message
 */
export type StoreValueResult = keyof typeof StoreValueResultValues;

/**
 * Message send by a Pixel is response to receiving a
 * {@link StoreValue} message.
 * @category Message
 */
export class StoreValueAck implements PixelMessage {
  /** Type of the message. */
  @serializable(1)
  readonly type = MessageTypeValues.storeValueAck;

  /** Store operation result. */
  @serializable(1)
  result = 0;

  /** Index at which the value was written. */
  @serializable(1)
  index = StoreValueResultValues.success;
}

/**
 * Message send to a Pixel to configure the die design and color.
 * @category Message
 */
export class SetDesignAndColor implements PixelMessage {
  /** Type of the message. */
  @serializable(1)
  readonly type = MessageTypeValues.setDesignAndColor;

  /** A value from the {@link PixelDieType} enumeration.*/
  @serializable(1)
  dieType: number = 0;

  /** A value from the {@link PixelColorwayValues} enumeration.*/
  @serializable(1)
  colorway: number = 0;
}

/**
 * Message send to a Pixel to change its Bluetooth name.
 * @category Message
 */
export class SetName implements PixelMessage {
  /** Type of the message. */
  @serializable(1)
  readonly type = MessageTypeValues.setName;

  /** The name to set. */
  @serializable(Constants.maxNameByteSize + 1) // +1 for null terminator
  name = "";
}

/**
 * The different power operations available on a Pixel.
 * @enum
 * @category Message
 */
export const PixelPowerOperationValues = {
  // Turn off all systems.
  turnOff: enumValue(0),
  // Reset die chip.
  reset: enumValue(),
  // Put die in low power mode, will be "awaken" when moved.
  sleep: enumValue(),
} as const;

/**
 * Message send to a Pixel to modify it's power state.
 * @category Message
 */
export class PowerOperation implements PixelMessage {
  /** Type of the message. */
  @serializable(1)
  readonly type = MessageTypeValues.powerOperation;

  /** The name to set. */
  @serializable(1)
  operation = PixelPowerOperationValues.sleep;
}

/**
 * Message send to a Pixel to request a transfer of a set of
 * instant animations (stored in RAM memory)
 * @category Message
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

/**
 * Message send by a Pixel after receiving a TransferInstantAnimationSet request.
 * @category Message
 */
export class TransferInstantAnimationSetAck implements PixelMessage {
  /** Type of the message. */
  @serializable(1)
  readonly type = MessageTypeValues.transferInstantAnimationSetAck;

  /** The expected action to be taken upon receiving this message. */
  @serializable(1)
  ackType = TransferInstantAnimationsSetAckTypeValues.download;
}

/**
 * Message send to a Pixel to have it play an already uploaded instant animation.
 * @category Message
 */
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

  /** Whether to indefinitely loop the animation. */
  @serializable(1)
  loop = false;
}

/**
 * Message send by a Pixel to notify of its internal temperature.
 * @category Message
 */
export class Temperature implements PixelMessage {
  /** Type of the message. */
  @serializable(1)
  readonly type = MessageTypeValues.temperature;

  /**
   * The microcontroller temperature, in celsius, times 100 (i.e. 500 == 5 degrees C).
   * If the die was unable to read the temperature, value will be 0xffff.
   */
  @serializable(2)
  mcuTemperatureTimes100 = 0;

  /**
   * The battery temperature, in celsius, times 100 (i.e. 500 == 5 degrees C).
   */
  @serializable(2)
  batteryTemperatureTimes100 = 0;
}

/**
 * Message send to a Pixel to set its battery controller mode.
 * @category Message
 */
export class SetBatteryControllerMode implements PixelMessage {
  /** Type of the message. */
  @serializable(1)
  readonly type = MessageTypeValues.setBatteryControllerMode;

  /**
   * The battery controller mode to set.
   */
  @serializable(1)
  mode = PixelBatteryControllerModeValues.default;
}

/**
 * Message send to a Pixel to make it light up its LEDs to quickly discharge the battery.
 * @category Message
 */
export class Discharge implements PixelMessage {
  /** Type of the message. */
  @serializable(1)
  readonly type = MessageTypeValues.discharge;

  /**
   * The current draw, in mA, or 0 to reset.
   */
  @serializable(1)
  currentMA = 0;
}

/**
 * Message send to a Pixel to make it blink it Pixel Id.
 * @category Message
 */
export class BlinkId implements PixelMessage {
  /** Type of the message. */
  @serializable(1)
  readonly type = MessageTypeValues.blinkId;

  /**
   * The brightness of the blinking LEDs.
   */
  @serializable(1)
  brightness = 0;

  /** Whether to indefinitely loop the animation. */
  @serializable(1)
  loop = false;
}

/**
 * Message send to a Pixel to test transfer rates.
 * @category Message
 */
export class TransferTest implements PixelMessage {
  /** Type of the message. */
  @serializable(1)
  readonly type = MessageTypeValues.transferTest;

  /**
   * The amount of data to be send.
   */
  @serializable(2, { padding: 1 })
  size = 0;
}

/**
 * Message send to a Pixel to play an animation from the stored profile.
 * @category Message
 */
export class PlayProfileAnimation implements PixelMessage {
  /** Type of the message. */
  @serializable(1)
  readonly type = MessageTypeValues.playAnimation;

  /** Index of the animation in the profile's animation list. */
  @serializable(1)
  animationIndex = 0;

  /** Face on which to play the animation (the animations are designed assuming that the higher face value is up). */
  @serializable(1)
  remapToFace = 0;

  /** Whether to indefinitely loop the animation. */
  @serializable(1)
  loop = false;
}

// Returns the list of message classes defined in this file.
function _getMessageClasses(): MessageClass[] {
  return [
    LegacyIAmADie,
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
    RemoteAction,
    Blink,
    BatteryLevel,
    RequestRssi,
    Rssi,
    NotifyUser,
    NotifyUserAck,
    StoreValue,
    StoreValueAck,
    SetDesignAndColor,
    SetName,
    PowerOperation,
    TransferInstantAnimationSet,
    TransferInstantAnimationSetAck,
    PlayInstantAnimation,
    Temperature,
    SetBatteryControllerMode,
    Discharge,
    BlinkId,
    TransferTest,
  ];
}
