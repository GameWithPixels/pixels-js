import {
  ScannedPixelNotifier,
  ScanStatus,
} from "@systemic-games/react-native-pixels-connect";
import React from "react";

import { usePixelsCentral } from "./usePixelsCentral";

export function usePixelScanner(): {
  availablePixels: ScannedPixelNotifier[];
  startScan: () => void;
  stopScan: () => void;
  scanError: Error | undefined;
} {
  const central = usePixelsCentral();
  const [availablePixels, setAvailablePixels] = React.useState(
    central.availablePixels
  );
  const [scanError, setScanError] = React.useState<Error>();
  const needStopRef = React.useRef(false);
  React.useEffect(() => {
    central.addEventListener("availablePixels", setAvailablePixels);
    const onScanError = ({ error }: { error: Error }) => setScanError(error);
    central.addEventListener("onScanError", onScanError);
    const onScanStatus = (status: ScanStatus) =>
      status === "scanning" && setScanError(undefined);
    central.addEventListener("scanStatus", onScanStatus);
    return () => {
      central.removeEventListener("availablePixels", setAvailablePixels);
      central.removeEventListener("onScanError", onScanError);
      central.removeEventListener("scanStatus", onScanStatus);
      if (needStopRef.current) {
        needStopRef.current = false;
        central.stopScan();
      }
    };
  }, [central]);
  const startScan = React.useCallback(() => {
    setScanError(undefined);
    central.startScan();
    needStopRef.current = true;
  }, [central]);
  const stopScan = React.useCallback(() => {
    needStopRef.current = false;
    central.stopScan();
  }, [central]);
  return {
    availablePixels,
    startScan,
    stopScan,
    scanError,
  };
}

export function usePixelScannerStatus(): ScanStatus {
  const central = usePixelsCentral();
  const [scanStatus, setScanStatus] = React.useState(central.scanStatus);
  React.useEffect(() => {
    setScanStatus(central.scanStatus);
    central.addEventListener("scanStatus", setScanStatus);
    return () => {
      central.removeEventListener("scanStatus", setScanStatus);
    };
  }, [central]);
  return scanStatus;
}
