import React from "react";

import {
  usePixelScanner,
  PixelScannerOptions,
  PixelScannerDispatchAction,
} from "./usePixelScanner";
import { ScannedPixel } from "../ScannedPixel";
import { ScannedPixelNotifier } from "../ScannedPixelNotifier";

class UpdatableScannedPixelNotifier extends ScannedPixelNotifier {
  update(
    props: Parameters<
      (typeof ScannedPixelNotifier)["prototype"]["_updateProperties"]
    >[0]
  ) {
    this._updateProperties(props);
  }
}

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
  const mapItems = React.useCallback(
    (
      items: ScannedPixelNotifier[],
      updates: {
        scannedPixel: ScannedPixel;
        index: number;
        previousIndex?: number;
      }[]
    ) => {
      // We only want to create a React re-render when new items are added
      // or existing items are moved
      const updateList = !updates.every(
        ({ index, previousIndex }) => index === previousIndex
      );
      items = updateList ? [...items] : items;
      // Apply updates
      updates.forEach(({ scannedPixel: sp, index, previousIndex }) => {
        if (previousIndex === undefined) {
          // New item
          items[index] = new UpdatableScannedPixelNotifier(sp);
        } else {
          // Get item at is previous index
          const item = items[previousIndex];
          // Update it
          (item as UpdatableScannedPixelNotifier).update(sp);
          // And possibly move it to a new index
          items[index] = item;
        }
      });
      return items;
    },
    []
  );

  return usePixelScanner(mapItems, opt);
}
