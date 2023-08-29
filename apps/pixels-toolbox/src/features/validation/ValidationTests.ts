import {
  assert,
  delay,
  getValueKeyName,
  safeAssign,
} from "@systemic-games/pixels-core-utils";
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
  getFaceMask,
  RollEvent,
  PixelBatteryControllerStateValues,
} from "@systemic-games/react-native-pixels-connect";

import { pixelStopAllAnimations } from "../pixels/extensions";

import { TaskCanceledError } from "~/features/tasks/useTask";

function getSignalReason(signal: AbortSignal, testName?: string): any {
  // No error when using DOM types -- @ts-expect-error reason not implemented in React Native)
  const reason = signal.reason;
  return reason ?? (testName ? new TaskCanceledError(testName) : undefined);
}

class AbortControllerWithReason extends AbortController {
  abortWithReason(reason: any): void {
    // @ts-expect-error reason not implemented in React Native
    this.signal.reason = reason;
    this.abort();
  }
}

function vectNorm(x: number, y: number, z: number): number {
  return Math.sqrt(x * x + y * y + z * z);
}

function vectToString(x: number, y: number, z: number): string {
  return `(${x.toFixed(3)}, ${y.toFixed(3)}, ${z.toFixed(3)})`;
}

function isBatteryCharging(state: number): boolean {
  const v = PixelBatteryControllerStateValues;
  return (
    state === v.chargingLow ||
    state === v.charging ||
    state === v.cooldown ||
    state === v.trickle ||
    state === v.done
  );
}

export class ValidationTestsTimeoutError extends Error {
  constructor(ms: number) {
    super(`Timed-out after waiting ${Math.round(ms / 1000)}s`);
    this.name = "ValidationTestsTimeoutError";
  }
}

export class ValidationTestsDisconnectedError extends Error {
  constructor() {
    super(`Disconnected from Pixel`);
    this.name = "ValidationTestsDisconnectedError";
  }
}

function timeout(ms: number): [AbortSignal, () => void] {
  const controller = new AbortControllerWithReason();
  const id = setTimeout(() => {
    controller.abortWithReason(new ValidationTestsTimeoutError(ms));
  }, ms);
  return [controller.signal, () => clearTimeout(id)];
}

function checkConnected(pixel: Pixel): [AbortSignal, (() => void) | undefined] {
  const controller = new AbortControllerWithReason();
  if (!pixel.isReady) {
    controller.abortWithReason(new ValidationTestsDisconnectedError());
    return [controller.signal, undefined];
  } else {
    const listener = (status: PixelStatus) => {
      if (status === "disconnecting" || status === "disconnected") {
        controller.abortWithReason(new ValidationTestsDisconnectedError());
      }
    };
    pixel.addEventListener("status", listener);
    return [
      controller.signal,
      () => pixel.removeEventListener("status", listener),
    ];
  }
}

function anySignal(signals: Iterable<AbortSignal>): [AbortSignal, () => void] {
  const controller = new AbortControllerWithReason();
  const unsubscribeList: (() => void)[] = [];
  const unsubscribeAll = () => {
    // Unsubscribe
    for (const fn of unsubscribeList) {
      fn();
    }
    unsubscribeList.length = 0;
  };
  const onAbort = (signal: AbortSignal) => {
    unsubscribeAll();
    // Forward abort
    controller.abortWithReason(getSignalReason(signal));
  };
  // Listen to signals
  for (const signal of signals) {
    if (signal.aborted) {
      onAbort(signal);
      break;
    }
    const listener = () => onAbort(signal);
    unsubscribeList.push(() => signal.removeEventListener("abort", listener));
    signal.addEventListener("abort", listener);
  }
  return [controller.signal, unsubscribeAll];
}

async function withTimeout(
  signal: AbortSignal,
  timeoutMs: number,
  promise: (signal: AbortSignal) => Promise<void>
): Promise<void> {
  const [tSignal, tCleanup] = timeout(timeoutMs);
  const [combinedSignal, csCleanup] = anySignal([signal, tSignal]);
  let cleanupAllCalled = false;
  const cleanupAll = () => {
    if (!cleanupAllCalled) {
      cleanupAllCalled = true;
      csCleanup();
      tCleanup();
    }
  };
  combinedSignal.addEventListener("abort", cleanupAll);
  try {
    await promise(combinedSignal);
  } finally {
    cleanupAll();
  }
}

async function withTimeoutAndDisconnect(
  signal: AbortSignal,
  pixel: Pixel,
  timeoutMs: number,
  promise: (signal: AbortSignal) => Promise<void>
): Promise<void> {
  const [tSignal, tCleanup] = timeout(timeoutMs);
  const [ccSignal, ccCleanup] = checkConnected(pixel);
  const [combinedSignal, csCleanup] = anySignal([signal, tSignal, ccSignal]);
  let cleanupAllCalled = false;
  const cleanupAll = () => {
    if (!cleanupAllCalled) {
      cleanupAllCalled = true;
      csCleanup();
      tCleanup();
      ccCleanup?.();
    }
  };
  combinedSignal.addEventListener("abort", cleanupAll);
  try {
    await promise(combinedSignal);
  } finally {
    cleanupAll();
  }
}

async function withBlink(
  pixel: Pixel,
  blinkColor: Color,
  abortSignal: AbortSignal,
  promise: () => Promise<void>,
  options?: {
    faceMask?: number;
    blinkDuration?: number;
  }
): Promise<void> {
  let status: "init" | "blink" | "cancel" = "init";
  const blink = async () => {
    if (!abortSignal.aborted) {
      await pixelStopAllAnimations(pixel);
    }
    if (!abortSignal.aborted && status !== "cancel") {
      status = "blink";
      const duration = options?.blinkDuration ?? 1000;
      await pixel.blink(blinkColor, {
        count: 1,
        duration,
        faceMask: options?.faceMask,
        loop: true,
      });
    }
  };
  try {
    blink().catch(() => {});
    await promise();
  } finally {
    // @ts-ignore status may have been changed in async task
    if (status === "blink") {
      pixelStopAllAnimations(pixel).catch(() => {});
    }
    status = "cancel";
  }
}

async function withSolidColor(
  pixel: Pixel,
  color: Color,
  abortSignal: AbortSignal,
  promise: () => Promise<void>,
  options?: {
    faceMask?: number;
  }
): Promise<void> {
  let status: "init" | "blink" | "cancel" = "init";
  const lightUp = async () => {
    if (!abortSignal.aborted) {
      await pixelStopAllAnimations(pixel);
    }
    const duration = 0xffff;
    while (!abortSignal.aborted && status !== "cancel") {
      status = "blink";
      await pixel.blink(color, {
        duration,
        faceMask: options?.faceMask,
      });
      await delay(duration / 2, abortSignal);
    }
  };
  try {
    lightUp().catch(() => {});
    await promise();
  } finally {
    // @ts-ignore status may have been changed in async task
    if (status === "blink") {
      pixelStopAllAnimations(pixel).catch(() => {});
    }
    status = "cancel";
  }
}

async function withTelemetry(
  pixel: Pixel,
  listener: (msg: Telemetry) => boolean, // Return true to stop telemetry
  abortSignal: AbortSignal,
  testName: string
): Promise<void> {
  if (abortSignal.aborted) {
    throw getSignalReason(abortSignal, testName);
  } else {
    // Start telemetry
    await pixel.sendMessage(
      safeAssign(new RequestTelemetry(), {
        requestMode: TelemetryRequestModeValues.automatic,
        minInterval: 100,
      })
    );

    let firstError: any | undefined;
    let onAbort: (() => void) | undefined;
    let telemetryListener: ((msg: MessageOrType) => void) | undefined;
    // Process telemetry messages
    try {
      await new Promise<void>((resolve, reject) => {
        onAbort = () => {
          reject(getSignalReason(abortSignal, testName));
        };
        if (abortSignal.aborted) {
          onAbort();
        } else {
          abortSignal.addEventListener("abort", onAbort);
          telemetryListener = (msg: MessageOrType) => {
            try {
              if (listener(msg as Telemetry)) {
                resolve();
              }
            } catch (error) {
              reject(error);
            }
          };
          pixel.addMessageListener("telemetry", telemetryListener);
        }
      });
    } catch (error) {
      firstError = error;
    } finally {
      if (onAbort) {
        abortSignal.removeEventListener("abort", onAbort);
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
        if (firstError) {
          // We already got an error, just log this one and forget it
          console.log(`Error while trying to stop telemetry: ${error}`);
        } else {
          firstError = error;
        }
      }
      if (firstError) {
        throw firstError;
      }
    }
  }
}

export const ValidationTests = {
  async checkLEDLoopback(
    pixel: Pixel,
    timeout = 3000 // 3s
  ): Promise<void> {
    const msg = (await pixel.sendAndWaitForResponse(
      "testLEDLoopback",
      "ledLoopback",
      timeout
    )) as LEDLoopback;
    // Check received LED loopback
    console.log(`LED loopback value: ${msg.value}`);
    if (!msg.value) {
      throw new Error(`Unexpected LED loopback value: ${msg.value}`);
    }
  },

  // Check that acceleration value is reasonable
  async checkAccelerationValid(
    pixel: Pixel,
    maxDeviationFactor = 10, // 10x,
    timeout = 3000 // 3s
  ): Promise<void> {
    const msg = (await pixel.sendAndWaitForResponse(
      safeAssign(new RequestTelemetry(), {
        requestMode: TelemetryRequestModeValues.once,
      }),
      "telemetry",
      timeout
    )) as Telemetry;
    // Check received acceleration
    const x = msg.accXTimes1000 / 1000;
    const y = msg.accYTimes1000 / 1000;
    const z = msg.accZTimes1000 / 1000;
    const n = vectNorm(x, y, z);
    console.log(`Acceleration: ${vectToString(x, y, z)}, norm=${n}`);
    if (n > maxDeviationFactor || n < 1 / maxDeviationFactor) {
      throw new Error("Invalid accelerometer value: " + vectToString(x, y, z));
    }
  },

  async checkBatteryVoltage(
    pixel: Pixel,
    timeout = 3000 // 3s
  ): Promise<void> {
    const msg = (await pixel.sendAndWaitForResponse(
      safeAssign(new RequestTelemetry(), {
        requestMode: TelemetryRequestModeValues.once,
      }),
      "telemetry",
      timeout
    )) as Telemetry;
    // Check received battery voltage
    const voltage = msg.voltageTimes50 / 50;
    console.log(
      `Battery voltage: ${voltage.toFixed(2)} V,` +
        ` level: ${msg.batteryLevelPercent} %,` +
        ` charging: ${
          msg.batteryState === PixelBatteryStateValues.charging ||
          msg.batteryState === PixelBatteryStateValues.done
        }`
    );
    if (voltage < 3 || voltage > 5) {
      throw new Error(`Out of range battery voltage: ${voltage}`);
    }
  },

  async checkRssi(
    pixel: Pixel,
    timeout = 3000 // 3s
  ): Promise<void> {
    const rssi = (await pixel.sendAndWaitForResponse(
      safeAssign(new RequestRssi(), {
        requestMode: TelemetryRequestModeValues.once,
      }),
      "rssi",
      timeout
    )) as Rssi;
    // Check received RSSI
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
    notifyState: (info: { state?: string; vCoil: number }) => void,
    timeout = 30000 // 30s
  ): Promise<void> => {
    await withTimeoutAndDisconnect(
      abortSignal,
      pixel,
      timeout,
      async (signal) => {
        // Blink face
        const options = { faceMask: getFaceMask(pixel.ledCount) };
        await withBlink(
          pixel,
          blinkColor,
          signal,
          async () => {
            // And wait for battery (not)charging
            let lastMsg: Telemetry | undefined;
            try {
              await withTelemetry(
                pixel,
                (msg: Telemetry) => {
                  lastMsg = msg;
                  const state = msg.batteryControllerState;
                  const charging = isBatteryCharging(state);
                  if (charging === shouldBeCharging) {
                    const vCoil = msg.vCoilTimes50 / 50;
                    if (!charging || vCoil >= 4.2) {
                      return true;
                    } else {
                      const stateStr =
                        getValueKeyName(
                          state,
                          PixelBatteryControllerStateValues
                        ) ?? "unknown";
                      console.log(
                        `Charging state is ${stateStr} but VCoil too low: ${vCoil}`
                      );
                    }
                  }
                  notifyState({
                    state: getValueKeyName(
                      msg.batteryControllerState,
                      PixelBatteryControllerStateValues
                    ),
                    vCoil: msg.vCoilTimes50 / 50,
                  });
                  return false;
                },
                signal,
                shouldBeCharging ? "waitCharging" : "waitNotCharging"
              );
            } catch (error: any) {
              // TODO temporary
              if (lastMsg && error instanceof ValidationTestsTimeoutError) {
                const stateStr =
                  getValueKeyName(
                    lastMsg.batteryControllerState,
                    PixelBatteryControllerStateValues
                  ) ?? "unknown";
                const vCoil = lastMsg.vCoilTimes50 / 50;
                throw new Error(
                  `Timeout while waiting for '${
                    shouldBeCharging ? "" : "not "
                  }charging' state, controller state was ${stateStr} and coil was ${vCoil}v`
                );
              } else {
                throw error;
              }
            }
          },
          options
        );
      }
    );
  },

  async waitFaceUp(
    pixel: Pixel,
    face: number,
    blinkColor: Color,
    abortSignal: AbortSignal,
    holdDelay = 1000, // Number of ms to wait before validating the face up
    timeout = 30000 // 30s
  ): Promise<void> {
    assert(face > 0);
    await withTimeoutAndDisconnect(
      abortSignal,
      pixel,
      timeout,
      async (signal) => {
        // Blink face
        const options = { faceMask: getFaceMask(face) };
        await withBlink(
          pixel,
          blinkColor,
          abortSignal,
          async () => {
            let onAbort: (() => void) | undefined;
            let rollListener: ((ev: RollEvent) => void) | undefined;
            try {
              await new Promise<void>((resolve, reject) => {
                // Timeout that's setup once the die face up is the required one
                // The promise will resolve successfully once the timeout expires
                let holdTimeout: ReturnType<typeof setTimeout> | undefined;
                function setHoldTimeout() {
                  console.log(`Waiting ${holdDelay}ms before validating`);
                  holdTimeout = setTimeout(() => {
                    console.log(`Validating face up: ${pixel.currentFace}`);
                    resolve();
                  }, holdDelay);
                }
                // Roll listener that checks if the required face is up
                rollListener = ({ state, face: f }: RollEvent) => {
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
                onAbort = () => {
                  reject(getSignalReason(signal, "waitFaceUp"));
                };
                if (signal.aborted) {
                  // Abort right away
                  onAbort();
                } else {
                  // Listen to abort event
                  signal.addEventListener("abort", onAbort);
                  // Listen to roll events to detect when required face is up
                  pixel.addEventListener("rollState", rollListener);
                  // Check current face
                  if (
                    pixel.rollState === "onFace" &&
                    pixel.currentFace === face
                  ) {
                    // Required face is already up, start hold timer
                    console.log(`Die already on face ${face}`);
                    setHoldTimeout();
                  }
                }
              });
            } finally {
              if (onAbort) {
                signal.removeEventListener("abort", onAbort);
              }
              if (rollListener) {
                pixel.removeEventListener("rollState", rollListener);
              }
            }
          },
          options
        );
      }
    );
  },

  async checkLEDsLitUp(
    pixel: Pixel,
    color: Color,
    setResolve: (resolve: () => void) => void,
    abortSignal: AbortSignal,
    timeout = 30000 // 30s
  ) {
    await withTimeoutAndDisconnect(
      abortSignal,
      pixel,
      timeout,
      async (signal) => {
        // Show solid color
        await withSolidColor(pixel, color, abortSignal, async () => {
          let onAbort: (() => void) | undefined;
          try {
            await new Promise<void>((resolve, reject) => {
              onAbort = () => {
                reject(getSignalReason(signal, "checkLEDsLitUp"));
              };
              if (signal.aborted) {
                onAbort();
              } else {
                signal.addEventListener("abort", onAbort);
                // Wait on promised being resolved
                setResolve(() => {
                  if (!signal.aborted) {
                    resolve();
                  }
                });
              }
            });
          } finally {
            if (onAbort) {
              signal.removeEventListener("abort", onAbort);
            }
          }
        });
      }
    );
  },

  async updateProfile(
    pixel: Pixel,
    profile: DataSet,
    progressCallback?: (progress: number) => void
    // TODO abortSignal: AbortSignal
  ): Promise<void> {
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

  async renameDie(_pixel: Pixel, _name = "Pixel"): Promise<void> {
    // TODO await pixel.rename(name);
  },

  async exitValidationMode(pixel: Pixel): Promise<void> {
    // Exit validation mode, don't wait for response as die will restart
    await pixel.sendMessage("exitValidation", true);
  },

  async waitDisconnected(
    pixel: Pixel,
    blinkColor: Color,
    abortSignal: AbortSignal,
    timeout = 30000 // 30s
  ) {
    await withTimeout(abortSignal, timeout, async (signal) => {
      let statusListener: ((status: PixelStatus) => void) | undefined;
      // Blink all faces
      await withBlink(pixel, blinkColor, signal, async () => {
        let onAbort: (() => void) | undefined;
        try {
          await new Promise<void>((resolve, reject) => {
            onAbort = () => {
              reject(getSignalReason(signal, "waitDisconnected"));
            };
            if (signal.aborted) {
              onAbort();
            } else if (pixel.status === "disconnected") {
              resolve();
            } else {
              signal.addEventListener("abort", onAbort);
              // Wait on connection status change
              statusListener = (status: PixelStatus) => {
                if (status === "disconnected") {
                  resolve();
                }
              };
              pixel.addEventListener("status", statusListener);
            }
          });
        } finally {
          if (onAbort) {
            signal.removeEventListener("abort", onAbort);
          }
          if (statusListener) {
            pixel.removeEventListener("status", statusListener);
          }
        }
      });
    });
  },
} as const;
