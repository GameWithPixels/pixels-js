import { PixelInfo } from "@systemic-games/react-native-pixels-connect";

export interface PairedPixel
  extends Pick<
    PixelInfo,
    "systemId" | "pixelId" | "name" | "dieType" | "colorway"
  > {}
