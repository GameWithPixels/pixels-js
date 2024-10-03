import { Pixel } from "@systemic-games/react-native-pixels-connect";
import React from "react";

import { usePixelsCentral } from "./usePixelsCentral";

import { areArraysEqual } from "~/features/utils";

export function useRegisteredPixels(): Readonly<Pixel[]> {
  const central = usePixelsCentral();
  const [pixels, setPixels] = React.useState([...central.pixels]);
  React.useEffect(() => {
    setPixels((pixels) => {
      const newPixels = central.pixels;
      return areArraysEqual(pixels, newPixels) ? pixels : [...newPixels];
    });
    return central.addListener("pixels", (p) => setPixels([...p]));
  }, [central]);
  return pixels;
}
