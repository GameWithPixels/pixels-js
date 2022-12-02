import { assertNever } from "@systemic-games/pixels-core-utils";
import {
  Pixel,
  PixelStatus,
} from "@systemic-games/react-native-pixels-connect";
import { useCallback, useState } from "react";

import usePixelStatus from "./usePixelStatus";

// Returned dispatch function is stable
export default function (): [
  PixelStatus | undefined,
  Pixel | undefined,
  (action: "connect" | "disconnect", pixel?: Pixel) => void,
  Error?
] {
  const [lastError, setLastError] = useState<Error>();
  const [pixel, setPixel] = useState<Pixel>();
  const dispatch = useCallback(
    (action: "connect" | "disconnect", pixel?: Pixel) => {
      setLastError(undefined);
      setPixel((lastPixel) => {
        switch (action) {
          case "connect":
            if (!pixel) {
              pixel = lastPixel;
            }
            if (pixel) {
              if (lastPixel !== pixel) {
                lastPixel?.disconnect().catch((error) =>
                  // We don't want to return this error as we are in a connect action
                  console.log(`Error disconnecting Pixel :${error}`)
                );
              }
              pixel.connect().catch(setLastError);
            }
            break;
          case "disconnect":
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
