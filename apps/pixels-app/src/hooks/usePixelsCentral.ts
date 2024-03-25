import React from "react";

import { PixelsCentral } from "~/features/dice/PixelsCentral";

export const PixelsCentralContext = React.createContext<PixelsCentral>(
  new PixelsCentral()
);

export function usePixelsCentral(): PixelsCentral {
  return React.useContext(PixelsCentralContext);
}

export function usePixelsCentralOnReady(
  onReadyCallback: (isReady: boolean) => void
): void {
  const central = usePixelsCentral();
  React.useEffect(() => {
    central.addEventListener("isReady", onReadyCallback);
    onReadyCallback(central.isReady);
    return () => {
      central.removeEventListener("isReady", onReadyCallback);
    };
  }, [central, onReadyCallback]);
}
