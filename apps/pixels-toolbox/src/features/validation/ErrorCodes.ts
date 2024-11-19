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
  "PrepareDie", // 9
  "WaitDieInCase", // 10
  "TurnOffDevice", // 11
  "LabelPrinting", // 12
  "CheckLabel", // 13
] as const;

export const ErrorCodes = {
  // General errors
  Timeout: 1,
  Disconnected: 2,
  // Errors for specific tasks
  AccelerationInvalidValue: 100 * (TaskNames.indexOf("CheckBoard") + 1) + 10,
  BatteryOutOfRangeVoltage: 100 * (TaskNames.indexOf("CheckBoard") + 1) + 20,
} as const;

assert(
  ((arr: number[]) => arr.length === new Set(arr).size)(
    Object.values(ErrorCodes)
  ),
  "ErrorCodes must have unique values"
);

export function getTaskErrorCode(
  taskName: (typeof TaskNames)[number]
): number | undefined {
  const index = TaskNames.indexOf(taskName);
  if (index >= 0) {
    // In case the task name is not found (despite the type check)
    return 100 * (index + 1);
  }
}
