// Disable false positive ESLint warning on throwing exceptions extending imported ValidationError type
/* eslint-disable @typescript-eslint/no-throw-literal */
import { getValueKeyName, safeAssign } from "@systemic-games/pixels-core-utils";
import {
  Color,
  DataSet,
  DiceUtils,
  getFaceMask,
  Pixel,
  PixelBatteryControllerStateValues,
  PixelBatteryStateValues,
  PixelDieType,
  PixelEventMap,
  PixelMutableProps,
  RequestRssi,
  RequestTelemetry,
  RollEvent,
  Rssi,
  Telemetry,
  TelemetryRequestModeValues,
} from "@systemic-games/react-native-pixels-connect";
import { useTranslation } from "react-i18next";

import { ErrorCodes } from "./ErrorCodes";
import { ValidationError } from "./ValidationError";
import {
  SignalTimeoutError,
  withBlink,
  withPromise,
  withSolidColor,
  withTelemetry,
  withTimeout,
  withTimeoutAndDisconnect,
} from "./signalHelpers";

import { getRandomDieNameAsync } from "~/features/getRandomDieNameAsync";

export class AccelerationInvalidValueError extends ValidationError {
  readonly errorCode = ErrorCodes.AccelerationInvalidValue;
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
  toLocalizedString(t: ReturnType<typeof useTranslation>["t"]): string {
    return t("invalidAccelerometerValue", {
      value: vectToString(this.x, this.y, this.z),
    });
  }
}

export class BatteryOutOfRangeVoltageError extends ValidationError {
  readonly errorCode = ErrorCodes.BatteryOutOfRangeVoltage;
  readonly voltage: number;
  constructor(voltage: number) {
    super(`Out of range battery voltage: ${voltage}v`);
    this.name = "BatteryOutOfRangeVoltageError";
    this.voltage = voltage;
  }
  toLocalizedString(t: ReturnType<typeof useTranslation>["t"]): string {
    return t("outOfRangeBatteryVoltage", { value: this.voltage.toFixed(2) });
  }
}

export class WaitChargingTimeoutError extends SignalTimeoutError {
  readonly shouldBeCharging: boolean;
  readonly telemetry: Readonly<Telemetry>;
  constructor(ms: number, shouldBeCharging: boolean, telemetry: Telemetry) {
    const state =
      getValueKeyName(
        telemetry.batteryControllerState,
        PixelBatteryControllerStateValues
      ) ?? "unknown";
    super(
      ms,
      `Expected to be ${
        shouldBeCharging ? "" : "not "
      }charging but controller state is ${state} and v-coil ${telemetry.vCoilTimes50 / 50}v`
    );
    this.name = "WaitForChargingTimeoutError";
    this.shouldBeCharging = shouldBeCharging;
    this.telemetry = { ...telemetry };
  }
  toLocalizedString(t: ReturnType<typeof useTranslation>["t"]): string {
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

export class WaitFaceUpTimeoutError extends SignalTimeoutError {
  readonly face: number;
  readonly roll: RollEvent;
  constructor(ms: number, face: number, roll: RollEvent) {
    super(
      ms,
      `Expected to be on face ${face} but got ${roll.face} with roll state ${roll.state}`
    );
    this.name = "WaitFaceUpTimeoutError";
    this.face = face;
    this.roll = { ...roll };
  }
  toLocalizedString(t: ReturnType<typeof useTranslation>["t"]): string {
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
    dieType: PixelDieType,
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
        const faceMask = getFaceMask(DiceUtils.getTopFace(dieType), dieType);
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
                throw new WaitChargingTimeoutError(
                  error.timeout,
                  shouldBeCharging,
                  lastMsg
                );
              } else {
                throw error;
              }
            }
          },
          { faceMask }
        );
      }
    );
  },

  async waitFaceUp(
    pixel: Pixel,
    dieType: PixelDieType,
    face: number,
    blinkColor: Color,
    abortSignal: AbortSignal,
    holdDelay = 1000, // Number of ms to wait before validating the face up
    timeout = testTimeout
  ): Promise<void> {
    console.log(
      `Waiting on face ${face} for ${dieType}${
        dieType !== pixel.dieType ? ` (programmed as ${pixel.dieType})` : ""
      }`
    );
    await withTimeoutAndDisconnect(
      abortSignal,
      pixel,
      timeout,
      async (abortSignal) => {
        // Blink face
        const faceMask = getFaceMask(face, dieType);
        await withBlink(
          abortSignal,
          pixel,
          blinkColor,
          async () => {
            let rollListener: ((ev: RollEvent) => void) | undefined;
            let lastEv: RollEvent | undefined;
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
                      // Remap face based on the user selected die type
                      const face = DiceUtils.faceFromIndex(
                        pixel.currentFaceIndex,
                        dieType,
                        pixel.firmwareDate.getTime()
                      );
                      console.log(`Validating face up: ${face}`);
                      resolve();
                    }, holdDelay);
                  }
                  // Roll listener that checks if the required face is up
                  rollListener = (ev: RollEvent) => {
                    lastEv = ev;
                    const state = ev.state;
                    // Remap face based on the user selected die type
                    const currentFace = DiceUtils.faceFromIndex(
                      ev.faceIndex,
                      dieType,
                      pixel.firmwareDate.getTime()
                    );
                    if (
                      (state === "onFace" || state === "rolled") &&
                      currentFace === face
                    ) {
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
                    (pixel.rollState === "onFace" ||
                      pixel.rollState === "rolled") &&
                    face ===
                      // Remap face based on the user selected die type
                      DiceUtils.faceFromIndex(
                        pixel.currentFaceIndex,
                        dieType,
                        pixel.firmwareDate.getTime()
                      )
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
              if (lastEv && error instanceof SignalTimeoutError) {
                throw new WaitFaceUpTimeoutError(error.timeout, face, lastEv);
              } else {
                throw error;
              }
            }
          },
          { faceMask }
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
    const onProgress = (ev: PixelEventMap["dataTransfer"]) => {
      if (ev.type === "preparing" || ev.type === "starting") {
        progressCallback?.(-1);
      } else if (ev.type === "progress") {
        progressCallback?.(ev.progressPercent);
      } else if (ev.type === "completed" || ev.type === "failed") {
        progressCallback?.(-1);
      }
    };
    // Upload profile
    try {
      pixel.addEventListener("dataTransfer", onProgress);
      await pixel.transferDataSet(profile);
    } finally {
      pixel.removeEventListener("dataTransfer", onProgress);
    }
  },

  async renameDie(pixel: Pixel, name?: string): Promise<void> {
    const _unused = getRandomDieNameAsync;
    // Disabled until we have a good list of names
    // name ??= await getRandomDieNameAsync();
    if (name?.length) {
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
      let statusListener: (({ status }: PixelMutableProps) => void) | undefined;
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
              statusListener = ({ status }) => {
                if (status === "disconnected") {
                  resolve();
                }
              };
              pixel.addPropertyListener("status", statusListener);
            }
          },
          () => {
            if (statusListener) {
              pixel.removePropertyListener("status", statusListener);
            }
          }
        )
      );
    });
  },
} as const;
