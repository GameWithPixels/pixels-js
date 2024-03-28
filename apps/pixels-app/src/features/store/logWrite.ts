import { getTimeStringMs } from "../utils";

export function logWrite(msg: string): void {
  if (__DEV__) {
    console.log(`[${getTimeStringMs()}] Store Write ${msg}`);
  }
}
