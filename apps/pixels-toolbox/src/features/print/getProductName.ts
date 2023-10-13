import { PixelInfo } from "@systemic-games/react-native-pixels-connect";

export function getProductName(
  pixelInfo: Pick<PixelInfo, "colorway" | "dieType">
) {
  return `${pixelInfo.dieType}-${pixelInfo.colorway}`.toLowerCase();
}
