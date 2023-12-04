import { PixelAnimation } from "@systemic-games/pixels-core-connect";
import React from "react";

export interface AnimationsContextData {
  animations: PixelAnimation[];
  addAnimation: (animation: PixelAnimation) => void;
  removeAnimation: (animUuid: string) => void;
}

export const AnimationsContext = React.createContext<AnimationsContextData>({
  animations: [],
  addAnimation: () => {},
  removeAnimation: () => {},
});

export function useAnimations(): AnimationsContextData {
  return { ...React.useContext(AnimationsContext) };
}
