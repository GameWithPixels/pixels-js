import {
  Pixel,
  PixelStatus,
} from "@systemic-games/react-native-pixels-connect";
import { useEffect, useReducer } from "react";

export default function (pixel?: Pixel): PixelStatus | undefined {
  const [_, update] = useReducer((b) => !b, false);

  // Subscribe to status event to trigger a React update on status change
  useEffect(() => {
    pixel?.addEventListener("status", update);
    return () => {
      pixel?.removeEventListener("status", update);
    };
  }, [pixel]);

  // Return the latest status
  return pixel?.status;
}
