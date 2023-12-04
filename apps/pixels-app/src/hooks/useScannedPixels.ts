import React from "react";

// Don't import from ./core-connect/index to avoid require cycle
import { ScannedPixel } from "@/../@systemic-games/pixels-core-connect/ScannedPixel";

export interface ScannedPixelsContextData {
  scannedPixels: ScannedPixel[];
  newScannedPixel: () => void;
  resetScannedList: () => void;
}

export const ScannedPixelsContext =
  React.createContext<ScannedPixelsContextData>({
    scannedPixels: [],
    newScannedPixel: () => {},
    resetScannedList: () => {},
  });

export function useScannedPixels(): ScannedPixelsContextData {
  return { ...React.useContext(ScannedPixelsContext) };
}
