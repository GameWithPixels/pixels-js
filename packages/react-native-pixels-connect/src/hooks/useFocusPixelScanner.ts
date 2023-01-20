import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";

import ScannedPixel from "../ScannedPixel";
import usePixelScanner, {
  PixelScannerAction,
  UsePixelScannerOptions,
} from "./usePixelScanner";

export interface UseFocusPixelScannerOptions extends UsePixelScannerOptions {}

// Returned dispatch function is stable
export default function (
  options?: UseFocusPixelScannerOptions
): [ScannedPixel[], (action: PixelScannerAction) => void, Error?] {
  const [scannedPixels, scannerDispatch, lastError] = usePixelScanner(options);

  useFocusEffect(
    useCallback(() => {
      scannerDispatch("start");
      return () => {
        scannerDispatch("stop");
      };
    }, [scannerDispatch])
  );

  return [scannedPixels, scannerDispatch, lastError];
}
