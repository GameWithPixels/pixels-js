import { useFocusEffect } from "@react-navigation/native";
import {
  PixelScannerOptions,
  PixelScannerDispatchAction,
  ScannedPixelNotifier,
  useScannedPixelNotifiers,
  PixelScannerStatus,
  ScannedChargerNotifier,
} from "@systemic-games/react-native-pixels-connect";
import React from "react";

// Returned dispatch function is stable
export function useFocusScannedPixelNotifiers(
  opt?: PixelScannerOptions
): [
  (ScannedPixelNotifier | ScannedChargerNotifier)[],
  (action: PixelScannerDispatchAction) => void,
  PixelScannerStatus,
] {
  const obj = useScannedPixelNotifiers(opt);

  // Init / clean up
  const dispatch = obj[1];
  useFocusEffect(
    React.useCallback(() => {
      dispatch("start");
      return () => {
        dispatch("stop");
      };
    }, [dispatch])
  );

  return obj;
}
