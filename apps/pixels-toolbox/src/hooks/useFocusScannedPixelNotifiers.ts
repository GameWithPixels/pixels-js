import { useFocusEffect } from "@react-navigation/native";
import {
  PixelScannerOptions,
  PixelScannerDispatchAction,
  ScannedPixelNotifier,
  useScannedPixelNotifiers,
} from "@systemic-games/react-native-pixels-connect";
import React from "react";

// Returned dispatch function is stable
export function useFocusScannedPixelNotifiers(
  opt?: PixelScannerOptions
): [
  ScannedPixelNotifier[],
  (action: PixelScannerDispatchAction) => void,
  Error?
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
