import { assert, delay, safeAssign } from "@systemic-games/pixels-core-utils";
import {
  Color,
  Pixel,
  PixelStatus,
  LedLoopback,
  MessageTypeValues,
  RequestTelemetry,
  Telemetry,
  DataSet,
  MessageOrType,
  RollState,
  PixelRollStateValues,
  TelemetryRequestModeValues,
  RequestRssi,
  Rssi,
  PixelBatteryStateValues,
  PixelBatteryData,
} from "@systemic-games/react-native-pixels-connect";

import { TaskCanceledError, TaskFaultedError } from "../tasks/useTask";

function vectNorm(x: number, y: number, z: number): number {
  return Math.sqrt(x * x + y * y + z * z);
}

function vectToString(x: number, y: number, z: number): string {
  return `(${x.toFixed(3)}, ${y.toFixed(3)}, ${z.toFixed(3)})`;
}

async function blinkForever(
  pixel: Pixel,
  blinkColor: Color,
  abortSignal: AbortSignal,
  options?: {
    faceMask?: number;
    duration?: number;
    waitDuration?: number;
  }
) {
  let started = false;
  try {
    if (!abortSignal.aborted) {
      await pixel.stopAllAnimations();
    }
    const duration = options?.duration ?? 1000;
    const delayDuration = options?.waitDuration ?? duration;
    while (!abortSignal.aborted) {
      started = true;
      await pixel.blink(blinkColor, {
        count: 1,
        duration,
        faceMask: options?.faceMask,
      });
      await delay(delayDuration, abortSignal);
    }
  } finally {
    if (started) {
      await pixel.stopAllAnimations();
    }
  }
}

const ValidationTests = {
  checkLedLoopback: async (pixel: Pixel): Promise<void> => {
    const msg = await pixel.sendAndWaitForResponse(
      MessageTypeValues.testLedLoopback,
      MessageTypeValues.ledLoopback
    );
    const ledLoopback = msg as LedLoopback;
    console.log(`LED loopback value: ${ledLoopback.value}`);
    if (!ledLoopback.value) {
      throw new Error(`Unexpected LED loopback value: ${ledLoopback.value}`);
    }
  },

  checkBatteryVoltage: async (pixel: Pixel): Promise<void> => {
    const response = await pixel.sendAndWaitForResponse(
      safeAssign(new RequestTelemetry(), {
        requestMode: TelemetryRequestModeValues.once,
      }),
      MessageTypeValues.telemetry
    );
    const telemetry = response as Telemetry;
    const voltage = telemetry.voltageTimes50 / 50;
    console.log(
      `Battery voltage: ${voltage.toFixed(2)} V,` +
        ` level: ${telemetry.batteryLevelPercent} %,` +
        ` charging: ${
          telemetry.batteryState >= PixelBatteryStateValues.charging
        }`
    );
    if (voltage < 3 || voltage > 5) {
      throw new Error(`Out of range battery voltage: ${voltage}`);
    }
  },

  checkRssi: async (pixel: Pixel): Promise<void> => {
    const rssi = (await pixel.sendAndWaitForResponse(
      safeAssign(new RequestRssi(), {
        requestMode: TelemetryRequestModeValues.once,
      }),
      MessageTypeValues.telemetry
    )) as Rssi;

    console.log(`RSSI is ${rssi}`);
    if (rssi.value < -70) {
      throw new Error(`Out of range RSSI value: ${rssi}`);
    }
  },

  waitCharging: async (
    pixel: Pixel,
    shouldBeCharging: boolean,
    abortSignal: AbortSignal
  ): Promise<void> => {
    await new Promise<void>((resolve, reject) => {
      const batteryHandler = ({ isCharging }: PixelBatteryData) => {
        if (isCharging === shouldBeCharging) {
          pixel.removeEventListener("battery", batteryHandler);
          resolve();
        }
      };
      const abort = () => {
        pixel.removeEventListener("battery", batteryHandler);
        reject(new TaskCanceledError("waitCharging"));
      };
      if (abortSignal.aborted) {
        abort();
      } else if (pixel.isCharging === shouldBeCharging) {
        resolve();
      } else {
        abortSignal.addEventListener("abort", abort);
        pixel.addEventListener("battery", batteryHandler);
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
      safeAssign(new RequestTelemetry(), {
        requestMode: TelemetryRequestModeValues.repeat,
      })
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
              abortSignal.removeEventListener("abort", abort); // TODO finally
              reject(error);
            }
          };
          pixel.addMessageListener("telemetry", onTelemetry);
        }
      });
    } finally {
      if (onTelemetry) {
        pixel.removeMessageListener("telemetry", onTelemetry);
      }
      // Turn off telemetry
      await pixel.sendMessage(
        safeAssign(new RequestTelemetry(), {
          requestMode: TelemetryRequestModeValues.off,
        })
      );
    }
  },

  checkAccelerationDownward: (
    pixel: Pixel,
    abortSignal: AbortSignal,
    maxNormDeviation = 0.2
  ): Promise<void> => {
    return ValidationTests.checkAccelerometer(
      pixel,
      (x, y, z) => {
        if (Math.abs(1 - vectNorm(x, y, z)) > maxNormDeviation) {
          throw new Error(
            "Out of range accelerometer value: " + vectToString(x, y, z)
          );
        }
        return true;
      },
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
    blinkColor: Color,
    abortSignal: AbortSignal
  ): Promise<void> => {
    assert(face > 0);
    await new Promise<void>((resolve, reject) => {
      const blinkAbortController = new AbortController();
      const abort = () => {
        blinkAbortController.abort();
        reject(new TaskCanceledError("waitFaceUp"));
      };
      if (abortSignal.aborted) {
        abort();
      } else {
        abortSignal.addEventListener("abort", abort);
        // Blink face
        const blinkAS = blinkAbortController.signal;
        const options = {
          faceMask: 1, // TODO use face mapping
        };
        blinkForever(pixel, blinkColor, blinkAS, options).catch(() => {});
        // Wait on face
        const waitOnFace = async () => {
          let rollState = (await pixel.sendAndWaitForResponse(
            MessageTypeValues.requestRollState,
            MessageTypeValues.rollState
          )) as RollState;
          while (
            !abortSignal.aborted &&
            (rollState.state !== PixelRollStateValues.onFace ||
              rollState.faceIndex !== face - 1)
          ) {
            await delay(200, abortSignal);
            rollState = (await pixel.sendAndWaitForResponse(
              MessageTypeValues.requestRollState,
              MessageTypeValues.rollState
            )) as RollState; // TODO subscribe on "roll" events
          }
          abortSignal.removeEventListener("abort", abort); // TODO finally
          if (!abortSignal.aborted) {
            blinkAbortController.abort();
            resolve();
          }
        };
        waitOnFace().catch(() => {});
      }
    });
  },

  checkLEDsLitUp: async (
    pixel: Pixel,
    color: Color,
    setResolve: (resolve: () => void) => void,
    abortSignal: AbortSignal
  ) => {
    await new Promise<void>((resolve, reject) => {
      const blinkAbortController = new AbortController();
      const abort = () => {
        blinkAbortController.abort();
        reject(new TaskCanceledError("checkLEDsLitUp"));
      };
      if (abortSignal.aborted) {
        abort();
      } else {
        abortSignal.addEventListener("abort", abort);
        // Show solid color
        const blinkSA = blinkAbortController.signal;
        const duration = 40000;
        const options = {
          duration,
          waitDuration: duration / 2,
        };
        // TODO use SetAllLEDsToColor message
        blinkForever(pixel, color, blinkSA, options).catch(() => {});
        // Wait on promised being resolved
        setResolve(() => {
          abortSignal.removeEventListener("abort", abort); // TODO finally
          if (!abortSignal.aborted) {
            blinkAbortController.abort();
            resolve();
          }
        });
      }
    });
  },

  renameDie: async (_pixel: Pixel, _name = "Pixel"): Promise<void> => {
    // TODO await pixel.rename(name);
  },

  exitValidationMode: async (pixel: Pixel): Promise<void> => {
    // Back out validation mode, don't wait for response as die will restart
    await pixel.sendMessage(MessageTypeValues.exitValidation, true);
  },

  waitDisconnected: async (
    pixel: Pixel,
    blinkColor: Color,
    abortSignal: AbortSignal
  ) => {
    if (pixel.status !== "ready") {
      throw new TaskFaultedError(
        `Pixel is not ready, status is ${pixel.status}`
      );
    }

    let statusListener: ((status: PixelStatus) => void) | undefined;
    try {
      await new Promise<void>((resolve, reject) => {
        const blinkAbortController = new AbortController();
        const abort = () => {
          blinkAbortController.abort();
          reject(new TaskCanceledError("waitDisconnected"));
        };
        if (abortSignal.aborted) {
          abort();
        } else {
          abortSignal.addEventListener("abort", abort);
          // Blink face
          const blinkAS = blinkAbortController.signal;
          blinkForever(pixel, blinkColor, blinkAS).catch(() => {});
          // Wait on connection status change
          statusListener = (status: PixelStatus) => {
            if (status === "disconnected") {
              abortSignal.removeEventListener("abort", abort); // TODO finally
              blinkAbortController.abort();
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
