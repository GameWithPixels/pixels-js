import { getValueKeyName, safeAssign } from "@systemic-games/pixels-core-utils";
import {
  Color,
  Pixel,
  PixelStatus,
  RequestTelemetry,
  Telemetry,
  DataSet,
  TelemetryRequestModeValues,
  RequestRssi,
  Rssi,
  PixelBatteryStateValues,
  getFaceMask,
  RollEvent,
  PixelBatteryControllerStateValues,
  DiceUtils,
} from "@systemic-games/react-native-pixels-connect";

import {
  withTimeoutAndDisconnect,
  withBlink,
  withTelemetry,
  withPromise,
  withSolidColor,
  withTimeout,
  ValidationTestsTimeoutError,
} from "./signalHelpers";
import { getRandomDieNameAsync } from "../getRandomDieNameAsync";

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

export const testTimeout = 30000; // 30s;
export const shortTimeout = 3000; // 3s;

export const ValidationTests = {
  // Check that acceleration value is reasonable
  async checkAccelerationValid(
    pixel: Pixel,
    maxDeviationFactor = 10, // 10x,
    timeout = shortTimeout
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
    timeout = shortTimeout
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

  async checkRssi(pixel: Pixel, timeout = shortTimeout): Promise<void> {
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
    timeout = testTimeout
  ): Promise<void> => {
    await withTimeoutAndDisconnect(
      abortSignal,
      pixel,
      async (abortSignal) => {
        // Blink face
        const options = {
          faceMask: getFaceMask(
            DiceUtils.getTopFace(pixel.dieType),
            pixel.dieType
          ),
        };
        await withBlink(
          abortSignal,
          pixel,
          blinkColor,
          async () => {
            // And wait for battery (not)charging
            let lastMsg: Telemetry | undefined;
            try {
              await withTelemetry(
                abortSignal,
                shouldBeCharging ? "waitCharging" : "waitNotCharging",
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
                }
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
      },
      timeout
    );
  },

  async waitFaceUp(
    pixel: Pixel,
    face: number,
    blinkColor: Color,
    abortSignal: AbortSignal,
    notifyFaceUp: (roll: RollEvent) => void,
    holdDelay = 1000, // Number of ms to wait before validating the face up
    timeout = testTimeout
  ): Promise<void> {
    console.log(`Waiting on face up: ${face}`);
    await withTimeoutAndDisconnect(
      abortSignal,
      pixel,
      async (abortSignal) => {
        // Blink face
        const options = {
          faceMask: getFaceMask(face, pixel.dieType),
        };
        await withBlink(
          abortSignal,
          pixel,
          blinkColor,
          async () => {
            let rollListener: ((ev: RollEvent) => void) | undefined;
            let lastRoll: RollEvent | undefined;
            try {
              await withPromise<void>(
                abortSignal,
                "waitFaceUp",
                (resolve) => {
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
                  rollListener = ({ state, face: currentFace }: RollEvent) => {
                    if (state === "onFace" && currentFace === face) {
                      // Required face is up, start hold timer
                      console.log(`Die rolled on required face ${face}`);
                      setHoldTimeout();
                    } else if (holdTimeout) {
                      // Die moved, cancel hold timer
                      console.log(`Die moved before hold timeout expired`);
                      clearTimeout(holdTimeout);
                      holdTimeout = undefined;
                    }
                    lastRoll = { state, face: currentFace };
                    notifyFaceUp(lastRoll);
                  };
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
                },
                () => {
                  if (rollListener) {
                    pixel.removeEventListener("rollState", rollListener);
                  }
                }
              );
            } catch (error) {
              // TODO temporary
              if (lastRoll && error instanceof ValidationTestsTimeoutError) {
                throw new Error(
                  `Timeout waiting for face ${face}, face up was ${lastRoll.face} and state ${lastRoll.state}`
                );
              } else {
                throw error;
              }
            }
          },
          options
        );
      },
      timeout
    );
  },

  async checkLEDsLitUp(
    pixel: Pixel,
    color: Color,
    setResolve: (resolve: () => void) => void,
    abortSignal: AbortSignal,
    timeout = testTimeout
  ) {
    await withTimeoutAndDisconnect(
      abortSignal,
      pixel,
      (abortSignal) =>
        // Show solid color
        withSolidColor(abortSignal, pixel, color, () =>
          withPromise<void>(abortSignal, "checkLEDsLitUp", (resolve) => {
            // Wait on promised being resolved
            setResolve(() => {
              if (!abortSignal.aborted) {
                resolve();
              }
            });
          })
        ),
      timeout
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

  async renameDie(pixel: Pixel, name?: string): Promise<void> {
    const newName = name ?? (await getRandomDieNameAsync());
    console.log("Setting die name to " + newName);
    await pixel.rename(newName);
  },

  async exitValidationMode(pixel: Pixel): Promise<void> {
    // Exit validation mode, don't wait for response as die will immediately reboot
    await pixel.sendMessage("exitValidation", true);
    // Replace above line by this code for testing
    // await pixel.sendMessage(
    //   safeAssign(new PowerOperation(), {
    //     operation: PixelPowerOperationValues.reset,
    //   }),
    //   true
    // );
  },

  async waitDisconnected(
    pixel: Pixel,
    blinkColor: Color,
    abortSignal: AbortSignal,
    timeout = testTimeout
  ) {
    await withTimeout(abortSignal, timeout, async (abortSignal) => {
      let statusListener: ((status: PixelStatus) => void) | undefined;
      // Blink all faces
      await withBlink(abortSignal, pixel, blinkColor, async () =>
        withPromise(
          abortSignal,
          "waitDisconnected",
          (resolve) => {
            if (pixel.status === "disconnected") {
              resolve();
            } else {
              // Wait on connection status change
              statusListener = (status: PixelStatus) => {
                if (status === "disconnected") {
                  resolve();
                }
              };
              pixel.addEventListener("status", statusListener);
            }
          },
          () => {
            if (statusListener) {
              pixel.removeEventListener("status", statusListener);
            }
          }
        )
      );
    });
  },
} as const;
