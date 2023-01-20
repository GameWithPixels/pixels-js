import { useFocusEffect } from "@react-navigation/native";
import { PixelScannerAction } from "@systemic-games/react-native-pixels-connect";
import { useCallback } from "react";

import PixelDispatcher from "../PixelDispatcher";
import usePixelDispatcherScanner, {
  UsePixelDispatcherScannerOptions,
} from "./usePixelDispatcherScanner";

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
