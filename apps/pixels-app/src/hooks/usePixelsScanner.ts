import {
  PixelScannerStatus,
  ScannedPixelNotifier,
  useScannedPixelNotifiers,
} from "@systemic-games/react-native-pixels-connect";
import React from "react";

import { useForceUpdate } from "./toolbox/useForceUpdate";

import { areArraysEqual } from "~/features/utils";

function filterScannedPixels(scannedPixels: readonly ScannedPixelNotifier[]) {
  const expired = Date.now() - 5000;
  return scannedPixels.filter((p) => p.timestamp.getTime() >= expired);
}

export function usePixelsScanner(
  scan?: boolean
): [ScannedPixelNotifier[], PixelScannerStatus] {
  const [scannedPixels, scannerDispatch, scannerStatus] =
    useScannedPixelNotifiers();

  // Start stop scanner
  React.useEffect(() => {
    if (scan) {
      scannerDispatch("clear");
      scannerDispatch("start");
    } else {
      scannerDispatch("stop");
    }
  }, [scan, scannerDispatch]);

  // Check if the filtered list of scanned pixels needs to be updated
  // TODO move this option to PixelScanner
  const scannedPixelsRef = React.useRef<ScannedPixelNotifier[]>([]);
  scannedPixelsRef.current = scannedPixels;
  const filteredScannedPixelsRef = React.useRef<ScannedPixelNotifier[]>([]);
  const forceUpdate = useForceUpdate();
  React.useEffect(() => {
    if (scan) {
      const id = setInterval(() => {
        const filtered = filterScannedPixels(scannedPixelsRef.current);
        if (!areArraysEqual(filtered, filteredScannedPixelsRef.current)) {
          // List needs to be updated, trigger re-render
          forceUpdate();
        }
      }, 3000);
      // Stop checking when no scan requested
      return () => clearInterval(id);
    }
  }, [forceUpdate, scan]);

  // Remove old scanned pixels
  const filtered = filterScannedPixels(scannedPixels);
  if (!areArraysEqual(filtered, filteredScannedPixelsRef.current)) {
    // New array contents, update reference
    filteredScannedPixelsRef.current = filtered;
  }

  return [filteredScannedPixelsRef.current, scannerStatus];
}
