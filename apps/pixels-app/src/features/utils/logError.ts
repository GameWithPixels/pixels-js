import * as Sentry from "@sentry/react-native";

export function logError(msg: string): void {
  console.error(msg);
  try {
    Sentry.captureMessage(msg, "error");
  } catch (e) {
    console.error(`Error logging to Sentry: ${e}`);
  }
}
