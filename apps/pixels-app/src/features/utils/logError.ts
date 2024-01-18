import * as Sentry from "sentry-expo";

export function logError(msg: string): void {
  console.error(msg);
  try {
    Sentry.Native.captureMessage(msg, "error");
  } catch (e) {
    console.error(`Error logging to Sentry: ${e}`);
  }
}
