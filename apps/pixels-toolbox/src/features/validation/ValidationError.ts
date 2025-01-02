import {
  PixelDieType,
  StoreValueResult,
} from "@systemic-games/react-native-pixels-connect";
import { useTranslation } from "react-i18next";

import { ErrorCodes } from "./ErrorCodes";

import { LocalizedError } from "~/features/LocalizedError";
import { vectToString } from "~/features/vectToString";

export abstract class ValidationError extends LocalizedError {
  abstract errorCode: number;
}

export class DfuAbortedError extends ValidationError {
  readonly errorCode = ErrorCodes.DfuAborted;
  constructor() {
    super("Firmware update aborted");
    this.name = "ConnectionError";
  }
  toLocalizedString(_: ReturnType<typeof useTranslation>["t"]): string {
    return this.message; // No translation needed, this error shouldn't happen ;)
  }
}

export class FirmwareUpdateError extends ValidationError {
  readonly errorCode = ErrorCodes.FirmwareUpdateFailed;
  constructor(cause: unknown) {
    super("Firmware update aborted");
    this.name = "ConnectionError";
    this.cause = cause;
  }
  toLocalizedString(t: ReturnType<typeof useTranslation>["t"]): string {
    return `${t("dfuErrorTryAgain")} ${this.cause}`;
  }
}

export class ConnectionError extends ValidationError {
  readonly errorCode = ErrorCodes.ConnectionError;
  constructor(cause: unknown) {
    super(`Connection error: ${cause}`);
    this.name = "ConnectionError";
    this.cause = cause;
  }
  toLocalizedString(t: ReturnType<typeof useTranslation>["t"]): string {
    return t("connectionErrorTryAgain") + ` ${this.cause}`;
  }
}

export class InvalidLedCountError extends ValidationError {
  readonly errorCode = ErrorCodes.InvalidLedCount;
  readonly ledCount: number;
  constructor(ledCount: number) {
    super(`Invalid LED count:  ${ledCount}`);
    this.name = "InvalidLedCountError";
    this.ledCount = ledCount;
  }
  toLocalizedString(t: ReturnType<typeof useTranslation>["t"]): string {
    return t("invalidLedCountWithValue", { value: this.ledCount });
  }
}

export class LedCountMismatchError extends ValidationError {
  readonly errorCode = ErrorCodes.LEDCountMismatch;
  readonly ledCount: number;
  readonly dieType: PixelDieType;
  constructor(dieType: PixelDieType, ledCount: number) {
    super(`LED count mismatch: expected ${dieType} but got ${ledCount} LEDs`);
    this.name = "DieTypeMismatchError";
    this.dieType = dieType;
    this.ledCount = ledCount;
  }
  toLocalizedString(t: ReturnType<typeof useTranslation>["t"]): string {
    return t("dieTypeMismatchWithTypeAndLedCount", {
      dieType: t(this.dieType),
      ledCount: this.ledCount,
    });
  }
}

export class DieTypeMismatchError extends ValidationError {
  readonly errorCode = ErrorCodes.DieTypeMismatch;
  readonly expectedDieType: PixelDieType;
  readonly actualDieType: PixelDieType;
  constructor(expected: PixelDieType, actual: PixelDieType) {
    super(`Die type mismatch: expected ${expected} but got ${actual} LEDs`);
    this.name = "DieTypeMismatchError";
    this.expectedDieType = expected;
    this.actualDieType = actual;
  }
  toLocalizedString(t: ReturnType<typeof useTranslation>["t"]): string {
    return t("dieTypeMismatchWithExpectedAndActual", {
      expected: t(this.expectedDieType),
      actual: t(this.actualDieType),
    });
  }
}

export class AccelerationInvalidValueError extends ValidationError {
  readonly errorCode = ErrorCodes.AccelerationInvalidValue;
  readonly x: number;
  readonly y: number;
  readonly z: number;
  constructor(x: number, y: number, z: number) {
    super(`Invalid accelerometer value: ${vectToString(x, y, z)}`);
    this.name = "AccelerationInvalidValueError";
    this.x = x;
    this.y = y;
    this.z = z;
  }
  toLocalizedString(t: ReturnType<typeof useTranslation>["t"]): string {
    return t("invalidAccelerometerWithValue", {
      value: vectToString(this.x, this.y, this.z),
    });
  }
}

export class BatteryOutOfRangeVoltageError extends ValidationError {
  readonly errorCode = ErrorCodes.BatteryOutOfRangeVoltage;
  readonly voltage: number;
  constructor(voltage: number) {
    super(`Out of range battery voltage: ${voltage}v`);
    this.name = "BatteryOutOfRangeVoltageError";
    this.voltage = voltage;
  }
  toLocalizedString(t: ReturnType<typeof useTranslation>["t"]): string {
    return t("outOfRangeBatteryVoltageWithValue", {
      value: this.voltage.toFixed(2),
    });
  }
}

export class LowRSSIError extends ValidationError {
  readonly errorCode = ErrorCodes.LowRSSI;
  readonly rssi: number;
  constructor(rssi: number) {
    super(`Low RSSI: ${rssi}`);
    this.name = "LowRSSIError";
    this.rssi = rssi;
  }
  toLocalizedString(t: ReturnType<typeof useTranslation>["t"]): string {
    return t("lowSignalStrengthWithValue", { value: Math.round(this.rssi) });
  }
}

export class LowBatteryError extends ValidationError {
  readonly errorCode = ErrorCodes.LowBattery;
  readonly level: number;
  constructor(level: number) {
    super(`Low battery level: ${Math.round(100 * level)}`);
    this.name = "BatteryOutOfRangeVoltageError";
    this.level = level;
  }
  toLocalizedString(t: ReturnType<typeof useTranslation>["t"]): string {
    return t("lowBatteryPleaseCharge");
  }
}

export class StoreValueError extends ValidationError {
  readonly errorCode = ErrorCodes.StoreValueFailed;
  readonly result: StoreValueResult;
  readonly valueType: number;
  constructor(result: StoreValueResult, valueType: number) {
    super(`Failed to store value of type ${valueType}: ${result}`);
    this.name = "StoreValueError";
    this.result = result;
    this.valueType = valueType;
  }
  toLocalizedString(t: ReturnType<typeof useTranslation>["t"]): string {
    return t("storeValueFailedWithResult", { result: this.result });
  }
}
