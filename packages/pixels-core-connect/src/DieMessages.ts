import {
  AnimConstants,
  PixelColorwayValues,
  PixelDieTypeValues,
} from "@systemic-games/pixels-core-animation";
import {
  enumValue,
  serializable,
  byteSizeOf,
} from "@systemic-games/pixels-core-utils";

import { ChunkMessage } from "./ChunkMessage";
import { Constants } from "./Constants";
import { MessageSerializer } from "./MessageSerializer";
import { PixelBatteryControllerStateValues } from "./PixelBatteryControllerState";
import { PixelBatteryStateValues } from "./PixelBatteryState";
import { PixelChipModelValues } from "./PixelChipModel";
import { PixelMessage } from "./PixelMessage";
import { PixelRollStateValues } from "./PixelRollState";
import { TelemetryRequestModeValues } from "./TelemetryRequestMode";

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
  printAnimationControllerState: enumValue(),
} as const;

/**
 * The names for the "enum" type {@link MessageTypeValues}.
 * @category Message
 */
export type MessageType = keyof typeof MessageTypeValues;

/**
 * Union type of {@link PixelMessage} and {@link MessageType} types.
 * Messages without parameter have no {@link PixelMessage} class to represent them,
 * instead they are represent by the corresponding {@link MessageTypeValues}.
 * @category Message
 */
export type MessageOrType = PixelMessage | MessageType;

/**
 * Pixel version info message chunk.
 * @category Message
 */
export class VersionInfoChunk implements ChunkMessage {
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

/**
 * Pixel general info message chunk.
 * @category Message
 */
export class DieInfoChunk implements ChunkMessage {
  /** Size in bytes of the die info data chunk. */
  @serializable(1)
  chunkSize = byteSizeOf(this);

  /** The unique Pixel id. */
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

/**
 * Pixel custom design & color name message chunk.
 * @category Message
 */
export class CustomDesignAndColorNameChunk implements ChunkMessage {
  @serializable(1)
  chunkSize = 0;

  @serializable(0, { terminator: true })
  name = "";
}

/**
 * Pixel name message chunk.
 * @category Message
 */
export class DieNameChunk implements ChunkMessage {
  @serializable(1)
  chunkSize = 0;

  @serializable(0, { terminator: true })
  name = "";
}

/**
 * Pixel settings message chunk.
 * @category Message
 */
export class SettingsInfoChunk implements ChunkMessage {
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

/**
 * Pixel status message chunk.
 * @category Message
 */
export class StatusInfoChunk implements ChunkMessage {
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

  readonly versionInfo = new VersionInfoChunk();
  readonly dieInfo = new DieInfoChunk();
  readonly customDesignAndColorName = new CustomDesignAndColorNameChunk();
  readonly dieName = new DieNameChunk();
  readonly settingsInfo = new SettingsInfoChunk();
  readonly statusInfo = new StatusInfoChunk();
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

  /** Die color. */
  @serializable(1)
  colorway = PixelColorwayValues.unknown;

  /** Type of die. */
  @serializable(1)
  dieType = PixelDieTypeValues.unknown;

  /** Hash of the uploaded profile. */
  @serializable(4)
  dataSetHash = 0;

  /** The unique Pixel id. */
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

  /** Index of the face that is currently facing up. */
  @serializable(1)
  currentFaceIndex = 0;

  // Battery level

  /** The battery charge level in percent. */
  @serializable(1)
  batteryLevelPercent = 0;

  /** The charging state of the battery. */
  @serializable(1)
  batteryState = PixelBatteryStateValues.ok;

  /** Byte size of the LegacyIAmADie message. */
  static readonly expectedSize = 22;
}

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
  @serializable(1)
  brightness = 0;
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
  animationCount = 0;
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

  /** How many times to loop the animation. */
  @serializable(1)
  loopCount = 1;
}

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
 * Message send to a Pixel to configure the die type and color.
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

  /** How many times to loop the animation. */
  @serializable(1)
  loopCount = 1;
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

  /** How many times to loop the animation. */
  @serializable(1)
  loopCount = 1;
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

  /** How many times to loop the animation. */
  @serializable(1)
  loopCount = 1;
}

export const serializer = new MessageSerializer<MessageType>(
  Object.entries(MessageTypeValues) as [MessageType, number][],
  [
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
  ]
);
