import { Pixel, PixelStatus } from "@systemic-games/pixels-core-connect";
import { useEffect, useState } from "react";

import usePixelStatus from "./usePixelStatus";

/**
 * React Hook that connects to the given Pixel on mount, and disconnect on dismount.
 * @param pixel The Pixel to connect to, may be undefined.
 * @returns An array with the Pixel status and the last encountered error.
 */
export default function (pixel?: Pixel): [PixelStatus?, Error?] {
  const [lastError, setLastError] = useState<Error>();
  useEffect(() => {
    setLastError(undefined);
    if (pixel) {
      pixel.connect().catch(setLastError);
      return () => {
        pixel.disconnect().catch(setLastError);
      };
    }
  }, [pixel]);

  return [usePixelStatus(pixel), lastError];
}
