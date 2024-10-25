import { DfuState } from "@systemic-games/react-native-nordic-nrf5-dfu";
import React from "react";

import { usePixelsCentral } from "./usePixelsCentral";

export function usePixelDfuState(pixelId?: number): {
  state?: DfuState | "scanning";
  progress?: number;
  error?: Error;
} {
  const central = usePixelsCentral();
  const [state, setState] = React.useState<DfuState | "scanning">();
  const [progress, setProgress] = React.useState<number>();
  const [error, setError] = React.useState<Error>();
  React.useEffect(() => {
    setState(undefined);
    setProgress(undefined);
    if (pixelId) {
      const removeOnState = central.addListener(
        "onDfuState",
        ({ pixelId: id, state }) => {
          if (id === pixelId) {
            setState(state);
            if (state !== "errored") {
              setError(undefined);
            }
          }
        }
      );
      const removeOnProgress = central.addListener(
        "onDfuProgress",
        ({ pixelId: id, progress }) => id === pixelId && setProgress(progress)
      );
      const removeOnError = central.addOperationStatusListener(
        pixelId,
        "updateFirmware",
        (op) => op.status === "failed" && setError(op.error)
      );
      return () => {
        removeOnState();
        removeOnProgress();
        removeOnError();
      };
    }
  }, [central, pixelId]);
  return { state, progress, error };
}
