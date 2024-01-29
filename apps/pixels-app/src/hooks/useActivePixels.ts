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
