import { assert } from "@systemic-games/pixels-core-utils";
import {
  Pixel,
  ScannedPixel,
} from "@systemic-games/react-native-pixels-connect";
import React from "react";

export interface PairedPixelsContextData {
  pairedPixels: Pixel[];
  pairDie: (pixel: ScannedPixel) => void;
  unpairDie: (pixel: Pixel) => void;
}

export const PairedPixelsContext = React.createContext<PairedPixelsContextData>(
  { pairedPixels: [], pairDie: () => {}, unpairDie: () => {} }
);

export function usePairedPixels() {
  return { ...React.useContext(PairedPixelsContext) };
}

export function usePairedPixel(pixelId: number): Pixel {
  const { pairedPixels } = React.useContext(PairedPixelsContext);
  const pixel = pairedPixels.find((p) => p.pixelId === pixelId);
  assert(pixel, `Pixel ${pixelId.toString(16).padStart(8)} not found`);
  return pixel;
}
