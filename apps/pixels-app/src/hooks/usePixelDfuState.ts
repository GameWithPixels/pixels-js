import { DfuState } from "@systemic-games/react-native-nordic-nrf5-dfu";
import React from "react";

import { usePixelsCentral } from "./usePixelsCentral";

import { PixelsCentralEventMap } from "~/features/dice";

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
    const onState = ({
      pixel,
      state,
    }: PixelsCentralEventMap["pixelDfuState"]) => {
      if (pixelId === pixel.pixelId) {
        setState(state);
        if (state !== "errored") {
          setError(undefined);
        }
      }
    };
    central.addEventListener("pixelDfuState", onState);
    const onProgress = ({
      pixel,
      progress,
    }: PixelsCentralEventMap["pixelDfuProgress"]) => {
      if (pixelId === pixel.pixelId) {
        setProgress(progress);
      }
    };
    central.addEventListener("pixelDfuProgress", onProgress);
    const onError = ({
      pixel,
      error,
    }: PixelsCentralEventMap["pixelDfuError"]) => {
      if (pixelId === pixel.pixelId) {
        setError(error);
      }
    };
    central.addEventListener("pixelDfuError", onError);
    return () => {
      central.removeEventListener("pixelDfuState", onState);
      central.removeEventListener("pixelDfuProgress", onProgress);
      central.removeEventListener("pixelDfuError", onError);
    };
  }, [central, pixelId]);
  return { state, progress, error };
}
