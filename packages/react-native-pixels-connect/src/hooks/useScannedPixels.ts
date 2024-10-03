import { assertNever } from "@systemic-games/pixels-core-utils";
import React from "react";

import {
  usePixelScannerNotify,
  PixelScannerOptions,
  PixelScannerDispatchAction,
  PixelScannerStatus,
} from "./usePixelScannerNotify";
import { PixelScannerListOperation, ScannedDevice } from "../PixelScanner";

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
  ScannedDevice[],
  (action: PixelScannerDispatchAction) => void,
  PixelScannerStatus,
] {
  const passthrough = React.useCallback(
    (items: ScannedDevice[], ops: readonly PixelScannerListOperation[]) => {
      // Create new list to trigger a React re-render
      const retItems = [...items];
      // Apply updates
      for (const op of ops) {
        const t = op.status;
        switch (t) {
          case "scanned": {
            const index = retItems.findIndex(
              (sp) => sp.pixelId === op.item.pixelId
            );
            if (index < 0) {
              retItems.push(op.item);
            } else {
              retItems[index] = op.item;
            }
            break;
          }
          case "lost": {
            const index = retItems.findIndex(
              (sp) => sp.pixelId === op.item.pixelId
            );
            retItems.splice(index, 1);
            break;
          }
          default:
            assertNever(t);
        }
      }
      return retItems;
    },
    []
  );
  return usePixelScannerNotify(passthrough, opt);
}
