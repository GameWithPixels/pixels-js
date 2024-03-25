import { Pixel, getPixel } from "@systemic-games/react-native-pixels-connect";
import React from "react";

import { usePixelsCentral } from "./usePixelsCentral";

import { PairedDie } from "~/app/PairedDie";

export function useWatchedPixel(
  pixelOrPixelId: Pick<PairedDie, "pixelId"> | number
): Pixel | undefined {
  const pixelId =
    typeof pixelOrPixelId === "number"
      ? pixelOrPixelId
      : pixelOrPixelId.pixelId;
  const [pixel, setPixel] = React.useState(getPixel(pixelId));
  const central = usePixelsCentral();
  React.useEffect(() => {
    const findPixel = (pixels: Pixel[]) => {
      setPixel(pixels.find((p) => p.pixelId === pixelId));
    };
    findPixel(central.pixels);
    central.addEventListener("pixels", findPixel);
    return () => {
      central.removeEventListener("pixels", findPixel);
    };
  }, [pixelId, central]);

  return pixel;
}
