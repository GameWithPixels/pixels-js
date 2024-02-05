import {
  ScanError,
  ScannedPixelNotifier,
} from "@systemic-games/react-native-pixels-connect";
import React from "react";

import { usePixelsCentral } from "./usePixelsCentral";

export function usePixelScanner(): {
  availablePixels: ScannedPixelNotifier[];
  isScanning: boolean;
  lastScanError: Error | undefined;
  startScan: () => void;
  stopScan: () => void;
} {
  const central = usePixelsCentral();
  const [isScanning, setIsScanning] = React.useState(central.isScanning);
  const [lastScanError, setLastScanError] = React.useState<ScanError>();
  const [availablePixels, setAvailablePixels] = React.useState(
    central.availablePixels
  );
  React.useEffect(() => {
    central.addEventListener("isScanning", setIsScanning);
    central.addEventListener("lastError", setLastScanError);
    central.addEventListener("availablePixels", setAvailablePixels);
    return () => {
      central.removeEventListener("isScanning", setIsScanning);
      central.removeEventListener("lastError", setLastScanError);
      central.removeEventListener("availablePixels", setAvailablePixels);
      // Stop scanning on unmount
      console.log(">>>>> STOP SCAN UNMOUNT");
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
    lastScanError,
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
