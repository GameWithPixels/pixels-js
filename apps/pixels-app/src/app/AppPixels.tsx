import React from "react";

import { useAppSelector } from "./hooks";

import { PixelsCentral } from "~/features/dice/PixelsCentral";
import { PixelsCentralContext } from "~/hooks";

export function AppPixels({ children }: React.PropsWithChildren) {
  const pairedDice = useAppSelector((state) => state.pairedDice);
  const pixelsCentral = React.useMemo(() => new PixelsCentral(), []);
  return (
    <PixelsCentralContext.Provider value={pixelsCentral}>
      {children}
    </PixelsCentralContext.Provider>
  );
}
