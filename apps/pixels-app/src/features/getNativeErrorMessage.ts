import { getNativeErrorCode } from "@systemic-games/react-native-pixels-connect";

export function getNativeErrorMessage(error: unknown): string {
  if (!error) {
    return "No error";
  }
  const e = error as Error;
  const code = getNativeErrorCode(e);
  if (code) {
    return `${e.message ?? error} (${code})`;
  } else {
    return e.message ?? String(error);
  }
}
