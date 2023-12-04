import { ScannedPixel } from "@systemic-games/react-native-pixels-connect";
import React from "react";

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
