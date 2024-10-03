import React from "react";

import { PixelsCentral } from "~/features/dice";

export const PixelsCentralContext = React.createContext<PixelsCentral>(
  new PixelsCentral()
);

export function usePixelsCentral(): PixelsCentral {
  return React.useContext(PixelsCentralContext);
}
