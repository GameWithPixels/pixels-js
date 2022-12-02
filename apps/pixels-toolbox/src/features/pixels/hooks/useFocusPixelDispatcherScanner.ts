import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";

import PixelDispatcher from "../PixelDispatcher";
import usePixelDispatcherScanner, {
  UsePixelDispatcherScannerOptions,
} from "./usePixelDispatcherScanner";
import { PixelScannerAction } from "./usePixelScanner";

interface UseFocusPixelDispatcherScannerOptions
  extends UsePixelDispatcherScannerOptions {}

// Returned dispatch function is stable
export default function (
  options?: UseFocusPixelDispatcherScannerOptions
): [PixelDispatcher[], (action: PixelScannerAction) => void, Error?] {
  const [scannedPixels, scannerDispatch, lastError] =
    usePixelDispatcherScanner(options);

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
