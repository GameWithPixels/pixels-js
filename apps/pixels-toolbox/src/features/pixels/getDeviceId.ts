import { Pixel } from "@systemic-games/react-native-pixels-connect";

export function getDeviceId(pixel: Pixel): string {
  let deviceId = "PXL";
  const pixelId = pixel.pixelId;
  for (let i = 0; i < 8; ++i) {
    const value = (pixelId >> ((7 - i) << 2)) & 0xf;
    deviceId += value.toString(16).toUpperCase();
  }
  return deviceId;
}
