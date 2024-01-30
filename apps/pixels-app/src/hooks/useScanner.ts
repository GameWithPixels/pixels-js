import {
  ScannedPixelNotifier,
  ScanStatus,
} from "@systemic-games/react-native-pixels-connect";
import React from "react";

import { PixelsCentralContext } from "./usePixelsCentral";

export function useScanner(): {
  availablePixels: ScannedPixelNotifier[];
  scannerStatus: ScanStatus;
  startScan: (duration?: number) => void;
  stopScan: () => void;
} {
  const central = React.useContext(PixelsCentralContext);
  const [scannerStatus, setScannerStatus] = React.useState(
    central.scannerStatus
  );
  const [availablePixels, setAvailablePixels] = React.useState(
    central.availablePixels
  );
  React.useEffect(() => {
    central.addEventListener("scannerStatus", setScannerStatus);
    central.addEventListener("availablePixels", setAvailablePixels);
    return () => {
      central.removeEventListener("scannerStatus", setScannerStatus);
      central.removeEventListener("availablePixels", setAvailablePixels);
      // Stop scanning on unmount
      central.stopScan();
    };
  }, [central]);
  const startStop = React.useMemo(
    () => ({
      startScan: (duration?: number) => central.startScan(duration),
      stopScan: () => central.stopScan(),
    }),
    [central]
  );
  return {
    availablePixels,
    scannerStatus,
    ...startStop,
  };
}
