import {
  assert,
  getValueKeyName,
  safeAssign,
} from "@systemic-games/pixels-core-utils";
import {
  BlinkId,
  Discharge,
  Pixel,
  PixelBatteryControllerMode,
  PixelBatteryControllerModeValues,
  PixelColorwayValues,
  PixelDieTypeValues,
  PixelEventMap,
  PlayProfileAnimation,
  SetBatteryControllerMode,
  StoreValue,
  StoreValueAck,
  StoreValueResult,
  StoreValueResultValues,
  TransferTest,
} from "@systemic-games/react-native-pixels-connect";

function log(pixel: Pixel, message: string): void {
  console.log(`[Pixel ${pixel.name}] ${message}`);
}

/**
 * Requests Pixel to blink its Pixel id with red, green, blue light patterns
 * and wait for a confirmation.
 * @param pixel The Pixel instance to use.
 * @param opt.brightness Brightness between 0 and 255.
 * @param opt.loop Whether to indefinitely loop the animation.
 */
export async function pixelBlinkId(
  pixel: Pixel,
  opt?: { brightness?: number; loop?: boolean }
): Promise<void> {
  const blinkMsg = safeAssign(new BlinkId(), {
    brightness: opt?.brightness ? opt?.brightness : 0x10,
    loopCount: opt?.loop ? 0xff : 1,
  });
  await pixel.sendAndWaitForResponse(blinkMsg, "blinkIdAck");
}

/**
 * Requests Pixel to set the battery controller to the given mode.
 * @param pixel The Pixel instance to use.
 * @param mode The charging mode to set.
 */
export async function pixelSetBatteryControllerMode(
  pixel: Pixel,
  mode: PixelBatteryControllerMode
): Promise<void> {
  log(pixel, `Setting battery controller mode to ${mode}`);
  const setMode = safeAssign(new SetBatteryControllerMode(), {
    mode: PixelBatteryControllerModeValues[mode],
  });
  await pixel.sendMessage(setMode, true); // withoutAck
}

/**
 * Discharges the pixel as fast as possible by lighting up all LEDs.
 * @param pixel The Pixel instance to use.
 * @param currentMA The (approximate) desired discharge current, or false to stop discharging.
 * @returns A promise that resolves once the message has been sent.
 */
export async function pixelDischarge(
  pixel: Pixel,
  currentMA: number | boolean
): Promise<void> {
  if (typeof currentMA === "boolean") {
    currentMA = currentMA ? 10 : 0;
  }
  const dischargeMsg = safeAssign(new Discharge(), {
    currentMA,
  });
  await pixel.sendMessage(dischargeMsg);
}

export async function pixelTransferTest(
  pixel: Pixel,
  size: number,
  sendBytesCallback?: (bytesCount: number) => void
): Promise<void> {
  const onTransfer = (ev: PixelEventMap["dataTransfer"]) => {
    if (ev.type === "progress") {
      sendBytesCallback?.(ev.transferredBytes);
    }
  };

  const transferMsg = safeAssign(new TransferTest(), { size });
  await pixel.sendAndWaitForResponse(transferMsg, "transferTestAck");

  const data = Array(size).fill(0);
  try {
    pixel.addEventListener("dataTransfer", onTransfer);
    //@ts-expect-error Private function
    await pixel._uploadBulkDataWithAck(
      "transferTestFinished",
      new Uint8Array(data)
    );
  } finally {
    pixel.removeEventListener("dataTransfer", onTransfer);
  }
}

/**
 * Requests Pixel to re-program its default behavior
 * and wait for a confirmation.
 * @param pixel The Pixel instance to use.
 * @returns A promise that resolves once the die has finished re-programming.
 */
export async function pixelReprogramDefaultBehavior(
  pixel: Pixel
): Promise<void> {
  await pixel.sendAndWaitForResponse(
    "programDefaultAnimationSet",
    "programDefaultAnimationSetFinished"
  );
}

/**
 * Requests Pixel to re-program its normals and settings
 * and wait for a confirmation.
 * @param pixel The Pixel instance to use.
 * @returns A promise that resolves once the die has finished re-programming.
 */
export async function pixelResetAllSettings(pixel: Pixel): Promise<void> {
  log(pixel, "Resetting all settings");
  await pixel.sendAndWaitForResponse(
    "programDefaultParameters",
    "programDefaultParametersFinished"
  );
}

/**
 * Requests the Pixel to stop all animations currently playing.
 * @param pixel The Pixel instance to use.
 * @returns A promise that resolves once the message has been sent.
 */
export async function pixelStopAllAnimations(pixel: Pixel): Promise<void> {
  await pixel.sendMessage("stopAllAnimations");
}

/**
 *
 * @param pixel The Pixel instance to use.
 * @param animationIndex Index of the animation in the profile's animation list.
 * @param remapToFace Face on which to play the animation (the animations are designed assuming that the higher face value is up).
 * @param loop Whether to indefinitely loop the animation.
 * @returns A promise that resolves once the message has been sent.
 */
export async function pixelPlayProfileAnimation(
  pixel: Pixel,
  animationIndex: number,
  remapToFace = 0,
  loopCount = 1
): Promise<void> {
  const playAnim = safeAssign(new PlayProfileAnimation(), {
    animationIndex,
    remapToFace,
    loopCount,
  });
  await pixel.sendMessage(playAnim);
}

/* List of codes for the store values' types. */
export const PixelValueStoreType = {
  dieType: 1,
  colorway: 2,
  runMode: 3,
  validationTimestampStart: 0xa0,
} as const;

/**
 * Requests the Pixel to to store the given value.
 * @param pixel The Pixel instance to use.
 * @param valueType The type of the value to write (8 bits).
 * @param value The value to write (24 bits)
 * @returns A promise that resolves to the result of the store operation.
 */
export async function pixelStoreValue(
  pixel: Pixel,
  valueType: number,
  value: number
): Promise<StoreValueResult> {
  // Check boundaries
  assert(valueType > 0 && valueType <= 0xff);
  assert(value >= 0 && value <= 0xffffff);
  // Build value to send
  const storeValue = ((valueType << 24) | value) >>> 0;
  // And send it to die
  const ack = (await pixel.sendAndWaitForResponse(
    safeAssign(new StoreValue(), { value: storeValue }),
    "storeValueAck"
  )) as StoreValueAck;
  // Check result
  const result =
    getValueKeyName(ack.result, StoreValueResultValues) ?? "unknownError";
  log(
    pixel,
    `Store value 0x${storeValue.toString(16)} of type` +
      ` 0x${valueType.toString(16)} => ${result} (${ack.result}),` +
      ` index: ${ack.index}`
  );
  // Update Pixel instance
  if (result === "success") {
    switch (valueType) {
      case PixelValueStoreType.dieType: {
        const dieType = getValueKeyName(value, PixelDieTypeValues) ?? "unknown";
        log(pixel, `Updating die type to ${dieType}`);
        //@ts-expect-error Private function
        pixel._updateDieType(
          // Pass function parameter on next line to have TS check typing
          dieType
        );
        break;
      }
      case PixelValueStoreType.colorway: {
        const colorway =
          getValueKeyName(value, PixelColorwayValues) ?? "unknown";
        log(pixel, `Updating colorway to ${colorway}`);
        //@ts-expect-error Private function
        pixel._updateColorway(
          // Pass function parameter on next line to have TS check typing
          colorway
        );
        break;
      }
    }
  }
  return result;
}
