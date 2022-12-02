import { getPixelUniqueName } from "@systemic-games/react-native-pixels-connect";
import { useCallback, useEffect, useRef, useState } from "react";

import PixelDispatcher from "../PixelDispatcher";
import PixelScanNotifier from "../PixelScanNotifier";
import { PixelScannerAction, UsePixelScannerOptions } from "./usePixelScanner";

export interface UsePixelDispatcherScannerOptions
  extends UsePixelScannerOptions {}

/**
 * React hook that instantiates a {@link PixelScanNotifier}
 * and use it to maintain an up-to-date list of {@link PixelDispatcher}.
 * @param options See {@link UsePixelDispatcherScannerOptions}
 * @returns The list of {@link PixelDispatcher} and stable reducer like function
 * to dispatch actions to the scan notifier.
 */
export default function (
  options?: UsePixelDispatcherScannerOptions
): [PixelDispatcher[], (action: PixelScannerAction) => void, Error?] {
  const [lastError, setLastError] = useState<Error>();

  // Options default values
  const sortedByName = options?.sortedByName ?? false;
  const refreshInterval = options?.refreshInterval ?? 1000;
  // TODO only scanFilter initial value is used
  const scanFilterRef = useRef(options?.scanFilter);

  // Pixels scan list and PixelDispatcher list
  const stateRef = useRef({
    notifier: null as PixelScanNotifier | null,
    updated: false,
    cleared: false,
  });
  const [pixels, setPixels] = useState<PixelDispatcher[]>([]);

  // Setup batch updates
  useEffect(() => {
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
        const scannedPixels = stateRef.current.notifier.scannedPixels;
        setPixels((oldPixels) => {
          const pixels = [...oldPixels];
          scannedPixels.forEach((sp) => {
            const index = pixels.findIndex((p) => p.pixelId === sp.pixelId);
            if (index < 0) {
              // New entry
              pixels.push(new PixelDispatcher(sp));
            } else {
              // Update existing entry
              pixels[index].updateScannedPixel(sp);
            }
          });
          if (sortedByName) {
            // Note: we sort even if no new entry was added as a die name
            // could have changed since the last sort
            scannedPixels.sort((p1, p2) =>
              getPixelUniqueName(p1).localeCompare(getPixelUniqueName(p2))
            );
          }
          return pixels;
        });
      }
    }, refreshInterval);
    return () => {
      clearInterval(intervalId);
    };
  }, [sortedByName, refreshInterval, stateRef]);

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
      stateRef.current.notifier = new PixelScanNotifier((sp) => {
        if (sp) {
          stateRef.current.updated = true;
        } else {
          stateRef.current.cleared = true;
        }
      }, scanFilterRef.current);
    }
    stateRef.current.notifier.dispatch(action).catch(setLastError);
  }, []);

  return [pixels, dispatch, lastError];
}
