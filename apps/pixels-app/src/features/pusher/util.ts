import crypto from "react-native-quick-crypto";

export function toOrderedArray(map: { [key: string]: string }): string[] {
  return Object.keys(map)
    .map(function (key) {
      return [key, map[key]];
    })
    .sort(function (a, b) {
      if (a[0] < b[0]) {
        return -1;
      }
      if (a[0] > b[0]) {
        return 1;
      }
      return 0;
    })
    .map(function (pair) {
      return pair[0] + "=" + pair[1];
    });
}

export function getMD5(body: string): string {
  return crypto.createHash("md5").update(body, "utf8").digest("hex");
}

export function secureCompare(a: string, b: string) {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export function isEncryptedChannel(channel: string): boolean {
  return channel.startsWith("private-encrypted-");
}
