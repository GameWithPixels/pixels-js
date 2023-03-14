import { useFocusEffect } from "@react-navigation/native";
import { PixelScannerAction } from "@systemic-games/react-native-pixels-connect";
import { useCallback } from "react";

import usePixelDispatcherScanner, {
  UsePixelDispatcherScannerOptions,
} from "./usePixelDispatcherScanner";
import PixelDispatcher from "../PixelDispatcher";

interface UseFocusPixelDispatcherScannerOptions
  extends UsePixelDispatcherScannerOptions {}

/**
 * React hook that starts and stops Pixel Bluetooth scans based on React Navigation focus events.
 * See {@link usePixelDispatcherScanner} for more information.
 * @param options Optional arguments, see {@link UseFocusPixelDispatcherScannerOptions}.
 * @returns An array with:
 * - the list of {@link PixelDispatcher},
 * - a stable reducer like function to dispatch actions to the scanner,
 * - the last encountered error.
 */
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
