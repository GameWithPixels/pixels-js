import { useFocusEffect } from "@react-navigation/native";
import {
  PixelScannerAction,
  UsePixelScannerOptions,
  usePixelScanner,
} from "@systemic-games/react-native-pixels-connect";
import ScannedPixel from "@systemic-games/react-native-pixels-connect/src/ScannedPixel";
import { useCallback } from "react";

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
