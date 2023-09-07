import { assert, assertNever } from "@systemic-games/pixels-core-utils";
import React from "react";

import {
  usePixelScanner,
  PixelScannerOptions,
  PixelScannerDispatchAction,
} from "./usePixelScanner";
import { PixelScannerListOp } from "../PixelScanner";
import { ScannedPixelNotifier } from "../ScannedPixelNotifier";

/**
 * React hook that creates {@link PixelScanner} to scan for Pixels using Bluetooth.
 * Use this hook if you don't want the hosting React component to re-render every time
 * an already scanned Pixel in the returned list of {@link ScannedPixelNotifier} gets updated.
 * @param opt Optional arguments, see {@link PixelScannerOptions}.
 * @returns An array with:
 * - The list of {@link ScannedPixelNotifier}. The list itself is not modified when
 *   existing items are updated.
 * - A stable reducer like function to dispatch actions to the scanner.
 * - The last encountered error.
 * @remarks {@link ScannedPixelNotifier} instances are kept globally, for a given Pixel
 *          the same instance is returned and updated by all scanners.
 */
export function useScannedPixelNotifiers(
  opt?: PixelScannerOptions
): [
  ScannedPixelNotifier[],
  (action: PixelScannerDispatchAction) => void,
  Error?
] {
  const mapItems = React.useCallback(
    (items: ScannedPixelNotifier[], ops: PixelScannerListOp[]) => {
      // We only want to create a React re-render when items are added
      // or removed but not when they are modified
      let retItems = items;
      // Apply updates
      for (const op of ops) {
        const t = op.type;
        switch (t) {
          case "clear":
            retItems = [];
            break;
          case "add": {
            // The same instance will always be returned for a given Pixel id
            const notifier = ScannedPixelNotifier.getInstance(op.scannedPixel);
            if (retItems === items) {
              retItems = [...items, notifier];
            } else {
              retItems.push(notifier);
            }
            break;
          }
          case "update":
            assert(retItems[op.index]);
            retItems[op.index].updateProperties(op.scannedPixel);
            break;
          default:
            assertNever(t);
        }
      }
      return retItems;
    },
    []
  );

  return usePixelScanner(mapItems, opt);
}
