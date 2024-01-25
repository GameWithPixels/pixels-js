import { assertNever } from "@systemic-games/pixels-core-utils";
import React from "react";

import {
  usePixelScanner,
  PixelScannerOptions,
  PixelScannerDispatchAction,
  PixelScannerStatus,
} from "./usePixelScanner";
import { PixelScannerListOp } from "../PixelScanner";
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
 * - The scan status or the last error.
 */
export function useScannedPixels(
  opt?: PixelScannerOptions
): [
  ScannedPixel[],
  (action: PixelScannerDispatchAction) => void,
  PixelScannerStatus,
] {
  const passthrough = React.useCallback(
    (items: ScannedPixel[], ops: PixelScannerListOp[]) => {
      // Create new list to trigger a React re-render
      const retItems = [...items];
      // Apply updates
      for (const op of ops) {
        const t = op.type;
        switch (t) {
          case "clear":
            retItems.length = 0;
            break;
          case "add":
            retItems.push(op.scannedPixel);
            break;
          case "update":
            retItems[op.index] = op.scannedPixel;
            break;
          case "remove":
            retItems.splice(op.index, 1);
            break;
          default:
            assertNever(t);
        }
      }
      return retItems;
    },
    []
  );
  return usePixelScanner(passthrough, opt);
}
