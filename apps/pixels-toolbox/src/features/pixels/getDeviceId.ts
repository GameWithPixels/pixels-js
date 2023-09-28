export function getDeviceId(pixelId: number): string {
  let deviceId = "PXL";
  for (let i = 0; i < 8; ++i) {
    const value = (pixelId >> ((7 - i) << 2)) & 0xf;
    deviceId += value.toString(16).toUpperCase();
  }
  return deviceId;
}
