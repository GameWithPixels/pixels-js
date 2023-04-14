import React from "react";

import {
  usePixelScanner,
  PixelScannerOptions,
  PixelScannerDispatchAction,
} from "./usePixelScanner";
import { ScannedPixel } from "../ScannedPixel";

/**
 * React hook that creates {@link PixelScanner} to scan for Pixels using Bluetooth.
 * The list is modified on every scan event, whether it is a newly discovered Pixel
 * or an already know one. As such the hosting React component will re-render on every
 * change.
 * @param opt Optional arguments, see {@link PixelScannerOptions}.
 * @returns An array with:
 * - The list of {@link ScannedPixel}. It is updated every time there is a new scan event.
 * - A stable reducer like function to dispatch actions to the scanner.
 * - The last encountered error.
 */
export function useScannedPixels(
  opt?: PixelScannerOptions
): [ScannedPixel[], (action: PixelScannerDispatchAction) => void, Error?] {
  const passthrough = React.useCallback(
    (
      items: ScannedPixel[],
      updates: {
        scannedPixel: ScannedPixel;
        index: number;
        previousIndex?: number;
      }[]
    ) => {
      // Create new list to trigger a React re-render
      const returnedItems = [...items];
      // Apply updates
      updates.forEach(({ scannedPixel, index }) => {
        returnedItems[index] = scannedPixel;
      });
      return returnedItems;
    },
    []
  );
  return usePixelScanner(passthrough, opt);
}
