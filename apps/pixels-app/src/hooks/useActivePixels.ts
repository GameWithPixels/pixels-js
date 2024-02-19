import { Pixel } from "@systemic-games/react-native-pixels-connect";
import React from "react";

import { usePixelsCentral } from "./usePixelsCentral";

export function useActivePixels(): Pixel[] {
  const central = usePixelsCentral();
  const [pixels, setPixels] = React.useState(central.activePixels);
  React.useEffect(() => {
    central.addEventListener("activePixels", setPixels);
    return () => central.removeEventListener("activePixels", setPixels);
  }, [central]);
  return pixels;
}

export function useActivePixel(pixelId?: number): Pixel | undefined {
  const central = usePixelsCentral();
  const [pixel, setPixel] = React.useState(
    central.activePixels.find((p) => p.pixelId === pixelId)
  );
  React.useEffect(() => {
    const findPixel = (pixels: Pixel[]) => {
      setPixel(pixels.find((p) => p.pixelId === pixelId));
    };
    findPixel(central.activePixels);
    central.addEventListener("activePixels", findPixel);
    return () => central.removeEventListener("activePixels", findPixel);
  }, [central, pixelId]);
  return pixel;
}
