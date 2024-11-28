import { assertNever } from "@systemic-games/pixels-core-utils";
import React from "react";

import {
  usePixelScannerNotify,
  PixelScannerOptions,
  PixelScannerDispatchAction,
  PixelScannerStatus,
} from "./usePixelScannerNotify";
import { PixelScannerListOperation, ScannedDevice } from "../PixelScanner";
import { ScannedBootloaderNotifier } from "../ScannedBootloaderNotifier";
import { ScannedChargerNotifier } from "../ScannedChargerNotifier";
import { ScannedDeviceNotifier } from "../ScannedDeviceNotifier";
import { ScannedMPCNotifier } from "../ScannedMPCNotifier";
import { ScannedPixelNotifier } from "../ScannedPixelNotifier";

function getNotifier(device: ScannedDevice): ScannedDeviceNotifier {
  const type = device.type;
  switch (type) {
    case "die":
      return ScannedPixelNotifier.getInstance(device);
    case "charger":
      return ScannedChargerNotifier.getInstance(device);
    case "mpc":
      return ScannedMPCNotifier.getInstance(device);
    case "bootloader":
      return ScannedBootloaderNotifier.getInstance(device);
    default:
      assertNever(type, `No notifier class for device of type: ${type}`);
  }
}

/**
 * React hook that creates {@link PixelScanner} to scan for Pixels using Bluetooth.
 * Use this hook if you don't want the hosting React component to re-render every
 * time an already scanned Pixel in the returned list of {@link ScannedDeviceNotifier}
 * gets updated.
 * @param opt Optional arguments, see {@link PixelScannerOptions}.
 * @returns An array with:
 * - The list of {@link ScannedDeviceNotifier}. The list itself is not modified when
 *   existing items are updated.
 * - A stable reducer like function to dispatch actions to the scanner.
 * - The scan status or the last error.
 * @remarks
 * {@link ScannedDeviceNotifier} instances are kept globally, for a given Pixel
 * the same instance is returned and updated by all scanners.
 */
export function useScannedPixelNotifiers(
  opt?: PixelScannerOptions
): [
  ScannedDeviceNotifier[],
  (action: PixelScannerDispatchAction) => void,
  PixelScannerStatus,
] {
  const mapItems = React.useCallback(
    (
      items: ScannedDeviceNotifier[],
      ops: readonly PixelScannerListOperation[]
    ) => {
      // We only want to create a React re-render when items are added
      // or removed but not when they are modified
      let retItems = items;
      // Apply updates
      for (const op of ops) {
        const t = op.status;
        switch (t) {
          case "scanned": {
            // The same instance will always be returned for a given Pixel id
            const notifier = getNotifier(op.item);
            const index = retItems.findIndex(
              (sp) => sp.pixelId === op.item.pixelId
            );
            if (index < 0 || retItems[index] !== notifier) {
              if (retItems === items) {
                retItems = [...items];
              }
              if (index < 0) {
                retItems.push(notifier);
              } else {
                retItems[index] = notifier;
              }
            }
            break;
          }
          case "lost": {
            const index = retItems.findIndex(
              (sp) => sp.pixelId === op.item.pixelId
            );
            if (index >= 0) {
              if (retItems === items) {
                retItems = [...items];
              }
              retItems.splice(index, 1);
            }
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

  return usePixelScannerNotify(mapItems, opt);
}
