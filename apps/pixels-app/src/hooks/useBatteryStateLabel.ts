import {
  Pixel,
  usePixelProp,
} from "@systemic-games/react-native-pixels-connect";

export function useBatteryStateLabel(pixel: Pixel): string | undefined {
  // TODO Set battery to -1 on Pixel initial state
  const battery = usePixelProp(pixel, "batteryLevel");
  const charging = usePixelProp(pixel, "isCharging");
  return battery !== undefined
    ? `Battery: ${battery}%${charging ? "⚡" : ""}`
    : undefined;
}
