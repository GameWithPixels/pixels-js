import {
  Pixel,
  PixelStatus,
  RollEvent,
} from "@systemic-games/pixels-core-connect";
import { usePixelEvent } from "@systemic-games/react-native-pixels-connect";
import React from "react";

export function useIsPixelRolling(pixel?: Pixel, status?: PixelStatus) {
  const [rollEv] = usePixelEvent(pixel, "roll");
  const ignoreRollEvRef = React.useRef<RollEvent>();
  if (status !== "ready") {
    ignoreRollEvRef.current = rollEv;
  }
  return (
    status === "ready" &&
    ignoreRollEvRef.current !== rollEv &&
    (rollEv?.state === "rolling" || rollEv?.state === "handling")
  );
}
