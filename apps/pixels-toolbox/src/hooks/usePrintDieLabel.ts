import React from "react";

import PixelDispatcher from "../features/pixels/PixelDispatcher";

export interface PrintDieLabelContextData {
  printDieLabel?: (pixel: PixelDispatcher) => void;
  setPrintDieLabel: (print: (pixel: PixelDispatcher) => void) => void;
}

export const PrintDieLabelContext =
  React.createContext<PrintDieLabelContextData>({
    setPrintDieLabel: () => {},
  });

export function usePrintDieLabel(): PrintDieLabelContextData {
  return { ...React.useContext(PrintDieLabelContext) };
}
