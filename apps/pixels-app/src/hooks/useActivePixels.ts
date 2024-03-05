import { Pixel } from "@systemic-games/react-native-pixels-connect";
import React from "react";

import { usePixelsCentral } from "./usePixelsCentral";

export function useActivePixels(): Pixel[] {
  const central = usePixelsCentral();
  const [pixels, setPixels] = React.useState(central.pixels);
  React.useEffect(() => {
    central.addEventListener("pixels", setPixels);
    return () => central.removeEventListener("pixels", setPixels);
  }, [central]);
  return pixels;
}

export function useActivePixel(pixelId?: number): Pixel | undefined {
  const central = usePixelsCentral();
  const [pixel, setPixel] = React.useState(
    central.pixels.find((p) => p.pixelId === pixelId)
  );
  React.useEffect(() => {
    const findPixel = (pixels: Pixel[]) => {
      setPixel(pixels.find((p) => p.pixelId === pixelId));
    };
    findPixel(central.pixels);
    central.addEventListener("pixels", findPixel);
    return () => central.removeEventListener("pixels", findPixel);
  }, [central, pixelId]);
  return pixel;
}
