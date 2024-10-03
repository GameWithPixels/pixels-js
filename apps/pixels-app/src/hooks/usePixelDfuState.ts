import { DfuState } from "@systemic-games/react-native-nordic-nrf5-dfu";
import React from "react";

import { usePixelsCentral } from "./usePixelsCentral";

export function usePixelDfuState(pixelId?: number): {
  state?: DfuState;
  progress?: number;
  error?: Error;
} {
  const central = usePixelsCentral();
  const [state, setState] = React.useState<DfuState>();
  const [progress, setProgress] = React.useState<number>();
  const [error, setError] = React.useState<Error>();
  React.useEffect(() => {
    setState(undefined);
    setProgress(undefined);
    if (pixelId) {
      const removeOnState = central.addSchedulerListener(
        pixelId,
        "onDfuState",
        ({ state }) => {
          setState(state);
          if (state !== "errored") {
            setError(undefined);
          }
        }
      );
      const removeOnProgress = central.addSchedulerListener(
        pixelId,
        "onDfuProgress",
        ({ progress }) => setProgress(progress)
      );
      const removeOnError = central.addSchedulerListener(
        pixelId,
        "onOperationStatus",
        (op) => {
          if (
            op.status === "failed" &&
            op.operation.type === "updateFirmware"
          ) {
            setError(op.error);
          }
        }
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
