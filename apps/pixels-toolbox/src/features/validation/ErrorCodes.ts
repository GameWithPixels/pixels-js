import { assert } from "@systemic-games/pixels-core-utils";

export const TaskNames = [
  "UpdateFirmware", // 1
  "ConnectPixel", // 2
  "WaitCharging", // 3
  "CheckBoard", // 4
  "WaitNotCharging", // 5
  "CheckLEDs", // 6
  "WaitFaceUp", // 7
  "StoreSettings", // 8
  "PrepareDevice", // 9
  "WaitDieInCase", // 10
  "TurnOffDevice", // 11
  "LabelPrinting", // 12
  "CheckLabel", // 13
] as const;

export function getTaskErrorCode(
  taskName: (typeof TaskNames)[number]
): number | undefined {
  const index = TaskNames.indexOf(taskName);
  if (index >= 0) {
    // In case the task name is not found (despite the type check)
    return 100 * (index + 1);
  }
}

const updateFirmwareErrorCode = getTaskErrorCode("UpdateFirmware");
assert(
  updateFirmwareErrorCode !== undefined,
  "UpdateFirmware must have an error code"
);

const connectPixelErrorCode = getTaskErrorCode("ConnectPixel");
assert(
  connectPixelErrorCode !== undefined,
  "ConnectPixel must have an error code"
);

const checkBoardErrorCode = getTaskErrorCode("CheckBoard");
assert(checkBoardErrorCode !== undefined, "CheckBoard must have an error code");

const storeSettingsErrorCode = getTaskErrorCode("StoreSettings");
assert(
  storeSettingsErrorCode !== undefined,
  "StoreSettings must have an error code"
);

const prepareDeviceErrorCode = getTaskErrorCode("PrepareDevice");
assert(
  prepareDeviceErrorCode !== undefined,
  "PrepareDevice must have an error code"
);

export const ErrorCodes = {
  // General errors
  Timeout: 1,
  Disconnected: 2,
  SendMessageFailed: 3,
  // Update Firmware errors
  DfuAborted: updateFirmwareErrorCode + 10,
  FirmwareUpdateFailed: updateFirmwareErrorCode + 20,
  // Connect Pixel errors
  InvalidLedCount: connectPixelErrorCode + 10,
  LEDCountMismatch: connectPixelErrorCode + 20,
  ConnectionError: connectPixelErrorCode + 30,
  DieTypeMismatch: connectPixelErrorCode + 40,
  // Check Board errors
  AccelerationInvalidValue: checkBoardErrorCode + 10,
  BatteryOutOfRangeVoltage: checkBoardErrorCode + 20,
  LowRSSI: checkBoardErrorCode + 30,
  LowBattery: checkBoardErrorCode + 40,
  // Store Settings errors
  StoreValueFailed: storeSettingsErrorCode + 10,
  // Prepare Device errors
  SetNotReady: prepareDeviceErrorCode + 10,
} as const;

assert(
  ((arr: number[]) => arr.length === new Set(arr).size)(
    Object.values(ErrorCodes)
  ),
  "ErrorCodes must have unique values"
);
