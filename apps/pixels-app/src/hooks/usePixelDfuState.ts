import { DfuState } from "@systemic-games/react-native-nordic-nrf5-dfu";
import React from "react";

import { usePixelsCentral } from "./usePixelsCentral";

export function usePixelDfuState(pixelId?: number): {
  state?: DfuState | "scanning";
  progress?: number;
} {
  const central = usePixelsCentral();
  const [state, setState] = React.useState<DfuState | "scanning">();
  const [progress, setProgress] = React.useState<number>();
  React.useEffect(() => {
    setState(undefined);
    setProgress(undefined);
    if (pixelId) {
      const removeOnState = central.addListener(
        "onDfuState",
        ({ pixelId: id, state }) => {
          if (id === pixelId) {
            setState(state);
          }
        }
      );
      const removeOnProgress = central.addListener(
        "onDfuProgress",
        ({ pixelId: id, progress }) => id === pixelId && setProgress(progress)
      );
      return () => {
        removeOnState();
        removeOnProgress();
      };
    }
  }, [central, pixelId]);
  return { state, progress };
}
