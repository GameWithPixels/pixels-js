import { Pixel } from "@systemic-games/react-native-pixels-connect";
import React from "react";

import { usePixelsCentral } from "./usePixelsCentral";

import { PixelsCentralEventMap } from "~/features/dice";

export function useWatchedPixels(): Readonly<Pixel[]> {
  const central = usePixelsCentral();
  const [pixels, setPixels] = React.useState(
    central.pixels.map((p) => central.getPixel(p.pixelId)!)
  );
  React.useEffect(() => {
    const onPixels = (pixels: PixelsCentralEventMap["pixels"]) =>
      setPixels(pixels.map((p) => central.getPixel(p.pixelId)!));
    central.addListener("pixels", onPixels);
    return () => {
      central.removeListener("pixels", onPixels);
    };
  }, [central]);
  return pixels;
}
