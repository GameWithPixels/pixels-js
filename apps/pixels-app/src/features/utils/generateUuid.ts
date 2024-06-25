import * as Crypto from "expo-crypto";

export function generateUuid(): string {
  let uuid = "";
  // Workaround randomUUID() sometimes returning a promise object
  // https://github.com/expo/expo/issues/24021
  let counter = 10;
  do {
    uuid = Crypto.randomUUID();
  } while (typeof uuid !== "string" && --counter >= 0);
  if (typeof uuid !== "string") {
    // Generating UUID failed, fallback to manual generation
    // https://stackoverflow.com/a/2117523
    uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
  }
  return uuid;
}
