import { delay, safeAssign } from "@systemic-games/pixels-core-utils";
import {
  Color,
  Pixel,
  PixelStatus,
  RequestTelemetry,
  Telemetry,
  MessageOrType,
  TelemetryRequestModeValues,
} from "@systemic-games/react-native-pixels-connect";

import { pixelStopAllAnimations } from "../pixels/extensions";

import { TaskCanceledError } from "~/features/tasks/useTask";

export class ValidationTestsTimeoutError extends Error {
  constructor(ms: number) {
    super(`Timed out after waiting ${Math.round(ms / 1000)}s`);
    this.name = "ValidationTestsTimeoutError";
  }
}

export class ValidationTestsDisconnectedError extends Error {
  constructor() {
    super(`Disconnected from Pixel`);
    this.name = "ValidationTestsDisconnectedError";
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
    controller.abortWithReason(new ValidationTestsTimeoutError(ms));
  }, ms);
  return [controller.signal, () => clearTimeout(id)];
}

export function connectedSignal(
  pixel: Pixel
): [AbortSignal, (() => void) | undefined] {
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

export async function withPromise<T>(
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

export async function withTimeout(
  signal: AbortSignal,
  timeoutMs: number,
  promise: (signal: AbortSignal) => Promise<void>
): Promise<void> {
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
    await promise(combinedSignal);
  } finally {
    cleanupAll();
  }
}

export async function withTimeoutAndDisconnect(
  signal: AbortSignal,
  pixel: Pixel,
  promise: (signal: AbortSignal) => Promise<void>,
  timeoutMs: number
): Promise<void> {
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
    await promise(combinedSignal);
  } finally {
    cleanupAll();
  }
}

export async function withBlink(
  abortSignal: AbortSignal,
  pixel: Pixel,
  blinkColor: Color,
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

export async function withSolidColor(
  abortSignal: AbortSignal,
  pixel: Pixel,
  color: Color,
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
    await pixel.sendMessage(
      safeAssign(new RequestTelemetry(), {
        requestMode: TelemetryRequestModeValues.automatic,
        minInterval: 100,
      })
    );

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
          firstError = error;
        }
      }
      if (firstError) {
        throw firstError;
      }
    }
  }
}
