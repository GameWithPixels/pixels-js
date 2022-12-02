import {
  Pixel,
  PixelStatus,
} from "@systemic-games/react-native-pixels-connect";
import { useEffect, useState } from "react";

import usePixelStatus from "./usePixelStatus";

export type PixelConnectAction = "connect" | "disconnect";

export interface PixelConnectOptions {
  pixel: Pixel;
}

export type PixelConnectDispatch = (
  action: PixelConnectAction,
  options?: PixelConnectOptions
) => void;

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

  return [usePixelStatus(), lastError];
}
