import { assertNever } from "@systemic-games/pixels-core-utils";
import React from "react";

import { PixelScanner, PixelScannerListOperation } from "../PixelScanner";
import { ScannedCharger } from "../ScannedCharger";
import { ScannedPixel } from "../ScannedPixel";

/**
 * Actions to be taken on the Pixel scanner.
 */
export type PixelScannerDispatchAction = "start" | "stop" | "clear";

/**
 * Status of the scanner or the last error.
 * @remarks The scanner is considered stopped when there is an error.
 */
export type PixelScannerStatus = "started" | "stopped" | Error;

/**
 * Available options for {@link usePixelScannerNotify}.
 */
export interface PixelScannerOptions {
  /** Optional filter to only keep certain Pixels in the list. */
  scanFilter?: (item: ScannedPixel | ScannedCharger) => boolean;

  /**
   * Minimum interval in milliseconds between two React state updates.
   * A value of 0 will generate a state update on every scan event.
   * @default 200 ms.
   */
  minUpdateInterval?: number;

  /**
   * If true, the scanner will start automatically on mount.
   * @default true.
   **/
  autoStart?: boolean;

  /**
   * The duration in milliseconds for which a Scanned Pixel should
   * be considered available since the last received advertisement.
   * A value of 0 keeps the dice forever.
   * @default 5000 ms.
   **/
  keepAliveDuration?: number;
}

/**
 * React hook that creates {@link PixelScanner} to scan for Pixels using Bluetooth.
 * @param updateItems Callback that maps {@link ScannedPixel} to the desired type.
 * The returned array is stored in the React state value that is returned by this function.
 * As such, a new array must be returned to trigger a React state update.
 * Parameters:
 * - items: The last returned array of {@link T} objects.
 * - updates: The list of new or updated {@link ScannedPixel} along with their
 *            new and previous index in the list (undefined for new items).
 * - Returns: The updated list of {@link T} objects.
 * @param opt Optional arguments, see {@link PixelScannerOptions}.
 * @returns An array with:
 * - The list of {@link T} objects corresponding to the scanned Pixels.
 * - A stable reducer like function to dispatch actions to the scanner.
 * - The scan status or the last error.
 * @remarks This hook is reserved for advanced usage. There are simpler hooks such as
 *          {@link useScannedPixels} or {@link useScannedPixelNotifiers}.
 */
export function usePixelScannerNotify<T>(
  updateItems: (items: T[], ops: readonly PixelScannerListOperation[]) => T[],
  opt?: PixelScannerOptions
): [T[], (action: PixelScannerDispatchAction) => void, PixelScannerStatus] {
  const [status, setStatus] = React.useState<PixelScannerStatus>("stopped");
  const [items, setItems] = React.useState<T[]>([]);
  const itemsRef = React.useRef(items); // Keep track of items list outside of a state
  const scanner = React.useMemo(() => new PixelScanner(), []);

  // Clean-up on umount so the list if not kept after a Fast Refresh
  React.useEffect(() => {
    return () => {
      itemsRef.current = [];
      setItems(itemsRef.current);
    };
  }, []);

  // Hook updateItems to scan events
  React.useEffect(() => {
    scanner.addListener("scanListOperations", ({ ops }) => {
      // Note: we don't do setItems(items => updateItems(items, ...))
      // because that would run updateItems() callback while rendering the component
      // hosting this hook, and thus preventing the callback from modifying other
      // React states (we would get the "Cannot update a component  while rendering
      // a different component" warning)
      itemsRef.current = updateItems(itemsRef.current, ops);
      setItems(itemsRef.current);
    });
  }, [scanner, updateItems]);

  // Options default values
  const minNotifyInterval = opt?.minUpdateInterval ?? 200;
  const keepAliveDuration = opt?.keepAliveDuration ?? 5000;
  const scanFilter = opt?.scanFilter;
  React.useEffect(() => {
    scanner.minNotifyInterval = minNotifyInterval;
    scanner.scanFilter = scanFilter;
    scanner.keepAliveDuration = keepAliveDuration;
  }, [keepAliveDuration, minNotifyInterval, scanFilter, scanner]);

  // The returned dispatcher (stable)
  const dispatch = React.useCallback(
    (action: PixelScannerDispatchAction) => {
      const dispatchAsync = async () => {
        switch (action) {
          case "start":
            return scanner.startAsync();
          case "stop":
            return scanner.stopAsync();
          case "clear":
            setItems([]);
            break;
          default:
            assertNever(action);
        }
      };
      dispatchAsync()
        .then(() => {
          if (action !== "clear") {
            setStatus(action === "start" ? "started" : "stopped");
          }
        })
        .catch(setStatus);
    },
    [scanner] // Stable
  );

  // Init & clean up effect
  const [autoStart] = React.useState(
    opt?.autoStart === undefined ?? opt?.autoStart
  );
  React.useEffect(
    () => {
      if (autoStart) {
        // Start scanning on mount
        dispatch("start");
      }
      // Stop scanning on umount
      return () => {
        // We call the scanner directly so to catch and log an eventual error
        scanner
          .stopAsync()
          .catch((e) =>
            console.error("usePixelScanner: Error while unmounting", e)
          );
      };
    },
    [autoStart, dispatch, scanner] // Stable
  );

  return [items, dispatch, status];
}
