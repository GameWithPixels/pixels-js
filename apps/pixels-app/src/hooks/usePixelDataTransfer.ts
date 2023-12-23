import { Pixel } from "@systemic-games/pixels-core-connect";
import React from "react";

export function usePixelDataTransfer(pixel?: Pixel): number {
  const [progress, setProgress] = React.useState(-1);
  React.useEffect(() => {
    if (pixel) {
      const onProgress = ({ progress }: { progress: number }) => {
        setProgress(progress);
      };
      pixel.addEventListener("dataTransfer", onProgress);
      return () => {
        pixel.removeEventListener("dataTransfer", onProgress);
      };
    }
  }, [pixel]);
  return progress;
}
