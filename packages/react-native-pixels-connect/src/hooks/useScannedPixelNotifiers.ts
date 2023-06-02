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
 */
export function useScannedPixelNotifiers(
  opt?: PixelScannerOptions
): [
  ScannedPixelNotifier[],
  (action: PixelScannerDispatchAction) => void,
  Error?
] {
  const allNotifiers = React.useRef<ScannedPixelNotifier[]>([]);
  const mapItems = React.useCallback(
    (items: ScannedPixelNotifier[], ops: PixelScannerListOp[]) => {
      // We only want to create a React re-render when new items are added
      // or existing items are moved
      let retItems = items;
      // Apply updates
      ops.forEach((op) => {
        const t = op.type;
        switch (t) {
          case "clear":
            retItems = [];
            break;
          case "add": {
            // Look for an "old" instance of a notifier as in this case we don't want to
            // recreate a new one and break the update of the existing instance.
            const existing = allNotifiers.current.find(
              (n) => n.pixelId === op.scannedPixel.pixelId
            );
            const notifier =
              existing ?? new ScannedPixelNotifier(op.scannedPixel);
            if (!existing) {
              allNotifiers.current.push(notifier);
            }
            if (retItems === items) {
              retItems = [...items, notifier];
            } else {
              retItems.push(notifier);
            }
            break;
          }
          case "update":
            retItems[op.index].updateProperties(op.scannedPixel);
            break;
          case "move": {
            const src = [...retItems];
            if (retItems === items) {
              retItems = [...items];
            }
            op.moves.forEach(({ from, to }) => {
              assert(src[from]);
              retItems[to] = src[from];
            });
            break;
          }
          default:
            assertNever(t);
        }
      });
      return retItems;
    },
    []
  );

  return usePixelScanner(mapItems, opt);
}
