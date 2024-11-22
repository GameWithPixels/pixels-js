import { AnimConstants } from "@systemic-games/pixels-core-animation";
import {
  enumValue,
  serializable,
  byteSizeOf,
} from "@systemic-games/pixels-core-utils";

import { ChunkMessage } from "./ChunkMessage";
import { Constants } from "./Constants";
import { MessageSerializer } from "./MessageSerializer";
import { PixelBatteryStateValues } from "./PixelBatteryState";
import { PixelChipModelValues } from "./PixelChipModel";
import { PixelMessage } from "./PixelMessage";
import { TelemetryRequestModeValues } from "./TelemetryRequestMode";

/**
 * Lists all the Pixel dice message types.
 * The value is used for the first byte of data in a Pixel message to identify it's type.
 * These message identifiers have to match up with the ones on the firmware.
 * @enum
 * @category Message
 */
export const MPCMessageTypeValues = {
  none: enumValue(0),
  whoAreYou: enumValue(),
  iAmAMPC: enumValue(),
  bulkSetup: enumValue(),
  bulkSetupAck: enumValue(),
  bulkData: enumValue(),
  bulkDataAck: enumValue(),
  transferSettings: enumValue(),
  transferSettingsAck: enumValue(),
  transferSettingsFinished: enumValue(),
  debugLog: enumValue(),
  requestSettings: enumValue(),
  blink: enumValue(),
  blinkAck: enumValue(),
  playAnimation: enumValue(),
  stopAnimation: enumValue(),
  requestRssi: enumValue(),
  rssi: enumValue(),
  notifyUser: enumValue(),
  notifyUserAck: enumValue(),
  programDefaultParameters: enumValue(),
  programDefaultParametersFinished: enumValue(),
  setName: enumValue(),
  setNameAck: enumValue(),
  requestTemperature: enumValue(),
  temperature: enumValue(),
  synchronizeTime: enumValue(),
} as const;

/**
 * The names for the "enum" type {@link MPCMessageTypeValues}.
 * @category Message
 */
export type MPCMessageType = keyof typeof MPCMessageTypeValues;

/**
 * Union type of {@link PixelMessage} and {@link MPCMessageType} types.
 * Messages without parameter have no {@link PixelMessage} class to represent them,
 * instead they are represent by the corresponding {@link MPCMessageTypeValues}.
 * @category Message
 */
export type MPCMessageOrType = PixelMessage | MPCMessageType;

/**
 * MPC version info message chunk.
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
 * MPC general info message chunk.
 * @category Message
 */
export class MPCInfoChunk implements ChunkMessage {
  /** Size in bytes of the charger info data chunk. */
  @serializable(1)
  chunkSize = byteSizeOf(this);

  /** The charger unique Pixel id. */
  @serializable(4)
  pixelId = 0;

  @serializable(1)
  chipModel = PixelChipModelValues.unknown;

  /** Number of LEDs. */
  @serializable(1)
  ledCount = 0;
}

/**
 * MPC name message chunk.
 * @category Message
 */
export class MPCNameChunk implements ChunkMessage {
  @serializable(1)
  chunkSize = 0;

  @serializable(0, { terminator: true })
  name = "";
}

/**
 * MPC settings message chunk.
 * @category Message
 */
export class SettingsInfoChunk implements ChunkMessage {
  /** Size in bytes of the settings info data chunk. */
  @serializable(1)
  chunkSize = byteSizeOf(this);

  /** Amount of available flash to store data. */
  @serializable(4)
  availableFlash = 0;

  /** Total amount of flash that can be used to store data */
  @serializable(4)
  totalUsableFlash = 0;
}

/**
 * MPC status message chunk.
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
}

/**
 * Message send by a MPC after receiving a "WhoAmI" message.
 * @category Message
 */
export class IAmAMPC implements PixelMessage {
  @serializable(1)
  readonly type = MPCMessageTypeValues.iAmAMPC;

  readonly versionInfo = new VersionInfoChunk();
  readonly chargerInfo = new MPCInfoChunk();
  readonly dieName = new MPCNameChunk();
  readonly settingsInfo = new SettingsInfoChunk();
  readonly statusInfo = new StatusInfoChunk();
}

export class LegacyIAmAMPC implements PixelMessage {
  /** Type of the message. */
  @serializable(1)
  readonly type = MPCMessageTypeValues.iAmAMPC;

  /** Number of LEDs. */
  @serializable(1, { padding: 6 })
  ledCount = 0;

  /** The charger unique Pixel id. */
  @serializable(4)
  pixelId = 0;

  /** Amount of available flash. */
  @serializable(2)
  availableFlashSize = 0;

  /** UNIX timestamp in seconds for the date of the firmware. */
  @serializable(4)
  buildTimestamp = 0;

  /** Byte size of the LegacyIAmAMPC message. */
  static readonly expectedSize = 18;
}

/**
 * Message send to a MPC to request a transfer of data.
 * This is usually done after initiating an animation transfer request
 * and followed by BulkData messages with the actual data.
 * @category Message
 */
export class BulkSetup implements PixelMessage {
  /** Type of the message. */
  @serializable(1)
  readonly type = MPCMessageTypeValues.bulkSetup;

  @serializable(2)
  size = 0;
}

/**
 * Message send to a MPC to request to transfer a piece of data.
 * A BulkSetup message must be send first.
 * @category Message
 */
export class BulkData implements PixelMessage {
  /** Type of the message. */
  @serializable(1)
  readonly type = MPCMessageTypeValues.bulkData;

  @serializable(1)
  size = 0;
  @serializable(2)
  offset = 0;
  @serializable(Constants.maxMessageSize)
  data?: ArrayBufferLike;
}

/**
 * Message send by a MPC after receiving a BulkData request.
 * @category Message
 */
export class BulkDataAck implements PixelMessage {
  /** Type of the message. */
  @serializable(1)
  readonly type = MPCMessageTypeValues.bulkDataAck;

  @serializable(2)
  offset = 0;
}

/**
 * Message send by a MPC to report a log message to the application.
 * @category Message
 */
export class DebugLog implements PixelMessage {
  /** Type of the message. */
  @serializable(1)
  readonly type = MPCMessageTypeValues.debugLog;

  /** The message to log. */
  @serializable(0, { terminator: true })
  message = "";
}

/**
 * Message send to a MPC to have it blink its LEDs.
 * @category Message
 */
export class Blink implements PixelMessage {
  /** Type of the message. */
  @serializable(1)
  readonly type = MPCMessageTypeValues.blink;

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

export class PlayAnimation implements PixelMessage {
  /** Type of the message. */
  @serializable(1)
  readonly type = MPCMessageTypeValues.playAnimation;

  @serializable(1)
  animation = 0;
}

export class StopAnimation implements PixelMessage {
  /** Type of the message. */
  @serializable(1)
  readonly type = MPCMessageTypeValues.stopAnimation;

  @serializable(1)
  animation = 0;
  @serializable(2)
  fadeOutTime = 0; // Milliseconds
}

/**
 * Message send to a MPC to configure RSSI reporting.
 * @category Message
 */
export class RequestRssi implements PixelMessage {
  /** Type of the message. */
  @serializable(1)
  readonly type = MPCMessageTypeValues.requestRssi;

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
 * Message send by a MPC to notify of its measured RSSI.
 * @category Message
 */
export class Rssi implements PixelMessage {
  /** Type of the message. */
  @serializable(1)
  readonly type = MPCMessageTypeValues.rssi;

  /** The RSSI value, in dBm. */
  @serializable(1, { numberFormat: "signed" })
  value = 0;
}

/**
 * Message send by a MPC to request the application to show
 * a message to the user, and with optionally a required action.
 * @category Message
 */
export class NotifyUser implements PixelMessage {
  /** Type of the message. */
  @serializable(1)
  readonly type = MPCMessageTypeValues.notifyUser;

  /** Timeout after which the charger won't listen for an answer. */
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
 * Message send to a MPC in response to getting a NotifyUser request.
 * @category Message
 */
export class NotifyUserAck implements PixelMessage {
  /** Type of the message. */
  @serializable(1)
  readonly type = MPCMessageTypeValues.notifyUserAck;

  /** Whether the use selected OK or Cancel. */
  @serializable(1)
  okCancel = false;
}

/**
 * Message send to a MPC to change its Bluetooth name.
 * @category Message
 */
export class SetName implements PixelMessage {
  /** Type of the message. */
  @serializable(1)
  readonly type = MPCMessageTypeValues.setName;

  /** The name to set. */
  @serializable(Constants.maxNameByteSize + 1) // +1 for null terminator
  name = "";
}

/**
 * Message send by a MPC to notify of its internal temperature.
 * @category Message
 */
export class Temperature implements PixelMessage {
  /** Type of the message. */
  @serializable(1)
  readonly type = MPCMessageTypeValues.temperature;

  /**
   * The microcontroller temperature, in celsius, times 100 (i.e. 500 == 5 degrees C).
   * If the charger was unable to read the temperature, value will be 0xffff.
   */
  @serializable(2)
  mcuTemperatureTimes100 = 0;

  /**
   * The battery temperature, in celsius, times 100 (i.e. 500 == 5 degrees C).
   */
  @serializable(2)
  batteryTemperatureTimes100 = 0;
}

export class SynchronizeTime implements PixelMessage {
  /** Type of the message. */
  @serializable(1)
  readonly type = MPCMessageTypeValues.synchronizeTime;

  @serializable(2)
  inThisManyMs = 0;

  @serializable(4)
  itWillBeThisManyMs = 0;
}

export const serializer = new MessageSerializer<MPCMessageType>(
  Object.entries(MPCMessageTypeValues) as [MPCMessageType, number][],
  [
    LegacyIAmAMPC,
    BulkSetup,
    BulkData,
    BulkDataAck,
    DebugLog,
    Blink,
    PlayAnimation,
    StopAnimation,
    RequestRssi,
    Rssi,
    NotifyUser,
    NotifyUserAck,
    SetName,
    Temperature,
    SynchronizeTime,
  ]
);
