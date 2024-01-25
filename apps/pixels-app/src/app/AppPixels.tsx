import React from "react";

import { useAppSelector } from "./hooks";

import { PixelsCentral } from "~/features/dice/PixelsCentral";
import { PixelsCentralContext } from "~/hooks";

export function AppPixels({ children }: React.PropsWithChildren) {
  const pixelsCentral = React.useMemo(() => new PixelsCentral(), []);
  const pairedDice = useAppSelector((state) => state.pairedDice.paired);
  React.useEffect(() => {
    for (const die of pairedDice) {
      pixelsCentral.monitorPixel(die.pixelId);
    }
  }, [pairedDice, pixelsCentral]);
  return (
    <PixelsCentralContext.Provider value={pixelsCentral}>
      {children}
    </PixelsCentralContext.Provider>
  );
}
