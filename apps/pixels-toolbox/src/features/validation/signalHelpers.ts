import { delay, safeAssign } from "@systemic-games/pixels-core-utils";
import {
  Color,
  MessageOrType,
  Pixel,
  PixelMutableProps,
  PixelWaitForMessageDisconnectError,
  PixelWaitForMessageTimeoutError,
  RequestTelemetry,
  Telemetry,
  TelemetryRequestModeValues,
} from "@systemic-games/react-native-pixels-connect";
import { useTranslation } from "react-i18next";

import { ErrorCodes } from "./ErrorCodes";
import { ValidationError } from "./ValidationError";

import { pixelStopAllAnimations } from "~/features/pixels/extensions";
import { TaskCanceledError } from "~/features/tasks";

export class SignalTimeoutError extends ValidationError {
  readonly errorCode = ErrorCodes.Timeout;
  readonly timeout: number;
  constructor(ms: number, reason?: string) {
    super(`Timed out after ${ms}ms` + (reason ? `, ${reason}` : ""));
    this.name = "SignalTimeoutError";
    this.timeout = ms;
  }
  toLocalizedString(t: ReturnType<typeof useTranslation>["t"]): string {
    return t("timedOutWithValue", { value: Math.round(this.timeout / 1000) });
  }
}

export class DisconnectedError extends ValidationError {
  readonly errorCode = ErrorCodes.Disconnected;
  readonly pixel: Pixel;
  constructor(pixel: Pixel) {
    super();
    this.name = "DisconnectedError";
    this.pixel = pixel;
  }
  toLocalizedString(t: ReturnType<typeof useTranslation>["t"]): string {
    return t("disconnectedFromPixel");
  }
}

export class SendMessageError extends ValidationError {
  readonly errorCode = ErrorCodes.SendMessageFailed;
  readonly pixel: Pixel;
  constructor(pixel: Pixel, error: unknown) {
    super();
    this.name = "SendMessageError";
    this.pixel = pixel;
    this.cause = error;
  }
  toLocalizedString(t: ReturnType<typeof useTranslation>["t"]): string {
    return t("failedToSendMessageToPixel") + ` ${this.cause}`;
  }
}

export function getSignalReason(signal: AbortSignal, testName?: string): any {
  // No error when using DOM types -- @ts-expect-error reason not implemented in React Native)
  const reason = signal.reason;
  return reason ?? (testName ? new TaskCanceledError(testName) : undefined);
}

export class AbortControllerWithReason extends AbortController {
  abortWithReason(reason: any): void {
    // @ts-expect-error reason not implemented in React Native
    this.signal.reason = reason;
    this.abort();
  }
}

export function timeoutSignal(ms: number): [AbortSignal, () => void] {
  const controller = new AbortControllerWithReason();
  const id = setTimeout(() => {
    controller.abortWithReason(new SignalTimeoutError(ms));
  }, ms);
  return [controller.signal, () => clearTimeout(id)];
}

export function connectedSignal(
  pixel: Pixel
): [AbortSignal, (() => void) | undefined] {
  const controller = new AbortControllerWithReason();
  if (pixel.status !== "ready") {
    controller.abortWithReason(new DisconnectedError(pixel));
    return [controller.signal, undefined];
  } else {
    const listener = ({ status }: PixelMutableProps) => {
      if (status === "disconnecting" || status === "disconnected") {
        controller.abortWithReason(new DisconnectedError(pixel));
      }
    };
    pixel.addPropertyListener("status", listener);
    return [
      controller.signal,
      () => pixel.removePropertyListener("status", listener),
    ];
  }
}

export function anySignal(
  signals: Iterable<AbortSignal>
): [AbortSignal, () => void] {
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

export async function withPromise<T = void>(
  abortSignal: AbortSignal,
  testName: string,
  mount: (
    resolve: (value: T | PromiseLike<T>) => void,
    reject: (error: any) => void
  ) => void,
  unmount?: () => void
): Promise<T> {
  if (abortSignal.aborted) {
    throw getSignalReason(abortSignal, testName);
  }
  let rejectPromise: (() => void) | undefined;
  try {
    return await new Promise<T>((resolve, reject) => {
      rejectPromise = () => reject(getSignalReason(abortSignal, testName));
      abortSignal.addEventListener("abort", rejectPromise);
      mount(resolve, reject);
    });
  } finally {
    if (rejectPromise) {
      abortSignal.removeEventListener("abort", rejectPromise);
    }
    unmount?.();
  }
}

export async function withTimeout<T = void>(
  signal: AbortSignal,
  timeoutMs: number,
  promise: (signal: AbortSignal) => Promise<T>
): Promise<T> {
  const [tSignal, tCleanup] = timeoutSignal(timeoutMs);
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
    return await promise(combinedSignal);
  } finally {
    cleanupAll();
  }
}

export async function withTimeoutAndDisconnect<T = void>(
  signal: AbortSignal,
  pixel: Pixel,
  timeoutMs: number,
  promise: (signal: AbortSignal) => Promise<T>
): Promise<T> {
  const [tSignal, tCleanup] = timeoutSignal(timeoutMs);
  const [ccSignal, ccCleanup] = connectedSignal(pixel);
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
    return await promise(combinedSignal);
  } finally {
    cleanupAll();
  }
}

export async function withBlink<T = void>(
  abortSignal: AbortSignal,
  pixel: Pixel,
  blinkColor: Color,
  promise: () => Promise<T>,
  opt?: {
    faceMask?: number;
  }
): Promise<T> {
  let status: "init" | "blink" | "cancel" = "init";
  const blink = async () => {
    if (!abortSignal.aborted) {
      try {
        await pixelStopAllAnimations(pixel);
      } catch (error) {
        throw convertSendMessageError(pixel, error);
      }
    }
    if (!abortSignal.aborted && status !== "cancel") {
      status = "blink";
      // Blink for as long as we can
      try {
        await pixel.blink(blinkColor, {
          count: 65,
          duration: 65 * 1000,
          faceMask: opt?.faceMask,
          loopCount: 0xff,
        });
      } catch (error) {
        throw convertSendMessageError(pixel, error);
      }
    }
  };
  try {
    blink().catch(() => {});
    return await promise();
  } finally {
    // @ts-ignore status may have been changed in async task
    if (status === "blink") {
      pixelStopAllAnimations(pixel).catch(() => {});
    }
    status = "cancel";
  }
}

export async function withSolidColor<T = void>(
  abortSignal: AbortSignal,
  pixel: Pixel,
  color: Color,
  promise: () => Promise<T>,
  opt?: {
    faceMask?: number;
  }
): Promise<T> {
  let status: "init" | "blink" | "cancel" = "init";
  const lightUp = async () => {
    if (!abortSignal.aborted) {
      try {
        await pixelStopAllAnimations(pixel);
      } catch (error) {
        throw convertSendMessageError(pixel, error);
      }
    }
    const duration = 0xffff;
    while (!abortSignal.aborted && status !== "cancel") {
      status = "blink";
      await pixel.blink(color, {
        duration,
        faceMask: opt?.faceMask,
      });
      await delay(duration / 2, abortSignal);
    }
  };
  try {
    lightUp().catch(() => {});
    return await promise();
  } finally {
    // @ts-ignore status may have been changed in async task
    if (status === "blink") {
      pixelStopAllAnimations(pixel).catch(() => {});
    }
    status = "cancel";
  }
}

export function convertSendMessageError(pixel: Pixel, error: unknown): Error {
  // TODO Assume we got a message timeout because of a disconnection
  if (
    error instanceof PixelWaitForMessageDisconnectError ||
    error instanceof PixelWaitForMessageTimeoutError
  ) {
    return new DisconnectedError(pixel);
  } else {
    return new SendMessageError(pixel, error);
  }
}

export async function withTelemetry(
  abortSignal: AbortSignal,
  testName: string,
  pixel: Pixel,
  listener: (msg: Telemetry) => boolean // Return true to stop telemetry
): Promise<void> {
  if (abortSignal.aborted) {
    throw getSignalReason(abortSignal, testName);
  } else {
    // Start telemetry
    try {
      await pixel.sendMessage(
        safeAssign(new RequestTelemetry(), {
          requestMode: TelemetryRequestModeValues.automatic,
          minInterval: 100,
        })
      );
    } catch (error) {
      throw convertSendMessageError(pixel, error);
    }

    let firstError: any | undefined;
    let telemetryListener: ((msg: MessageOrType) => void) | undefined;
    // Process telemetry messages
    try {
      await withPromise<void>(abortSignal, testName, (resolve, reject) => {
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
      });
    } catch (error) {
      firstError = error;
    } finally {
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
          firstError = convertSendMessageError(pixel, error);
        }
      }
      if (firstError) {
        throw firstError;
      }
    }
  }
}
