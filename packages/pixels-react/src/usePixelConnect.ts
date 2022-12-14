import { Pixel, PixelStatus } from "@systemic-games/pixels-core-connect";
import { assertNever } from "@systemic-games/pixels-core-utils";
import { useCallback, useState } from "react";

import usePixelStatus from "./usePixelStatus";

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
export default function (): [
  PixelStatus | undefined,
  Pixel | undefined,
  (action: "connect" | "disconnect", pixel?: Pixel) => void,
  Error?
] {
  const [lastError, setLastError] = useState<Error>();
  const [pixel, setPixel] = useState<Pixel>();

  // Create the dispatch function
  const dispatch = useCallback(
    (action: "connect" | "disconnect", pixel?: Pixel) => {
      // Clear last error
      setLastError(undefined);
      // Store Pixel
      setPixel((lastPixel) => {
        switch (action) {
          case "connect":
            if (!pixel) {
              // Re-use the current Pixel if none given
              pixel = lastPixel;
            }
            if (pixel) {
              if (lastPixel !== pixel) {
                // Disconnect from a previous Pixel
                lastPixel?.disconnect().catch((error) =>
                  // We don't want to return this error as we are in a connect action
                  console.log(`Error disconnecting Pixel :${error}`)
                );
              }
              // Connect to our Pixel
              pixel.connect().catch(setLastError);
            }
            break;
          case "disconnect":
            // Disconnect from our Pixel
            lastPixel?.disconnect().catch(setLastError);
            break;
          default:
            assertNever(action);
        }
        return pixel;
      });
    },
    []
  );

  return [usePixelStatus(pixel), pixel, dispatch, lastError];
}
