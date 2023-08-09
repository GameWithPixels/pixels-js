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
  BatteryEvent,
  getFaceMask,
  RollEvent,
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
    abortSignal: AbortSignal,
    timeout = 30000 // 30s
  ): Promise<void> => {
    await new Promise<void>((rawResolve, rawReject) => {
      // Abort controller used to control the blinking
      const blinkAbortController = new AbortController();
      // Listeners
      let batteryListener: (({ isCharging }: BatteryEvent) => void) | undefined;
      let statusListener: ((status: PixelStatus) => void) | undefined;
      let abort: (() => void) | undefined;
      let timeoutId: ReturnType<typeof setTimeout> | undefined;
      const cleanup = () => {
        // Stop blinking
        blinkAbortController.abort();
        // Cancel timeout and unhook listeners
        clearTimeout(timeoutId);
        if (abort) {
          abortSignal.removeEventListener("abort", abort);
        }
        if (batteryListener) {
          pixel.removeEventListener("battery", batteryListener);
        }
        if (statusListener) {
          pixel.removeEventListener("status", statusListener);
        }
      };
      // Create reject and resolve function that call cleanup()
      const reject = (reason?: any) => {
        cleanup();
        rawReject(reason);
      };
      const resolve = () => {
        cleanup();
        rawResolve();
      };
      // Abort function
      abort = () => reject(new TaskCanceledError("waitCharging"));
      // Error helper
      const createError = (desc: string) =>
        new Error(
          `${desc} while waiting for '${
            shouldBeCharging ? "" : "not "
          }charging' state`
        );
      // Check state
      if (abortSignal.aborted) {
        abort();
      } else if (!pixel.isReady) {
        reject(createError("Disconnected"));
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
        // Process battery events
        batteryListener = ({ isCharging }: BatteryEvent) => {
          if (isCharging === shouldBeCharging) {
            resolve();
          }
        };
        pixel.addEventListener("battery", batteryListener);
        // Listen for disconnection event
        statusListener = (status: PixelStatus) => {
          if (status === "disconnecting" || status === "disconnected") {
            reject(createError("Disconnected"));
          }
        };
        pixel.addEventListener("status", statusListener);
        // Reject promise on timeout
        timeoutId = setTimeout(() => reject(createError("Timeout")), timeout);
      }
    });
  },

  checkAccelerometer: async (
    pixel: Pixel,
    checkAcc: (x: number, y: number, z: number) => string | undefined, // String with error if invalid
    abortSignal: AbortSignal,
    opt?: {
      timeout?: number; // Delay before aborting, default = 3000
      once?: boolean; // Whether to check acceleration just once
    }
  ): Promise<void> => {
    const timeout = opt?.timeout ?? 3000;
    const once = opt?.once ?? false;
    // Turn on telemetry and wait for data
    await pixel.sendMessage(
      safeAssign(new RequestTelemetry(), {
        requestMode: TelemetryRequestModeValues.automatic,
      })
    );
    let telemetryListener: ((msg: MessageOrType) => void) | undefined;
    let globalError: Error | undefined;
    try {
      await new Promise<void>((resolve, reject) => {
        const abort = () => reject(new TaskCanceledError("checkAccelerometer"));
        if (abortSignal.aborted) {
          abort();
        } else {
          abortSignal.addEventListener("abort", abort);
          let lastErrorMsg: string | undefined;
          // Reject promise on timeout
          const timeoutId = setTimeout(() => {
            abortSignal.removeEventListener("abort", abort);
            reject(
              new Error(
                lastErrorMsg ?? "Timeout waiting for accelerometer data"
              )
            );
          }, timeout);
          // Process telemetry events
          telemetryListener = (msg) => {
            const { accX, accY, accZ } = msg as Telemetry;
            const n = vectNorm(accX, accY, accZ);
            console.log(
              `Acceleration: ${vectToString(accX, accY, accZ)}, norm=${n}`
            );
            let error: Error | undefined;
            try {
              lastErrorMsg = checkAcc(accX, accY, accZ);
              if (!lastErrorMsg) {
                abortSignal.removeEventListener("abort", abort);
                clearTimeout(timeoutId);
                resolve();
              } else if (once) {
                error = new Error(lastErrorMsg);
              }
            } catch (e) {
              error = e as Error;
            }
            if (error) {
              abortSignal.removeEventListener("abort", abort);
              clearTimeout(timeoutId);
              reject(error);
            }
          };
          pixel.addMessageListener("telemetry", telemetryListener);
        }
      });
    } catch (error) {
      globalError = error as Error;
    }
    if (telemetryListener) {
      pixel.removeMessageListener("telemetry", telemetryListener);
    }
    // Turn off telemetry
    try {
      await pixel.sendMessage(
        safeAssign(new RequestTelemetry(), {
          requestMode: TelemetryRequestModeValues.off,
        })
      );
    } catch (error) {
      if (globalError) {
        console.log(`Error while trying to stop telemetry: ${error}`);
      } else {
        globalError = error as Error;
      }
    }
    if (globalError) {
      throw globalError;
    }
  },

  // Check that acceleration is about 1G pointing downwards
  checkAccelerationDownward: (
    pixel: Pixel,
    abortSignal: AbortSignal,
    timeout = 3000, // Number of ms to get a downward acceleration
    maxDeviation = 0.1 // 10%
  ): Promise<void> => {
    return ValidationTests.checkAccelerometer(
      pixel,
      (x, y, z) => {
        // 1. Check norm
        const n = vectNorm(x, y, z);
        if (n > 1 + maxDeviation || n < 1 - maxDeviation) {
          return "Out of range accelerometer value: " + vectToString(x, y, z);
        }
        // 2. Check angle with -Z
        else if (-y > 1 + maxDeviation || -y < 1 - maxDeviation) {
          return "Tilted accelerometer value: " + vectToString(x, y, z);
        }
      },
      abortSignal,
      { timeout }
    );
  },

  // Check that acceleration value is reasonable
  checkAccelerationValid: (
    pixel: Pixel,
    abortSignal: AbortSignal,
    maxDeviationFactor = 10 // 10x
  ): Promise<void> => {
    return ValidationTests.checkAccelerometer(
      pixel,
      (x, y, z) => {
        // Check norm
        const n = vectNorm(x, y, z);
        if (n > maxDeviationFactor || n < 1 / maxDeviationFactor) {
          return "Invalid accelerometer value: " + vectToString(x, y, z);
        }
      },
      abortSignal,
      { once: true }
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
      const rollListener = ({ state, face: f }: RollEvent) => {
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
