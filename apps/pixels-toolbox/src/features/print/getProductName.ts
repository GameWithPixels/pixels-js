import { PixelInfo } from "@systemic-games/react-native-pixels-connect";

export function getProductName(
  pixelInfo: Pick<PixelInfo, "colorway" | "dieType">
) {
  if (pixelInfo.colorway === "unknown") {
    throw new Error("getProductName: got unknown colorway");
  }
  if (pixelInfo.dieType === "unknown") {
    throw new Error("getProductName: got unknown dieType");
  }
  return `${pixelInfo.dieType}-${pixelInfo.colorway}`.toLowerCase();
}
