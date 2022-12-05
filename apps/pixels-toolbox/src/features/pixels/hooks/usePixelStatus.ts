import {
  Pixel,
  PixelStatus,
} from "@systemic-games/react-native-pixels-connect";
import { useEffect, useReducer } from "react";

export default function (pixel?: Pixel): PixelStatus | undefined {
  const [_, forceUpdate] = useReducer((b) => !b, false);

  // Subscribe to status event to trigger a React update on status change
  useEffect(() => {
    pixel?.addEventListener("status", forceUpdate);
    return () => {
      pixel?.removeEventListener("status", forceUpdate);
    };
  }, [pixel]);

  // Return the latest status
  return pixel?.status;
}
