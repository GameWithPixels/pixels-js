import { Pixel, getPixel } from "@systemic-games/react-native-pixels-connect";
import React from "react";

import { usePixelsCentral } from "./usePixelsCentral";

import { PairedDie } from "~/app/PairedDie";
import { useAppSelector } from "~/app/hooks";
import { logError, unsigned32ToHex } from "~/features/utils";

export function usePairedPixel(
  pixelOrPixelId: Pick<PairedDie, "pixelId"> | number
): Pixel | undefined {
  const pairedDice = useAppSelector((state) => state.pairedDice.paired);
  const pixelId =
    typeof pixelOrPixelId === "number"
      ? pixelOrPixelId
      : pixelOrPixelId.pixelId;
  if (!pairedDice.some((d) => d.pixelId === pixelId)) {
    logError(`Pixel ${unsigned32ToHex(pixelId)} not paired`);
  }

  const [pixel, setPixel] = React.useState(getPixel(pixelId));
  const pixelsCentral = usePixelsCentral();
  React.useEffect(() => {
    setPixel(getPixel(pixelId));
    const onActivePixels = (activePixels: Pixel[]) => {
      const pixel = activePixels.find((p) => p.pixelId === pixelId);
      if (pixel) {
        setPixel(pixel);
      }
    };
    pixelsCentral.addEventListener("activePixels", onActivePixels);
    return () =>
      pixelsCentral.removeEventListener("activePixels", onActivePixels);
  }, [pixelId, pixelsCentral]);

  return pixel;
}
