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
  PixelStatus,
  MessageOrType,
} from "@systemic-games/react-native-pixels-connect";
import { acc } from "react-native-reanimated";

import delay from "../delay";
import { TaskCanceledError, TaskFaultedError } from "./tasks/useTask";

function vectNorm(x: number, y: number, z: number): number {
  return Math.sqrt(x * x + y * y + z * z);
}

function vectToString(x: number, y: number, z: number): string {
  return `(${x.toFixed(3)}, ${y.toFixed(3)}, ${z.toFixed(3)})`;
}

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

  waitCharging: async (
    pixel: Pixel,
    shouldBeCharging: boolean,
    abortSignal: AbortSignal
  ): Promise<void> => {
    await new Promise<void>((resolve, reject) => {
      const abort = () => reject(new TaskCanceledError("checkAccelerometer"));
      if (abortSignal.aborted) {
        abort();
      } else {
        abortSignal.addEventListener("abort", abort);
        const wait = async () => {
          let batteryLevel = await pixel.getBatteryLevel();
          while (
            !abortSignal.aborted &&
            batteryLevel.charging !== shouldBeCharging
          ) {
            await delay(200, abortSignal);
            batteryLevel = await pixel.getBatteryLevel(); // TODO abortSignal
          }
          if (!abortSignal.aborted) {
            abortSignal.removeEventListener("abort", abort);
            resolve();
          }
        };
        wait().catch(() => {});
      }
    });
  },

  checkAccelerometer: async (
    pixel: Pixel,
    checkAcc: (x: number, y: number, z: number) => boolean,
    abortSignal: AbortSignal
  ): Promise<void> => {
    // Turn on telemetry and wait for data
    await pixel.sendMessage(
      safeAssign(new RequestTelemetry(), { activate: true })
    );
    let onTelemetry: ((msg: MessageOrType) => void) | undefined;
    try {
      await new Promise<void>((resolve, reject) => {
        const abort = () => reject(new TaskCanceledError("checkAccelerometer"));
        if (abortSignal.aborted) {
          abort();
        } else {
          abortSignal.addEventListener("abort", abort);
          onTelemetry = (msg) => {
            const { accX, accY, accZ } = msg as Telemetry;
            const n = vectNorm(accX, accY, accZ);
            console.log(
              `Acceleration: ${vectToString(accX, accY, accZ)}, norm=${n}`
            );
            try {
              if (checkAcc(accX, accY, accZ)) {
                abortSignal.removeEventListener("abort", abort);
                resolve();
              }
            } catch (error) {
              abortSignal.removeEventListener("abort", abort);
              reject(error);
            }
          };
          pixel.addMessageListener("Telemetry", onTelemetry);
        }
      });
    } finally {
      if (onTelemetry) {
        pixel.removeMessageListener("Telemetry", onTelemetry);
      }
      // Turn off telemetry
      await pixel.sendMessage(
        safeAssign(new RequestTelemetry(), { activate: false })
      );
    }
  },

  checkAccelerationDownward: (
    pixel: Pixel,
    abortSignal: AbortSignal
  ): Promise<void> => {
    return ValidationTests.checkAccelerometer(
      pixel,
      (x, y, z) => {
        if (Math.abs(vectNorm(x, y, z) - 1) > 0.2) {
          throw new Error(
            "Out of range accelerometer value: " + vectToString(x, y, z)
          );
        }
        return true;
      },
      abortSignal
    );
  },

  checkAccelerationShake: (
    pixel: Pixel,
    abortSignal: AbortSignal
  ): Promise<void> => {
    return ValidationTests.checkAccelerometer(
      pixel,
      (x, y, z) => Math.abs(vectNorm(x, y, z) - 1) > 0.3,
      abortSignal
    );
  },

  updateProfile: async (
    pixel: Pixel,
    profile: DataSet,
    progressCallback?: (progress: number) => void
    // TODO abortSignal: AbortSignal
  ): Promise<void> => {
    // Reset progress
    progressCallback?.(-1);
    // Upload profile
    try {
      await pixel.transferDataSet(profile, progressCallback);
    } finally {
      // Reset progress
      progressCallback?.(-1);
    }
  },

  waitFaceUp: async (
    pixel: Pixel,
    face: number,
    abortSignal: AbortSignal
  ): Promise<void> => {
    assert(face > 0);

    const blinkForever = async () => {
      try {
        while (!abortSignal.aborted) {
          await pixel.blink(Color.dimMagenta, {
            count: 1,
            duration: 1000,
            faceMask: 1 << (face - 1),
          });
          await delay(1000, abortSignal);
        }
      } finally {
        await pixel.stopAllAnimations();
      }
    };
    blinkForever().catch(() => {});

    await new Promise<void>((resolve, reject) => {
      const abort = () => reject(new TaskCanceledError("waitFaceUp"));
      if (abortSignal.aborted) {
        abort();
      } else {
        abortSignal.addEventListener("abort", abort);
        const waitOnFace = async () => {
          let rollState = await pixel.getRollState();
          while (
            !abortSignal.aborted &&
            (rollState.state !== PixelRollStateValues.OnFace ||
              rollState.faceIndex !== face - 1)
          ) {
            await delay(200, abortSignal);
            rollState = await pixel.getRollState(); // TODO abortSignal
          }
          if (!abortSignal.aborted) {
            abortSignal.removeEventListener("abort", abort);
            resolve();
          }
        };
        waitOnFace().catch(() => {});
      }
    });
  },

  checkLedsWhite: async (
    pixel: Pixel,
    setResolve: (resolve: () => void) => void,
    abortSignal: AbortSignal
  ) => {
    const litForever = async () => {
      const duration = 20000;
      // TODO use SetAllLEDsToColor message
      while (!abortSignal.aborted) {
        await pixel.blink(new Color(0.1, 0.1, 0.1), {
          count: 1,
          duration: 2 * duration,
        }); // TODO abortSignal
        await delay(duration, abortSignal);
        //await Promise.allSettled([blink(), wait()]);
        await pixel.stopAllAnimations(); // TODO use blink `count = 0` instead
      }
    };
    litForever().catch(() => {});

    await new Promise<void>((resolve, reject) => {
      const abort = () => reject(new TaskCanceledError("checkLedsWhite"));
      if (abortSignal.aborted) {
        abort();
      } else {
        abortSignal.addEventListener("abort", abort);
        setResolve(() => {
          if (!abortSignal.aborted) {
            abortSignal.removeEventListener("abort", abort);
            resolve();
          }
        });
      }
    });
  },

  renameDie: async (pixel: Pixel, name = "Pixel"): Promise<void> => {
    // TODO await pixel.rename(name);
  },

  exitValidationMode: async (pixel: Pixel): Promise<void> => {
    // Back out validation mode, don't wait for response as die will restart
    await pixel.sendMessage(MessageTypeValues.ExitValidation, true);
  },

  waitDisconnected: async (pixel: Pixel, abortSignal: AbortSignal) => {
    if (pixel.status !== "ready") {
      throw new TaskFaultedError(
        `Pixel is not ready, status is ${pixel.status}`
      );
    }
    await pixel.blink(new Color(0.03, 0.2, 0), {
      count: 1,
      duration: 40000,
    });

    let statusListener: ((status: PixelStatus) => void) | undefined;
    try {
      await new Promise<void>((resolve, reject) => {
        const abort = () => reject(new TaskCanceledError("waitDisconnected"));
        if (abortSignal.aborted) {
          abort();
        } else {
          abortSignal.addEventListener("abort", abort);
          statusListener = (status: PixelStatus) => {
            if (status === "disconnected") {
              abortSignal.removeEventListener("abort", abort);
              resolve();
            }
          };
          pixel.addEventListener("status", statusListener);
        }
      });
    } finally {
      if (statusListener) {
        pixel.removeEventListener("status", statusListener);
      }
    }
  },
} as const;

export default ValidationTests;
