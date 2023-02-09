import {
  getPixelUniqueName,
  PixelScannerAction,
  PixelScanNotifier,
  UsePixelScannerOptions,
} from "@systemic-games/react-native-pixels-connect";
import { useCallback, useEffect, useRef, useState } from "react";

import PixelDispatcher from "../PixelDispatcher";

export interface UsePixelDispatcherScannerOptions
  extends UsePixelScannerOptions {}

/**
 * React hook that instantiates a {@link PixelScanNotifier}
 * and use it to maintain an up-to-date list of {@link PixelDispatcher}.
 * @param options Optional arguments, see {@link UsePixelDispatcherScannerOptions}.
 * @returns An array with:
 * - the list of {@link PixelDispatcher},
 * - a stable reducer like function to dispatch actions to the scanner,
 * - the last encountered error.
 */
export default function (
  options?: UsePixelDispatcherScannerOptions
): [PixelDispatcher[], (action: PixelScannerAction) => void, Error?] {
  const [lastError, setLastError] = useState<Error>();

  // Options default values
  const sortedByName = options?.sortedByName ?? false;
  const refreshInterval = options?.refreshInterval ?? 1000;
  const scanFilter = options?.scanFilter;

  // Pixels scan list and PixelDispatcher list
  const stateRef = useRef({
    notifier: null as PixelScanNotifier | null,
    updated: false,
    cleared: false,
  });
  const [pixels, setPixels] = useState<PixelDispatcher[]>([]);

  // Setup batch updates
  useEffect(() => {
    // TODO run batch updates only when getting updates
    const intervalId = setInterval(() => {
      if (stateRef.current.cleared) {
        stateRef.current.cleared = false;
        setPixels((pixels) => {
          // Clear only disconnected Pixels
          const connected = pixels.filter((p) => p.status !== "disconnected");
          if (pixels.length === connected.length) {
            return pixels;
          } else {
            return connected;
          }
        });
      }
      if (stateRef.current.updated && stateRef.current.notifier) {
        stateRef.current.updated = false;
        const scannedPixels = scanFilter
          ? stateRef.current.notifier.scannedPixels.filter(scanFilter)
          : stateRef.current.notifier.scannedPixels;
        if (scannedPixels.length) {
          setPixels((oldPixels) => {
            const pixels = [...oldPixels];
            let updated = false;
            scannedPixels.forEach((sp) => {
              const index = pixels.findIndex((p) => p.pixelId === sp.pixelId);
              if (index < 0) {
                // New entry
                pixels.push(new PixelDispatcher(sp));
                updated = true;
              } else {
                // Update existing entry
                if (pixels[index].updateScannedPixel(sp)) {
                  updated = true;
                }
              }
            });
            if (updated) {
              if (sortedByName) {
                // Note: we sort even if no new entry was added as a die name
                // could have changed since the last sort
                scannedPixels.sort((p1, p2) =>
                  getPixelUniqueName(p1).localeCompare(getPixelUniqueName(p2))
                );
              }
              return pixels;
            } else {
              return oldPixels;
            }
          });
        }
      }
    }, refreshInterval);
    return () => {
      clearInterval(intervalId);
    };
  }, [sortedByName, refreshInterval, stateRef, scanFilter]);

  // Init / clean up
  useEffect(() => {
    // Stop scanning
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      stateRef.current.notifier
        ?.dispatch("stop")
        .catch((err) => console.error("Error while unmounting", err));
    };
  }, []);

  // The returned dispatcher (stable)
  const dispatch = useCallback((action: PixelScannerAction) => {
    setLastError(undefined);
    if (!stateRef.current.notifier) {
      stateRef.current.notifier = new PixelScanNotifier();
      stateRef.current.notifier.listener = (sp) => {
        if (sp) {
          stateRef.current.updated = true;
        } else {
          stateRef.current.cleared = true;
        }
      };
    }
    stateRef.current.notifier.dispatch(action).catch(setLastError);
  }, []);

  return [pixels, dispatch, lastError];
}
