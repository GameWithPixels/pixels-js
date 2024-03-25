import { Pixel } from "@systemic-games/react-native-pixels-connect";
import React from "react";

import { usePixelsCentral } from "./usePixelsCentral";

export function useWatchedPixels(): Readonly<Pixel[]> {
  const central = usePixelsCentral();
  const [pixels, setPixels] = React.useState(central.pixels);
  React.useEffect(() => {
    central.addEventListener("pixels", setPixels);
    return () => {
      central.removeEventListener("pixels", setPixels);
    };
  }, [central]);
  return pixels;
}
