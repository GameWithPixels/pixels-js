import { safeAssign } from "@systemic-games/pixels-core-utils";
import {
  BlinkId,
  Discharge,
  Pixel,
  TransferTest,
} from "@systemic-games/react-native-pixels-connect";

/**
 * Requests Pixel to blink its Pixel id with red, green, blue light patterns
 * and wait for a confirmation.
 * @param opt.brightness Brightness between 0 and 255.
 * @param opt.loop Whether to indefinitely loop the animation.
 */
export async function pixelBlinkId(
  pixel: Pixel,
  opt?: { brightness?: number; loop?: boolean }
) {
  const blinkMsg = safeAssign(new BlinkId(), {
    brightness: opt?.brightness ? opt?.brightness : 0x10,
    loop: opt?.loop ?? false,
  });
  await pixel.sendAndWaitForResponse(blinkMsg, "blinkIdAck");
}

/**
 * Requests Pixel to turn on/off charging.
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
 * @param currentMA The (approximate) desired discharge current, or false to stop discharging.
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
 */
export async function pixelReprogramDefaultBehavior(pixel: Pixel) {
  await pixel.sendAndWaitForResponse(
    "programDefaultAnimationSet",
    "programDefaultAnimationSetFinished"
  );
}
