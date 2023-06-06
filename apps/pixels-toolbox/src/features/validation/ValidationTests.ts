import { assert, delay, safeAssign } from "@systemic-games/pixels-core-utils";
import {
  Color,
  Pixel,
  PixelStatus,
  LEDLoopback,
  RequestTelemetry,
  Telemetry,
  DataSet,
  MessageOrType,
  TelemetryRequestModeValues,
  RequestRssi,
  Rssi,
  PixelBatteryStateValues,
  PixelBatteryData,
  getFaceMask,
  PixelRollData,
} from "@systemic-games/react-native-pixels-connect";

import { TaskCanceledError, TaskFaultedError } from "~/features/tasks/useTask";

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
    blinkDuration?: number;
  }
) {
  if (!abortSignal.aborted) {
    await pixel.stopAllAnimations();
  }
  if (!abortSignal.aborted) {
    const duration = options?.blinkDuration ?? 1000;
    await pixel.blink(blinkColor, {
      count: 1,
      duration,
      faceMask: options?.faceMask,
      loop: true,
    });
    const abort = () => {
      pixel.stopAllAnimations().catch(() => {});
    };
    abortSignal.addEventListener("abort", abort);
  }
}

async function litUpForever(
  pixel: Pixel,
  color: Color,
  abortSignal: AbortSignal,
  options?: {
    faceMask?: number;
  }
) {
  if (!abortSignal.aborted) {
    await pixel.stopAllAnimations();
  }
  try {
    const duration = 0xffff;
    while (!abortSignal.aborted) {
      await pixel.blink(color, {
        duration,
        faceMask: options?.faceMask,
      });
      await delay(duration / 2, abortSignal);
    }
  } finally {
    pixel.stopAllAnimations().catch(() => {});
  }
}

const ValidationTests = {
  checkLEDLoopback: async (pixel: Pixel): Promise<void> => {
    const msg = await pixel.sendAndWaitForResponse(
      "testLEDLoopback",
      "ledLoopback"
    );
    const ledLoopback = msg as LEDLoopback;
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
      "telemetry"
    );
    const telemetry = response as Telemetry;
    const voltage = telemetry.voltageTimes50 / 50;
    console.log(
      `Battery voltage: ${voltage.toFixed(2)} V,` +
        ` level: ${telemetry.batteryLevelPercent} %,` +
        ` charging: ${
          telemetry.batteryState === PixelBatteryStateValues.charging ||
          telemetry.batteryState === PixelBatteryStateValues.done
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
      "rssi"
    )) as Rssi;

    console.log(`RSSI is ${rssi.value}`);
    if (rssi.value < -70) {
      throw new Error(`Low RSSI value: ${rssi.value}`);
    }
  },

  waitCharging: async (
    pixel: Pixel,
    shouldBeCharging: boolean,
    blinkColor: Color,
    abortSignal: AbortSignal
  ): Promise<void> => {
    await new Promise<void>((resolve, reject) => {
      // Abort controller used to control the blinking
      const blinkAbortController = new AbortController();
      // Process battery events
      const batteryListener = ({ isCharging }: PixelBatteryData) => {
        if (isCharging === shouldBeCharging) {
          pixel.removeEventListener("battery", batteryListener);
          blinkAbortController.abort();
          resolve();
        }
      };
      // Abort function
      const abort = () => {
        pixel.removeEventListener("battery", batteryListener);
        blinkAbortController.abort();
        reject(new TaskCanceledError("waitCharging"));
      };
      if (abortSignal.aborted) {
        abort();
      } else if (pixel.isCharging === shouldBeCharging) {
        resolve();
      } else {
        // Listen to abort event
        abortSignal.addEventListener("abort", abort);
        // Blink face
        const blinkAS = blinkAbortController.signal;
        const options = {
          faceMask: getFaceMask(pixel.ledCount),
        };
        blinkForever(pixel, blinkColor, blinkAS, options).catch(() => {});
        // Listen to battery events
        pixel.addEventListener("battery", batteryListener);
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
        requestMode: TelemetryRequestModeValues.automatic,
      })
    );
    let telemetryListener: ((msg: MessageOrType) => void) | undefined;
    try {
      await new Promise<void>((resolve, reject) => {
        const abort = () => reject(new TaskCanceledError("checkAccelerometer"));
        if (abortSignal.aborted) {
          abort();
        } else {
          abortSignal.addEventListener("abort", abort);
          telemetryListener = (msg) => {
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
          pixel.addMessageListener("telemetry", telemetryListener);
        }
      });
    } finally {
      if (telemetryListener) {
        pixel.removeMessageListener("telemetry", telemetryListener);
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
    abortSignal: AbortSignal,
    holdDelay = 1000 // Number of ms to wait before validating the face up
  ): Promise<void> => {
    assert(face > 0);
    await new Promise<void>((resolve, reject) => {
      // Abort controller used to control the blinking
      const blinkAbortController = new AbortController();
      // Timeout that's setup once the die face up is the required one
      // The promise will resolve successfully once the timeout expires
      let holdTimeout: ReturnType<typeof setTimeout> | undefined;
      function setHoldTimeout() {
        console.log(`Waiting ${holdDelay}ms before validating`);
        holdTimeout = setTimeout(() => {
          console.log(`Validating face up: ${pixel.currentFace}`);
          pixel.removeEventListener("rollState", rollListener);
          blinkAbortController.abort();
          resolve();
        }, holdDelay);
      }
      // Roll listener that checks if the required face is up
      const rollListener = ({ state, face: f }: PixelRollData) => {
        if (state === "onFace" && f === face) {
          // Required face is up, start hold timer
          console.log(`Die rolled on required face ${face}`);
          setHoldTimeout();
        } else if (holdTimeout) {
          // Die moved, cancel hold timer
          console.log(`Die moved before hold timeout expired`);
          clearTimeout(holdTimeout);
          holdTimeout = undefined;
        }
      };
      // Abort function
      const abort = () => {
        pixel.removeEventListener("rollState", rollListener);
        blinkAbortController.abort();
        reject(new TaskCanceledError("waitFaceUp"));
      };
      if (abortSignal.aborted) {
        // Abort right away
        abort();
      } else {
        // Listen to abort event
        abortSignal.addEventListener("abort", abort);
        // Blink face that we want to be up
        const blinkAS = blinkAbortController.signal;
        const options = {
          faceMask: getFaceMask(face),
        };
        blinkForever(pixel, blinkColor, blinkAS, options).catch(() => {});
        // Listen to roll events to detect when required face is up
        pixel.addEventListener("rollState", rollListener);
        // Check current face
        if (pixel.rollState === "onFace" && pixel.currentFace === face) {
          // Required face is already up, start hold timer
          console.log(`Die already on face ${face}`);
          setHoldTimeout();
        }
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
        const blinkAS = blinkAbortController.signal;
        litUpForever(pixel, color, blinkAS).catch(() => {});
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
    // Exit validation mode, don't wait for response as die will restart
    await pixel.sendMessage("exitValidation", true);
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
