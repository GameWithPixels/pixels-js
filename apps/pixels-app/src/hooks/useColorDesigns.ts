import { ColorDesign } from "@systemic-games/pixels-core-connect";
import React from "react";

export interface ColorDesignsContextData {
  colorDesigns: ColorDesign[];
}

export const ColorDesignsContext = React.createContext<ColorDesignsContextData>(
  { colorDesigns: [] }
);

export function useColorDesigns(): ColorDesignsContextData {
  return { ...React.useContext(ColorDesignsContext) };
}
