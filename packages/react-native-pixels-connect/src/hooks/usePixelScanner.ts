import { getPixelUniqueName } from "@systemic-games/pixels-core-connect";
import { useCallback, useEffect, useRef, useState } from "react";

import ScannedPixel from "../ScannedPixel";
import PixelScanNotifier from "./../PixelScanNotifier";

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
 * @param options Optional arguments, see {@link UsePixelScannerOptions}.
 * @returns An array with:
 * - the list of {@link ScannedPixel},
 * - a stable reducer like function to dispatch actions to the scanner.
 * - the last encountered error.
 * @remarks On Android, BLE scanning will fail without error when started more than 5 times
 * during the last 30 seconds.
 */
export function usePixelScanner(
  options?: UsePixelScannerOptions
): [ScannedPixel[], (action: PixelScannerAction) => void, Error?] {
  const [lastError, setLastError] = useState<Error>();

  // Options default values
  const sortedByName = options?.sortedByName ?? false;
  const refreshInterval = options?.refreshInterval ?? 1000;
  const scanFilter = options?.scanFilter;

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
        const scannedPixels = scanFilter
          ? notifierRef.current.scannedPixels.filter(scanFilter)
          : notifierRef.current.scannedPixels;
        if (scannedPixels.length) {
          if (sortedByName) {
            // Note: we sort even if no new entry was added as a die name
            // could have changed since the last sort
            scannedPixels.sort((p1, p2) =>
              getPixelUniqueName(p1).localeCompare(getPixelUniqueName(p2))
            );
          }
          setPixels((prevPixels) => {
            // Compare with existing list
            const l = prevPixels.length;
            if (scannedPixels.length !== l) {
              return scannedPixels;
            }
            for (let i = 0; i < l; ++i) {
              if (prevPixels[i] !== scannedPixels[i]) {
                return scannedPixels;
              }
            }
            return prevPixels;
          });
        }
      }
    }, refreshInterval);
    return () => {
      clearInterval(intervalId);
    };
  }, [sortedByName, refreshInterval, scanFilter]);

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
        notifierRef.current = new PixelScanNotifier();
        notifierRef.current.listener = () => (updatedRef.current = true);
      }
      return notifierRef.current.dispatch(action);
    };
    setLastError(undefined);
    dispatchAsync().catch(setLastError);
  }, []);

  return [pixels, dispatch, lastError];
}
