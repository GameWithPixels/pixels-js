import { safeAssign } from "@systemic-games/pixels-core-utils";
import {
  BlinkId,
  Discharge,
  Pixel,
  PlayProfileAnimation,
  TransferTest,
} from "@systemic-games/react-native-pixels-connect";

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
    loop: opt?.loop ?? false,
  });
  await pixel.sendAndWaitForResponse(blinkMsg, "blinkIdAck");
}

/**
 * Requests Pixel to turn on/off charging.
 * @param pixel The Pixel instance to use.
 * @param enable Whether to enable charging feature.
 */
export async function pixelForceEnableCharging(
  pixel: Pixel,
  enable: boolean
): Promise<void> {
  if (enable) {
    await pixel.sendMessage(
      "enableCharging",
      true // withoutAck
    );
  } else {
    await pixel.sendMessage(
      "disableCharging",
      true // withoutAck
    );
  }
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
  // Notify that we're starting
  //sendBytesCallback?.(0);

  const transferMsg = safeAssign(new TransferTest(), {
    size,
  });
  await pixel.sendAndWaitForResponse(transferMsg, "transferTestAck");

  const data = Array(size).fill(0);
  await pixel.uploadBulkDataWithAck(
    "transferTestFinished",
    new Uint8Array(data),
    sendBytesCallback,
    "bytes"
  );
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
 * @param remapToFace Face on which to play the animation (the animations are designed as if the higher face value is up).
 * @param loop Whether to indefinitely loop the animation.
 */
export async function pixelPlayProfileAnimation(
  pixel: Pixel,
  animationIndex: number,
  remapToFace = 0,
  loop = false
): Promise<void> {
  const playAnim = safeAssign(new PlayProfileAnimation(), {
    animationIndex,
    remapToFace,
    loop,
  });
  await pixel.sendMessage(playAnim);
}
