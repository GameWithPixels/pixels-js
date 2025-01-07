import { AnimConstants } from "@systemic-games/pixels-core-animation";
import {
  enumValue,
  serializable,
  byteSizeOf,
  range,
  getValueKeyName,
} from "@systemic-games/pixels-core-utils";

import { ChargerBatteryStateValues } from "./ChargerBatteryState";
import { ChunkMessage } from "./ChunkMessage";
import { Constants } from "./Constants";
import { MessageSerializer } from "./MessageSerializer";
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
export const ChargerMessageTypeValues = {
  none: enumValue(0),
  whoAreYou: enumValue(),
  iAmALCC: enumValue(),
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
  requestBatteryLevel: enumValue(),
  batteryLevel: enumValue(),
  requestRssi: enumValue(),
  rssi: enumValue(),
  notifyUser: enumValue(),
  notifyUserAck: enumValue(),
  storeValue: enumValue(),
  storeValueAck: enumValue(),
  programDefaultParameters: enumValue(),
  programDefaultParametersFinished: enumValue(),
  setName: enumValue(),
  setNameAck: enumValue(),
  powerOperation: enumValue(),
  exitValidation: enumValue(),
  requestTemperature: enumValue(),
  temperature: enumValue(),
  requestSlotsStatuses: enumValue(),
  slotsStatuses: enumValue(),

  // Testing
  testBulkSend: enumValue(),
  testBulkReceive: enumValue(),
  attractMode: enumValue(),
  printA2DReadings: enumValue(),
  printAnimationControllerState: enumValue(),
} as const;

/**
 * The names for the "enum" type {@link ChargerMessageTypeValues}.
 * @category Message
 */
export type ChargerMessageType = keyof typeof ChargerMessageTypeValues;

/**
 * Union type of {@link PixelMessage} and {@link ChargerMessageType} types.
 * Messages without parameter have no {@link PixelMessage} class to represent them,
 * instead they are represent by the corresponding {@link ChargerMessageTypeValues}.
 * @category Message
 */
export type ChargerMessageOrType = PixelMessage | ChargerMessageType;

/**
 * The different possible charger run modes.
 * @enum
 * @category Message
 */
export const ChargerRunModeValues = {
  user: enumValue(0),
  validation: enumValue(),
} as const;

/**
 * The names for the "enum" type {@link ChargerRunModeValues}.
 * @category Message
 */
export type ChargerRunMode = keyof typeof ChargerRunModeValues;

/**
 * Charger version info message chunk.
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
 * Charger general info message chunk.
 * @category Message
 */
export class ChargerInfoChunk implements ChunkMessage {
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
 * Charger name message chunk.
 * @category Message
 */
export class ChargerNameChunk implements ChunkMessage {
  @serializable(1)
  chunkSize = 0;

  @serializable(0, { terminator: true })
  name = "";
}

/**
 * Charger settings message chunk.
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
 * Charger status message chunk.
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
  batteryState = ChargerBatteryStateValues.ok;
}

/**
 * Message send by a Charger after receiving a "WhoAmI" message.
 * @category Message
 */
export class IAmALCC implements PixelMessage {
  @serializable(1)
  readonly type = ChargerMessageTypeValues.iAmALCC;

  readonly versionInfo = new VersionInfoChunk();
  readonly chargerInfo = new ChargerInfoChunk();
  readonly dieName = new ChargerNameChunk();
  readonly settingsInfo = new SettingsInfoChunk();
  readonly statusInfo = new StatusInfoChunk();
}

export class LegacyIAmALCC implements PixelMessage {
  /** Type of the message. */
  @serializable(1)
  readonly type = ChargerMessageTypeValues.iAmALCC;

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

  // Battery level

  /** The battery charge level in percent. */
  @serializable(1)
  batteryLevelPercent = 0;

  /** The charging state of the battery. */
  @serializable(1)
  batteryState = ChargerBatteryStateValues.ok;

  /** Byte size of the LegacyIAmALCC message. */
  static readonly expectedSize = 20;
}

/**
 * Message send to a Charger to request a transfer of data.
 * This is usually done after initiating an animation transfer request
 * and followed by BulkData messages with the actual data.
 * @category Message
 */
export class BulkSetup implements PixelMessage {
  /** Type of the message. */
  @serializable(1)
  readonly type = ChargerMessageTypeValues.bulkSetup;

  @serializable(2)
  size = 0;
}

/**
 * Message send to a Charger to request to transfer a piece of data.
 * A BulkSetup message must be send first.
 * @category Message
 */
export class BulkData implements PixelMessage {
  /** Type of the message. */
  @serializable(1)
  readonly type = ChargerMessageTypeValues.bulkData;

  @serializable(1)
  size = 0;
  @serializable(2)
  offset = 0;
  @serializable(Constants.maxMessageSize)
  data?: ArrayBufferLike;
}

/**
 * Message send by a Charger after receiving a BulkData request.
 * @category Message
 */
export class BulkDataAck implements PixelMessage {
  /** Type of the message. */
  @serializable(1)
  readonly type = ChargerMessageTypeValues.bulkDataAck;

  @serializable(2)
  offset = 0;
}

/**
 * Message send by a Charger to report a log message to the application.
 * @category Message
 */
export class DebugLog implements PixelMessage {
  /** Type of the message. */
  @serializable(1)
  readonly type = ChargerMessageTypeValues.debugLog;

  /** The message to log. */
  @serializable(0, { terminator: true })
  message = "";
}

/**
 * Message send to a Charger to have it blink its LEDs.
 * @category Message
 */
export class Blink implements PixelMessage {
  /** Type of the message. */
  @serializable(1)
  readonly type = ChargerMessageTypeValues.blink;

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
 * Message send by a Charger to notify of its battery level and state.
 * @category Message
 */
export class BatteryLevel implements PixelMessage {
  /** Type of the message. */
  @serializable(1)
  readonly type = ChargerMessageTypeValues.batteryLevel;

  /** The battery charge level in percent. */
  @serializable(1)
  levelPercent = 0;

  /** The charging state of the battery. */
  @serializable(1)
  state = ChargerBatteryStateValues.ok;
}

/**
 * Message send to a Charger to configure RSSI reporting.
 * @category Message
 */
export class RequestRssi implements PixelMessage {
  /** Type of the message. */
  @serializable(1)
  readonly type = ChargerMessageTypeValues.requestRssi;

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
 * Message send by a Charger to notify of its measured RSSI.
 * @category Message
 */
export class Rssi implements PixelMessage {
  /** Type of the message. */
  @serializable(1)
  readonly type = ChargerMessageTypeValues.rssi;

  /** The RSSI value, in dBm. */
  @serializable(1, { numberFormat: "signed" })
  value = 0;
}

/**
 * Message send by a Charger to request the application to show
 * a message to the user, and with optionally a required action.
 * @category Message
 */
export class NotifyUser implements PixelMessage {
  /** Type of the message. */
  @serializable(1)
  readonly type = ChargerMessageTypeValues.notifyUser;

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
 * Message send to a Charger in response to getting a NotifyUser request.
 * @category Message
 */
export class NotifyUserAck implements PixelMessage {
  /** Type of the message. */
  @serializable(1)
  readonly type = ChargerMessageTypeValues.notifyUserAck;

  /** Whether the use selected OK or Cancel. */
  @serializable(1)
  okCancel = false;
}

/**
 * Message send to a Charger to change its Bluetooth name.
 * @category Message
 */
export class SetName implements PixelMessage {
  /** Type of the message. */
  @serializable(1)
  readonly type = ChargerMessageTypeValues.setName;

  /** The name to set. */
  @serializable(Constants.maxNameByteSize + 1) // +1 for null terminator
  name = "";
}

/**
 * The different power operations available on a charger.
 * @enum
 * @category Message
 */
export const ChargerPowerOperationValues = {
  // Turn off all systems.
  turnOff: enumValue(0),
  // Reset die chip.
  reset: enumValue(),
} as const;

/**
 * The names for the "enum" type {@link ChargerPowerOperationValues}.
 * @category Message
 */
export type ChargerPowerOperation = keyof typeof ChargerPowerOperationValues;

/**
 * Message send to a Pixel to modify it's power state.
 * @category Message
 */
export class PowerOperation implements PixelMessage {
  /** Type of the message. */
  @serializable(1)
  readonly type = ChargerMessageTypeValues.powerOperation;

  /** The operation */
  @serializable(1)
  operation = ChargerPowerOperationValues.reset;
}

/**
 * Message send by a Charger to notify of its internal temperature.
 * @category Message
 */
export class Temperature implements PixelMessage {
  /** Type of the message. */
  @serializable(1)
  readonly type = ChargerMessageTypeValues.temperature;

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

/**
 * Message send to a Pixel to store a 32 bits value.
 * @category Message
 */
export class StoreValue implements PixelMessage {
  /** Type of the message. */
  @serializable(1)
  readonly type = ChargerMessageTypeValues.storeValue;

  /** Value to write. */
  @serializable(4)
  value = 0;
}

/**
 * The different possible result of requesting to store a value.
 * @enum
 * @category Message
 */
export const ChargerStoreValueResultValues = {
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
 * The names for the "enum" type {@link ChargerStoreValueResultValues}.
 * @category Message
 */
export type ChargerStoreValueResult =
  keyof typeof ChargerStoreValueResultValues;

/**
 * Message send by a Pixel is response to receiving a
 * {@link StoreValue} message.
 * @category Message
 */
export class StoreValueAck implements PixelMessage {
  /** Type of the message. */
  @serializable(1)
  readonly type = ChargerMessageTypeValues.storeValueAck;

  /** Store operation result. */
  @serializable(1)
  result = 0;

  /** Index at which the value was written. */
  @serializable(1)
  index = ChargerStoreValueResultValues.success;
}

/**
 * The different possible state of a charger slot.
 * @enum
 * @category Message
 */
export const ChargerSlotStateValues = {
  off: enumValue(0),
  charging: enumValue(),
  FOD: enumValue(),
} as const;

/**
 * The names for the "enum" type {@link ChargerSlotStateValues}.
 * @category Message
 */
export type ChargerSlotState = keyof typeof ChargerSlotStateValues;

/**
 * Message send by a Charger to reports its dice charger statuses
 * @category Message
 */
export class SlotsStatuses implements PixelMessage {
  /** Type of the message. */
  @serializable(1)
  readonly type = ChargerMessageTypeValues.slotsStatuses;

  // Slot 0
  @serializable(2, { numberFormat: "signed" })
  slot0RawCurrent = 0;
  @serializable(2, { numberFormat: "signed" })
  slot0Current = 0;
  @serializable(1)
  slot0State = ChargerSlotStateValues.off;
  @serializable(1)
  slot0DiePresent = false;
  @serializable(1)
  slot0Skipped = false;
  @serializable(1)
  slot0ChargedOnce = false;

  // Slot 1
  @serializable(2, { numberFormat: "signed" })
  slot1RawCurrent = 0;
  @serializable(2, { numberFormat: "signed" })
  slot1Current = 0;
  @serializable(1)
  slot1State = ChargerSlotStateValues.off;
  @serializable(1)
  slot1DiePresent = false;
  @serializable(1)
  slot1Skipped = false;
  @serializable(1)
  slot1ChargedOnce = false;

  // Slot 2
  @serializable(2, { numberFormat: "signed" })
  slot2RawCurrent = 0;
  @serializable(2, { numberFormat: "signed" })
  slot2Current = 0;
  @serializable(1)
  slot2State = ChargerSlotStateValues.off;
  @serializable(1)
  slot2DiePresent = false;
  @serializable(1)
  slot2Skipped = false;
  @serializable(1)
  slot2ChargedOnce = false;

  // Slot 3
  @serializable(2, { numberFormat: "signed" })
  slot3RawCurrent = 0;
  @serializable(2, { numberFormat: "signed" })
  slot3Current = 0;
  @serializable(1)
  slot3State = ChargerSlotStateValues.off;
  @serializable(1)
  slot3DiePresent = false;
  @serializable(1)
  slot3Skipped = false;
  @serializable(1)
  slot3ChargedOnce = false;

  // Slot 4
  @serializable(2, { numberFormat: "signed" })
  slot4RawCurrent = 0;
  @serializable(2, { numberFormat: "signed" })
  slot4Current = 0;
  @serializable(1)
  slot4State = ChargerSlotStateValues.off;
  @serializable(1)
  slot4DiePresent = false;
  @serializable(1)
  slot4Skipped = false;
  @serializable(1)
  slot4ChargedOnce = false;

  // Slot 5
  @serializable(2, { numberFormat: "signed" })
  slot5RawCurrent = 0;
  @serializable(2, { numberFormat: "signed" })
  slot5Current = 0;
  @serializable(1)
  slot5State = ChargerSlotStateValues.off;
  @serializable(1)
  slot5DiePresent = false;
  @serializable(1)
  slot5Skipped = false;
  @serializable(1)
  slot5ChargedOnce = false;

  // Slot 6
  @serializable(2, { numberFormat: "signed" })
  slot6RawCurrent = 0;
  @serializable(2, { numberFormat: "signed" })
  slot6Current = 0;
  @serializable(1)
  slot6State = ChargerSlotStateValues.off;
  @serializable(1)
  slot6DiePresent = false;
  @serializable(1)
  slot6Skipped = false;
  @serializable(1)
  slot6ChargedOnce = false;

  // Slot 7
  @serializable(2, { numberFormat: "signed" })
  slot7RawCurrent = 0;
  @serializable(2, { numberFormat: "signed" })
  slot7Current = 0;
  @serializable(1)
  slot7State = ChargerSlotStateValues.off;
  @serializable(1)
  slot7DiePresent = false;
  @serializable(1)
  slot7Skipped = false;
  @serializable(1)
  slot7ChargedOnce = false;

  asArray() {
    return range(0, 8).map((i) => ({
      // @ts-ignore
      rawCurrent: this[`slot${i}RawCurrent`] as number,
      // @ts-ignore
      current: this[`slot${i}Current`] as number,
      state: getValueKeyName(
        // @ts-ignore
        this[`slot${i}State`] as number,
        ChargerSlotStateValues
      ),
      // @ts-ignore
      diePresent: this[`slot${i}DiePresent`] as boolean,
      // @ts-ignore
      skipped: this[`slot${i}Skipped`] as boolean,
      // @ts-ignore
      chargedOnce: this[`slot${i}ChargedOnce`] as boolean,
    }));
  }
}

export type ChargerSlotStatus = ReturnType<SlotsStatuses["asArray"]>[0];

export const serializer = new MessageSerializer<ChargerMessageType>(
  Object.entries(ChargerMessageTypeValues) as [ChargerMessageType, number][],
  [
    LegacyIAmALCC,
    BulkSetup,
    BulkData,
    BulkDataAck,
    DebugLog,
    Blink,
    BatteryLevel,
    RequestRssi,
    Rssi,
    NotifyUser,
    NotifyUserAck,
    StoreValue,
    StoreValueAck,
    SetName,
    PowerOperation,
    Temperature,
    SlotsStatuses,
  ]
);
