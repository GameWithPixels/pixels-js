import { assert, safeAssign } from "@systemic-games/pixels-core-utils";
import {
  Pixel,
  LedLoopback,
  MessageTypeValues,
  RequestTelemetry,
  Telemetry,
  DataSet,
  Color,
  PixelRollStateValues,
} from "@systemic-games/react-native-pixels-connect";

import delay from "./delay";

const ValidationTests = {
  checkLedLoopback: async (pixel: Pixel): Promise<void> => {
    const msg = await pixel.sendAndWaitForResponse(
      MessageTypeValues.TestLedLoopback,
      MessageTypeValues.LedLoopback
    );
    const ledLoopback = msg as LedLoopback;
    console.log(`LED loopback value: ${ledLoopback.value}`);
    if (!ledLoopback.value) {
      throw new Error(`Unexpected LED loopback value: ${ledLoopback.value}`);
    }
  },

  checkAccelerometer: async (pixel: Pixel): Promise<void> => {
    // Turn on telemetry and wait for data
    const msg = await pixel.sendAndWaitForResponse(
      safeAssign(new RequestTelemetry(), { activate: true }),
      MessageTypeValues.Telemetry
    );
    try {
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
    } finally {
      // Turn off telemetry
      await pixel.sendMessage(
        safeAssign(new RequestTelemetry(), { activate: false })
      );
    }
  },

  waitForBoardFlicked: async (pixel: Pixel): Promise<void> => {
    // Turn on telemetry and wait for data
    await pixel.sendMessage(
      safeAssign(new RequestTelemetry(), { activate: true })
    );
    try {
      const promise = new Promise<void>((resolve, reject) => {
        pixel.addMessageListener("Telemetry", (msg) => {
          const telemetry = msg as Telemetry;
          const accVectStr =
            `(${telemetry.accX.toFixed(3)},` +
            ` ${telemetry.accY.toFixed(3)},` +
            ` ${telemetry.accZ.toFixed(3)})`;
          console.log(`Acceleration: ${accVectStr}`);
          if (telemetry.accZ > 0) {
            resolve();
          }
        });
      });
      await promise;
    } finally {
      // Turn off telemetry
      await pixel.sendMessage(
        safeAssign(new RequestTelemetry(), { activate: false })
      );
    }
  },

  checkBatteryVoltage: async (pixel: Pixel): Promise<void> => {
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
  },

  checkRssi: async (pixel: Pixel): Promise<void> => {
    const rssi = await pixel.getRssi();
    console.log(`RSSI is ${rssi}`);
    if (rssi < -70) {
      throw new Error(`Out of range RSSI value: ${rssi}`);
    }
  },

  updateProfile: async (
    pixel: Pixel,
    profile: DataSet,
    progressCallback?: (progress: number) => void
  ): Promise<void> => {
    progressCallback?.(-1);

    // Upload profile
    try {
      await pixel.transferDataSet(profile, progressCallback);
    } finally {
      progressCallback?.(-1);
    }
  },

  waitFaceUp: async (pixel: Pixel, face: number): Promise<void> => {
    assert(face > 0);
    try {
      const waitTimeout = async (timeout = 30000) => {
        const abortTime = Date.now() + timeout;

        await pixel.blink(Color.dimMagenta, {
          count: timeout / 2000,
          duration: 30000,
          faceMask: 1 << (face - 1),
        });

        let rollState = await pixel.getRollState();
        while (
          rollState.state !== PixelRollStateValues.OnFace ||
          rollState.faceIndex !== face - 1
        ) {
          await delay(200);
          rollState = await pixel.getRollState();
          if (Date.now() > abortTime) {
            return false;
          }
        }
        return true;
      };
      while (!(await waitTimeout()));
    } finally {
      try {
        await pixel.stopAllAnimations();
      } catch {}
    }
  },

  renameDie: async (pixel: Pixel, name = "Pixel"): Promise<void> => {
    //await pixel.rename(name);
  },

  exitValidationMode: async (pixel: Pixel): Promise<void> => {
    // Back out validation mode, don't wait for response as die will restart
    await pixel.sendMessage(MessageTypeValues.ExitValidation, true);
  },

  checkAll: async (pixel: Pixel): Promise<boolean> => {
    try {
      console.log("Starting validation tests");
      await ValidationTests.checkLedLoopback(pixel);
      await ValidationTests.checkAccelerometer(pixel);
      await ValidationTests.checkBatteryVoltage(pixel);
      await ValidationTests.checkRssi(pixel);
      console.log("Validation tests successful");
      return true;
    } catch (error) {
      console.warn(`Validation test failed: ${error}`);
      return false;
    }
  },
} as const;

export default ValidationTests;
