import {
  getPixelUniqueName,
  ScannedPixel,
} from "@systemic-games/react-native-pixels-connect";
import { useCallback, useEffect, useRef, useState } from "react";

import PixelScanNotifier from "../PixelScanNotifier";

/**
 * Actions to be taken on the Pixel scanner.
 */
export type PixelScannerAction = "start" | "stop" | "clear";

/**
 * Available options for {@link usePixelScanner}.
 */
export interface UsePixelScannerOptions {
  sortedByName?: boolean; // Whether to sort Pixels by name
  scanFilter?: (scannedPixel: ScannedPixel) => boolean; // Optional filter for returned scanned Pixels.
  refreshInterval?: number; // Minimum interval between two state updates
}

/**
 * React hook that instantiates {@link PixelScanner}
 * and use it to maintain an up-to-date list of {@link PixelDispatcher}.
 * @param options See {@link UsePixelScannerOptions}
 * @returns The list of {@link ScannedPixel} and stable reducer like function
 * to dispatch actions to the scanner.
 */
export default function (
  options?: UsePixelScannerOptions
): [ScannedPixel[], (action: PixelScannerAction) => void, Error?] {
  const [lastError, setLastError] = useState<Error>();

  // Options default values
  const sortedByName = options?.sortedByName ?? false;
  const refreshInterval = options?.refreshInterval ?? 1000;
  // TODO only scanFilter initial value is used
  const scanFilterRef = useRef(options?.scanFilter);

  // Pixels scan list and PixelDispatcher list
  const notifierRef = useRef<PixelScanNotifier>();
  const updatedRef = useRef(false);
  const [pixels, setPixels] = useState<ScannedPixel[]>([]);

  // Setup batch updates
  useEffect(() => {
    // TODO run batch updates only when getting updates
    const intervalId = setInterval(() => {
      if (updatedRef.current && notifierRef.current) {
        updatedRef.current = false;
        const scannedPixels = notifierRef.current.scannedPixels;
        if (sortedByName) {
          // Note: we sort even if no new entry was added as a die name
          // could have changed since the last sort
          scannedPixels.sort((p1, p2) =>
            getPixelUniqueName(p1).localeCompare(getPixelUniqueName(p2))
          );
        }
        setPixels(scannedPixels);
      }
    }, refreshInterval);
    return () => {
      clearInterval(intervalId);
    };
  }, [sortedByName, refreshInterval]);

  // Init / clean up
  useEffect(() => {
    // Stop scanning
    return () => {
      notifierRef.current
        ?.dispatch("stop")
        .catch((err) => console.error("Error while unmounting", err));
    };
  }, []);

  // The returned dispatcher (stable)
  const dispatch = useCallback((action: PixelScannerAction) => {
    const dispatchAsync = async () => {
      if (!notifierRef.current) {
        notifierRef.current = new PixelScanNotifier(
          () => (updatedRef.current = true),
          scanFilterRef.current
        );
      }
      return notifierRef.current.dispatch(action);
    };
    setLastError(undefined);
    dispatchAsync().catch(setLastError);
  }, []);

  return [pixels, dispatch, lastError];
}
