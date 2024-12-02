import { ScannedMPCNotifier } from "@systemic-games/react-native-pixels-connect";
import React from "react";

import { usePixelsCentral } from "./usePixelsCentral";

export function useMPCScanner(): {
  availableMPCs: readonly ScannedMPCNotifier[];
  startScan: () => void;
  stopScan: () => void;
  scanError: Error | undefined;
} {
  const central = usePixelsCentral();
  const [availableMPCs, setAvailableMPCs] = React.useState<
    readonly ScannedMPCNotifier[]
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
    setAvailableMPCs((prev) => (prev.length ? [] : prev));
    if (!stopRef.current) {
      const removeOnAvailable = central.addListener(
        "onUnregisteredDeviceScanned",
        ({ status, notifier }) => {
          if (status === "scanned" && notifier.type === "mpc") {
            setAvailableMPCs((notifiers) =>
              notifiers.find((p) => p.pixelId === notifier.pixelId)
                ? notifiers
                : [...notifiers, notifier]
            );
          } else {
            setAvailableMPCs((notifiers) => {
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
  const stopScan = React.useCallback(() => stopRef.current?.(), []);
  return {
    availableMPCs,
    startScan,
    stopScan,
    scanError,
  };
}