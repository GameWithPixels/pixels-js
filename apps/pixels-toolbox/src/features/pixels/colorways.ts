import {
  PixelColorway,
  PixelColorwayValues,
} from "@systemic-games/react-native-pixels-connect";

export const Colorways = (
  Object.keys(PixelColorwayValues) as PixelColorway[]
).filter((c) => c !== "unknown" && c !== "custom");
