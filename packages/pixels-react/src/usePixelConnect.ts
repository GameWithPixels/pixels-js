import { Pixel, PixelStatus } from "@systemic-games/pixels-core-connect";
import { assertNever } from "@systemic-games/pixels-core-utils";
import { useCallback, useEffect, useRef, useState } from "react";

import { usePixelStatus } from "./usePixelStatus";

/**
 * React Hook that returns a dispatch function to connect to and disconnect from
 * a given Pixel.
 * Automatically disconnects from the Pixel on dismount.
 * @returns An array with:
 *          - the Pixel status,
 *          - the Pixel,
 *          - a stable dispatch function that may be called to connect and disconnect,
 *          - the last encountered error.
 * @remarks The Pixel argument of the dispatch function is required only for the
 *          first "connect" action.
 *          Only one Pixel may be connected at a given time with the same
 *          dispatch function. Connecting to another Pixel using the same dispatch
 *          will first disconnect from the previous Pixel.
 */
export function usePixelConnect(
  pixel?: Pixel
): [
  PixelStatus | undefined,
  Pixel | undefined,
  (action: "connect" | "disconnect", pixel?: Pixel) => void,
  Error?
] {
  const [lastError, setLastError] = useState<Error>();
  const [curPixel, setCurPixel] = useState(pixel);
  const pixelToDisco = useRef<Pixel>();

  // Create the dispatch function
  const dispatch = useCallback(
    (action: "connect" | "disconnect", pixel?: Pixel) => {
      // Clear last error
      setLastError(undefined);
      switch (action) {
        case "connect":
          setCurPixel((curPixel) => {
            // Store Pixel
            if (!pixel) {
              // Re-use the current Pixel if none given
              pixel = curPixel;
            }
            if (pixel) {
              if (pixel !== curPixel) {
                // Disconnect from a previous Pixel
                curPixel?.disconnect().catch((error) =>
                  // We don't want to return this error as we are in a connect action
                  console.warn(`Error disconnecting Pixel :${error}`)
                );
              }
              // Connect to our Pixel
              pixelToDisco.current = pixel;
              pixel.connect().catch(setLastError);
            }
            return pixel;
          });
          break;
        case "disconnect":
          // Disconnect from our stored Pixel
          pixelToDisco.current?.disconnect().catch(setLastError);
          pixelToDisco.current = undefined;
          break;
        default:
          assertNever(action);
      }
    },
    []
  );

  // Disconnect on unmount and when given a different Pixel
  useEffect(() => {
    if (pixel) {
      dispatch("connect", pixel);
    }
    return () => dispatch("disconnect");
  }, [dispatch, pixel]);

  return [usePixelStatus(curPixel), curPixel, dispatch, lastError];
}
