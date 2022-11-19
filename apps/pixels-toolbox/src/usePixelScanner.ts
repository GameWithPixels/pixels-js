import {
  getPixelUniqueName,
  PixelScanner,
  ScannedPixel,
} from "@systemic-games/react-native-pixels-connect";
import { useCallback, useEffect, useRef, useState } from "react";

import SequentialPromiseQueue from "./SequentialPromiseQueue";

// Return whether 2 scanned dice are the same
// Note: we can't rely on the name as it may change overtime
// and is not guaranteed to be unique.
function isSame(p1?: ScannedPixel, p2?: ScannedPixel) {
  return p1 && p2 && p1.pixelId && p1.pixelId === p2.pixelId;
}

// Update a list of scanned Pixels with the give scanned Pixel
function updateScannedPixels(
  pixels: ScannedPixel[],
  pixel: ScannedPixel
): void {
  // Do we already have an entry for this scanned Pixel?
  const index = pixels.findIndex((p) => isSame(p, pixel));
  if (index < 0) {
    // New entry
    pixels.push(pixel);
  } else {
    // Replace previous entry
    pixels[index] = pixel;
  }
}

/**
 * Actions to be taken on the Pixel scanner.
 */
export type PixelScannerAction = "start" | "stop" | "clear";

// Internal state description
interface ScanState {
  scanner: PixelScanner;
  queue: SequentialPromiseQueue;
  lastPixels: ScannedPixel[];
  listener?: (pixel: ScannedPixel) => void;
}

// Initialize a new state instance
function scanStateInit(): ScanState {
  return {
    scanner: new PixelScanner(),
    queue: new SequentialPromiseQueue(),
    lastPixels: [],
  };
}

// Reducer like function for a PixelScanner
async function scanAction(
  action: PixelScannerAction,
  state: ScanState
): Promise<void> {
  return state.queue.run(async () => {
    const scanner = state.scanner;
    switch (action) {
      case "start":
        // Check if a scan was already started
        if (!state.listener) {
          // Start and then subscribe to the event, so the subscription isn't made
          // if start() throws an exception
          await scanner.start();
          const listener = (p: ScannedPixel) =>
            updateScannedPixels(state.lastPixels, p);
          scanner.addEventListener("scannedPixel", listener);
          // Update state once all operations have completed successfully
          state.listener = listener;
        }
        break;
      case "stop":
        // Check if a scan was already started
        if (state.listener) {
          // Remove event subscription first so it doesn't stay if stop()
          // throws an exception
          scanner.removeEventListener("scannedPixel", state.listener);
          await scanner.stop();
          // Update state once all operations have completed successfully
          state.listener = undefined;
        }
        break;
      case "clear":
        state.lastPixels.length = 0;
        break;
      default: {
        const check: never = action;
        throw new Error(check);
      }
    }
  });
}

/**
 * Available options for {@link usePixelScanner}.
 */
export interface UsePixelScannerOptions {
  sortedByName?: boolean; // Whether to sort Pixels by name
  scanFilter?: (scannedPixel: ScannedPixel) => boolean; // Optional filter for returned scanned Pixels.
  refreshInterval?: number; // Minimum interval between two state updates
}

/**
 * React hook that instantiates and controls a  {@link PixelScanner}
 * @param options See @UsePixelScannerOptions
 * @returns The list of @ScannedPixel and stable reducer like function
 * to trigger actions on the scanner.
 */
export default function (
  options?: UsePixelScannerOptions
): [ScannedPixel[], (action: PixelScannerAction) => Promise<void>] {
  // Apply options default values
  const sortedByName = options?.sortedByName ?? false;
  const refreshInterval = options?.refreshInterval ?? 1000;

  // Store list of Pixels in a state
  const [pixels, setPixels] = useState<ScannedPixel[]>([]);
  // And store ScanState in a reference
  const stateRef = useRef<ScanState>();

  // Setup batch updates
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (stateRef.current?.lastPixels.length) {
        // Keep the list of newly scanned Pixels
        const lastPixels = options?.scanFilter
          ? stateRef.current.lastPixels.filter(options?.scanFilter)
          : [...stateRef.current.lastPixels];
        // And reset the stored list
        stateRef.current.lastPixels.length = 0;
        // TODO check stateRef.current?.scanner.isScanning
        if (lastPixels.length) {
          setPixels((scannedPixels) => {
            // Create a new array so to always update state
            scannedPixels = [...scannedPixels];
            // Add or update last scanned pixels
            lastPixels.forEach((p) => updateScannedPixels(scannedPixels, p));
            // Sort
            if (sortedByName) {
              // Note: we sort even if no new entry was added as a die name
              // could have changed since the last sort
              scannedPixels.sort((p1, p2) =>
                getPixelUniqueName(p1).localeCompare(getPixelUniqueName(p2))
              );
            }
            return scannedPixels;
          });
        }
      }
    }, refreshInterval);
    return () => {
      clearInterval(intervalId);
    };
  }, [options?.scanFilter, sortedByName, refreshInterval]);

  // Clean up
  useEffect(() => {
    // Stop scanning
    return () => {
      if (stateRef.current) {
        scanAction("stop", stateRef.current).catch((err) =>
          console.error("Error while unmounting", err)
        );
      }
    };
  }, []);

  // Similar to a useReducer() dispatch function
  const dispatch = useCallback((action: PixelScannerAction) => {
    if (action === "clear") {
      setPixels((pixels) => (pixels.length ? [] : pixels));
    }
    if (!stateRef.current) {
      stateRef.current = scanStateInit();
    }
    return scanAction(action, stateRef.current);
  }, []);

  return [pixels, dispatch];
}
