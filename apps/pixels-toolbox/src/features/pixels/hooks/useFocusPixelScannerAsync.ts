import { useFocusEffect } from "@react-navigation/native";
import { ScannedPixel } from "@systemic-games/react-native-pixels-connect";
import { useCallback } from "react";
import { useErrorHandler } from "react-error-boundary";

import usePixelScanner, {
  PixelScannerAction,
  UsePixelScannerOptions,
} from "./usePixelScannerAsync";

interface UsePixelScannerWithFocusOptions extends UsePixelScannerOptions {}

// Returned dispatch function is stable
export default function (
  options?: UsePixelScannerWithFocusOptions
): [ScannedPixel[], (action: PixelScannerAction) => void] {
  const [scannedPixels, scannerDispatchAsync] = usePixelScanner(options);
  const errorHandler = useErrorHandler();

  const scannerDispatch = useCallback(
    (action: PixelScannerAction) => {
      scannerDispatchAsync(action).catch(errorHandler);
    },
    [scannerDispatchAsync, errorHandler]
  );

  useFocusEffect(
    useCallback(() => {
      scannerDispatch("start");
      return () => {
        scannerDispatch("stop");
      };
    }, [scannerDispatch])
  );

  return [scannedPixels, scannerDispatch];
}
