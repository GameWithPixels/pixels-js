import { getValueKeyName } from "@systemic-games/pixels-core-utils";
import {
  PixelRollState,
  PixelBatteryState,
  BatteryControllerState,
  Telemetry,
  PixelRollStateValues,
  PixelBatteryStateValues,
  PixelBatteryControllerStateValues,
} from "@systemic-games/react-native-pixels-connect";

export type TelemetryData = {
  appTimestamp: number;
  fwTimestamp: number;
  accX: number;
  accY: number;
  accZ: number;
  faceConfidence: number;
  rollState: PixelRollState;
  faceIndex: number;
  battery: number;
  batteryState: PixelBatteryState;
  batteryControllerState: BatteryControllerState;
  voltage: number;
  voltageCoil: number;
  rssi: number;
  rssiChannelIndex: number;
  mcuTemperature: number;
  batteryTemperature: number;
  internalChargeState: boolean;
  forceDisableChargingState: boolean;
  ledCurrent: number;
};

export function toTelemetryData(telemetry: Telemetry): TelemetryData {
  return {
    appTimestamp: Date.now(),
    fwTimestamp: telemetry.timeMs,
    accX: telemetry.accXTimes1000 / 1000,
    accY: telemetry.accYTimes1000 / 1000,
    accZ: telemetry.accZTimes1000 / 1000,
    faceConfidence: telemetry.faceConfidenceTimes1000 / 1000,
    rollState:
      getValueKeyName(telemetry.rollState, PixelRollStateValues) ?? "unknown",
    faceIndex: telemetry.faceIndex,
    battery: telemetry.batteryLevelPercent,
    batteryState:
      getValueKeyName(telemetry.batteryState, PixelBatteryStateValues) ??
      "error",
    batteryControllerState:
      getValueKeyName(
        telemetry.batteryControllerState,
        PixelBatteryControllerStateValues
      ) ?? "unknown",
    voltage: telemetry.voltageTimes50 / 50,
    voltageCoil: telemetry.vCoilTimes50 / 50,
    rssi: telemetry.rssi,
    rssiChannelIndex: telemetry.channelIndex,
    mcuTemperature: telemetry.mcuTemperatureTimes100 / 100,
    batteryTemperature: telemetry.batteryTemperatureTimes100 / 100,
    internalChargeState: telemetry.internalChargeState,
    forceDisableChargingState: telemetry.forceDisableChargingState,
    ledCurrent: telemetry.ledCurrent,
  };
}
