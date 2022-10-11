import { safeAssign } from "@systemic-games/pixels-core-utils";
import {
  Pixel,
  LedLoopback,
  MessageTypeValues,
  RequestTelemetry,
  Telemetry,
} from "@systemic-games/react-native-pixels-connect";

export default async function (pixel: Pixel): Promise<boolean> {
  async function checkLedLoopback() {
    const msg = await pixel.sendAndWaitForResponse(
      MessageTypeValues.TestLedLoopback,
      MessageTypeValues.LedLoopback
    );
    const ledLoopback = msg as LedLoopback;
    console.log(`LED loopback value: ${ledLoopback.value}`);
    if (!ledLoopback.value) {
      throw new Error(`Unexpected LED loopback value: ${ledLoopback.value}`);
    }
  }

  async function checkAccelerometer() {
    // Turn on telemetry and wait for data
    const msg = await pixel.sendAndWaitForResponse(
      safeAssign(new RequestTelemetry(), { activate: true }),
      MessageTypeValues.Telemetry
    );
    const telemetry = msg as Telemetry;
    const accVectStr =
      `(${telemetry.accX.toFixed(3)},` +
      ` ${telemetry.accY.toFixed(3)},` +
      ` ${telemetry.accZ.toFixed(3)})`;
    console.log(`Acceleration: ${accVectStr}`);
    // Check that the acceleration is close enough to -Z
    if (telemetry.accZ < -1 || telemetry.accZ > -0.9) {
      throw new Error(`Out of range accelerometer value: ${accVectStr}`);
    }
    // Turn off telemetry
    await pixel.sendMessage(
      safeAssign(new RequestTelemetry(), { activate: false })
    );
  }

  async function checkBatteryVoltage() {
    const batteryLevel = await pixel.getBatteryLevel();
    const voltageStr = batteryLevel.voltage.toFixed(3);
    console.log(
      `Battery voltage: ${voltageStr} V,` +
        ` level: ${batteryLevel.level.toFixed(3)},` +
        ` charging: ${batteryLevel.charging}`
    );
    if (batteryLevel.voltage < 3 || batteryLevel.voltage > 5) {
      throw new Error(`Out of range battery voltage: ${voltageStr}`);
    }
  }

  async function checkRssi() {
    const rssi = await pixel.getRssi();
    console.log(`RSSI is ${rssi}`);
    if (rssi < -60) {
      throw new Error(`Out of range RSSI value: ${rssi}`);
    }
  }

  try {
    await checkLedLoopback();
    await checkAccelerometer();
    await checkBatteryVoltage();
    await checkRssi();
    console.log("Validation tests succeeded");
    return true;
  } catch (error) {
    console.warn(`Validation test failed: ${error}`);
    return false;
  }
}
