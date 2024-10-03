import {
  ScannedPixelNotifier,
  ScanStatus,
} from "@systemic-games/react-native-pixels-connect";
import React from "react";

import { usePixelsCentral } from "./usePixelsCentral";

export function usePixelScanner(): {
  availablePixels: readonly ScannedPixelNotifier[];
  startScan: () => void;
  stopScan: () => void;
  scanError: Error | undefined;
} {
  const central = usePixelsCentral();
  const [availablePixels, setAvailablePixels] = React.useState<
    readonly ScannedPixelNotifier[]
  >([]);
  const [scanError, setScanError] = React.useState<Error>();
  const stopRef = React.useRef<(() => void) | null>(null);
  React.useEffect(() => {
    setScanError(undefined);
    const removeOnScanError = central.addListener("onScanError", ({ error }) =>
      setScanError(error)
    );
    const removeScanStatus = central.addListener(
      "scanStatus",
      (status) => status === "scanning" && setScanError(undefined)
    );
    return () => {
      removeOnScanError();
      removeScanStatus();
      stopRef.current?.();
    };
  }, [central]);
  const startScan = React.useCallback(() => {
    if (!stopRef.current) {
      const removeOnAvailable = central.addListener(
        "onAvailability",
        ({ status, notifier }) => {
          if (status === "available") {
            setAvailablePixels((notifiers) => {
              if (!notifiers.find((p) => p.pixelId === notifier.pixelId)) {
                return [...notifiers, notifier];
              } else {
                return notifiers;
              }
            });
          } else {
            setAvailablePixels((notifiers) => {
              const newNotifiers = notifiers.filter(
                (p) => p.pixelId !== notifier.pixelId
              );
              return newNotifiers.length === notifiers.length
                ? notifiers
                : newNotifiers;
            });
          }
        }
      );
      const stop = central.scanForPixels();
      stopRef.current = () => {
        stopRef.current = null;
        removeOnAvailable();
        stop();
      };
    }
  }, [central]);
  const stopScan = React.useCallback(() => {
    stopRef.current?.();
  }, []);
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
    return central.addListener("scanStatus", setScanStatus);
  }, [central]);
  return scanStatus;
}
