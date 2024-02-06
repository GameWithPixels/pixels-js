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
  SignalTimeoutError,
} from "./signalHelpers";
import { LocalizedError } from "../LocalizedError";
import { getRandomDieNameAsync } from "../getRandomDieNameAsync";

export class AccelerationInvalidValueError extends LocalizedError {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  constructor(x: number, y: number, z: number) {
    super(`Invalid accelerometer value ${vectToString(x, y, z)}`);
    this.name = "AccelerationInvalidValueError";
    this.x = x;
    this.y = y;
    this.z = z;
  }
  toLocalizedString(t: (key: string, params: any) => string): string {
    return t("invalidAccelerometerValue", {
      value: vectToString(this.x, this.y, this.z),
    });
  }
}

export class BatteryOutOfRangeVoltageError extends LocalizedError {
  readonly voltage: number;
  constructor(voltage: number) {
    super(`Out of range battery voltage: ${voltage}v`);
    this.name = "BatteryOutOfRangeVoltageError";
    this.voltage = voltage;
  }
  toLocalizedString(t: (key: string, params: any) => string): string {
    return t("outOfRangeBatteryVoltage", { value: this.voltage.toFixed(2) });
  }
}

export class WaitForChargingTimeoutError extends LocalizedError {
  readonly shouldBeCharging: boolean;
  readonly telemetry: Readonly<Telemetry>;
  constructor(shouldBeCharging: boolean, telemetry: Telemetry) {
    const state =
      getValueKeyName(
        telemetry.batteryControllerState,
        PixelBatteryControllerStateValues
      ) ?? "unknown";
    super(
      `Timeout waiting for '${
        shouldBeCharging ? "" : "not "
      }charging' state. Controller state: ${state}, coil: ${
        telemetry.vCoilTimes50 / 50
      }v`
    );
    this.name = "WaitForChargingTimeoutError";
    this.shouldBeCharging = shouldBeCharging;
    this.telemetry = { ...telemetry };
  }
  toLocalizedString(t: (key: string, params: any) => string): string {
    const state =
      getValueKeyName(
        this.telemetry.batteryControllerState,
        PixelBatteryControllerStateValues
      ) ?? "unknown";
    const vCoil = this.telemetry.vCoilTimes50 / 50;
    return t(
      this.shouldBeCharging
        ? "timeoutWhileWaitingForChargingState"
        : "timeoutWhileWaitingForNotChargingState",
      { state, vCoil }
    );
  }
}

export class WaitFaceUpTimeoutError extends LocalizedError {
  readonly face: number;
  readonly roll: Readonly<RollEvent>;
  constructor(face: number, roll: RollEvent) {
    super(
      `Timeout waiting for face ${face}, face up: ${roll.face}, roll state: ${roll.state}`
    );
    this.name = "WaitFaceUpTimeoutError";
    this.face = face;
    this.roll = { ...roll };
  }
  toLocalizedString(t: (key: string, params: any) => string): string {
    return t("timeoutWaitingForFace", {
      face: this.face,
      rollFace: this.roll.face,
      rollState: this.roll.state,
    });
  }
}

function vectNorm(x: number, y: number, z: number): number {
  return Math.sqrt(x * x + y * y + z * z);
}

function vectToString(x: number, y: number, z: number): string {
  return `${x.toFixed(3)}, ${y.toFixed(3)}, ${z.toFixed(3)}`;
}

function isBatteryCharging(state: number): "yes" | "no" | "unknown" {
  const values = PixelBatteryControllerStateValues;
  if (
    state === values.chargingLow ||
    state === values.charging ||
    state === values.cooldown ||
    state === values.trickle ||
    state === values.done
  ) {
    return "yes";
  } else if (
    state === values.ok ||
    state === values.low ||
    state === values.empty ||
    state === values.transitionOff // To speed up "wait not charging" test
  ) {
    return "no";
  } else {
    return "unknown";
  }
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
    // Check acceleration
    const x = msg.accXTimes1000 / 1000;
    const y = msg.accYTimes1000 / 1000;
    const z = msg.accZTimes1000 / 1000;
    const n = vectNorm(x, y, z);
    console.log(`Acceleration: ${vectToString(x, y, z)}, norm: ${n}`);
    if (n > maxDeviationFactor || n < 1 / maxDeviationFactor) {
      throw new AccelerationInvalidValueError(x, y, z);
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
    // Check battery voltage
    const voltage = msg.voltageTimes50 / 50;
    console.log(
      `Battery voltage: ${voltage.toFixed(2)}V,` +
        ` level: ${msg.batteryLevelPercent}%,` +
        ` charging: ${
          msg.batteryState === PixelBatteryStateValues.charging ||
          msg.batteryState === PixelBatteryStateValues.done
        }`
    );
    if (voltage < 3 || voltage > 5) {
      throw new BatteryOutOfRangeVoltageError(voltage);
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
    // Check RSSI
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
    timeout = testTimeout
  ): Promise<void> => {
    await withTimeoutAndDisconnect(
      abortSignal,
      pixel,
      timeout,
      async (abortSignal) => {
        // Blink face
        const options = {
          faceMask: getFaceMask(
            DiceUtils.getTopFace(pixel.dieType),
            pixel.dieType
          ),
        } as const;
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
                  const state = msg.batteryControllerState;
                  lastMsg = msg;
                  const charging = isBatteryCharging(state);
                  if (charging === (shouldBeCharging ? "yes" : "no")) {
                    const vCoil = msg.vCoilTimes50 / 50;
                    if (charging === "no" || vCoil >= 4.2) {
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
                  return false;
                }
              );
            } catch (error: any) {
              if (lastMsg && error instanceof SignalTimeoutError) {
                throw new WaitForChargingTimeoutError(
                  shouldBeCharging,
                  lastMsg
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
    timeout = testTimeout
  ): Promise<void> {
    console.log(`Waiting on face up: ${face}`);
    await withTimeoutAndDisconnect(
      abortSignal,
      pixel,
      timeout,
      async (abortSignal) => {
        // Blink face
        const options = {
          faceMask: getFaceMask(face, pixel.dieType),
        } as const;
        await withBlink(
          abortSignal,
          pixel,
          blinkColor,
          async () => {
            let rollListener: ((ev: RollEvent) => void) | undefined;
            let lastMsg: RollEvent | undefined;
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
                    lastMsg = { state, face: currentFace };
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
                    console.log(
                      `Die roll state is ${state} and face = ${currentFace}`
                    );
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
              if (lastMsg && error instanceof SignalTimeoutError) {
                throw new WaitFaceUpTimeoutError(face, lastMsg);
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

  async checkLEDsLitUp(
    pixel: Pixel,
    color: Color,
    setResolve: (resolve: () => void) => void,
    abortSignal: AbortSignal,
    timeout = testTimeout
  ) {
    await withTimeoutAndDisconnect(abortSignal, pixel, timeout, (abortSignal) =>
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
      )
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
    const _unused = getRandomDieNameAsync;
    // Disabled until we have a good list of names
    // name ??= await getRandomDieNameAsync();
    if (name) {
      console.log("Setting die name to " + name);
      await pixel.rename(name);
    }
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
