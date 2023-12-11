import { Profiles } from "@systemic-games/react-native-pixels-connect";
import React from "react";

export interface ColorDesignsContextData {
  colorDesigns: Profiles.ColorDesign[];
}

export const ColorDesignsContext = React.createContext<ColorDesignsContextData>(
  { colorDesigns: [] }
);

export function useColorDesigns(): ColorDesignsContextData {
  return { ...React.useContext(ColorDesignsContext) };
}
