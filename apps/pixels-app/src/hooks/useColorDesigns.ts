import React from "react";

import { ColorDesign } from "@/temp";

export interface ColorDesignsContextData {
  colorDesigns: ColorDesign[];
}

export const ColorDesignsContext = React.createContext<ColorDesignsContextData>(
  { colorDesigns: [] }
);

export function useColorDesigns(): ColorDesignsContextData {
  return { ...React.useContext(ColorDesignsContext) };
}
