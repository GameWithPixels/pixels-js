import { ScannedPixelNotifier } from "@systemic-games/react-native-pixels-connect";
import React from "react";

import { usePixelsCentral } from "./usePixelsCentral";

export function usePixelScanner(): {
  availablePixels: ScannedPixelNotifier[];
  isScanning: boolean;
  startScan: () => void;
  stopScan: () => void;
} {
  const central = usePixelsCentral();
  const [isScanning, setIsScanning] = React.useState(central.isScanning);
  const [availablePixels, setAvailablePixels] = React.useState(
    central.availablePixels
  );
  React.useEffect(() => {
    central.addEventListener("isScanning", setIsScanning);
    central.addEventListener("availablePixels", setAvailablePixels);
    return () => {
      central.removeEventListener("isScanning", setIsScanning);
      central.removeEventListener("availablePixels", setAvailablePixels);
      // Stop scanning on unmount
      central.stopScan();
    };
  }, [central]);
  const startScan = React.useCallback(
    () => central.startScan("discovery"),
    [central]
  );
  const stopScan = React.useCallback(() => central.stopScan(), [central]);
  return {
    availablePixels,
    isScanning,
    startScan,
    stopScan,
  };
}

export function usePairedDiceScanner(): () => void {
  const central = usePixelsCentral();
  // Don't stop scanning on unmount to not interfere with other scans
  // It will automatically stop after a little while anyways
  return React.useCallback(() => central.startScan("paired"), [central]);
}
