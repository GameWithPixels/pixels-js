import {
  PixelInfoNotifier,
  usePixelInfoProp,
} from "@systemic-games/react-native-pixels-connect";

export function usePixelRssiLabel(pixel?: PixelInfoNotifier) {
  const rssi = usePixelInfoProp(pixel, "rssi");
  return rssi !== undefined ? `${rssi} dBm` : undefined;
}
