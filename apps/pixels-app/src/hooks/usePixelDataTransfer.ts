import { Pixel, PixelEventMap } from "@systemic-games/pixels-core-connect";
import React from "react";

export function usePixelDataTransfer(pixel?: Pixel): number {
  const [progress, setProgress] = React.useState(-1);
  React.useEffect(() => {
    if (pixel) {
      const onProgress = (ev: PixelEventMap["dataTransfer"]) => {
        if (ev.type === "preparing" || ev.type === "starting") {
          setProgress(0);
        } else if (ev.type === "progress") {
          setProgress(ev.progress);
        } else if (ev.type === "completed" || ev.type === "failed") {
          setProgress(-1);
        }
      };
      pixel.addEventListener("dataTransfer", onProgress);
      return () => {
        pixel.removeEventListener("dataTransfer", onProgress);
      };
    }
  }, [pixel]);
  return progress;
}
