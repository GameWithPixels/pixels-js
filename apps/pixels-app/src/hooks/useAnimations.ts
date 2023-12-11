import { Profiles } from "@systemic-games/react-native-pixels-connect";
import React from "react";

export interface AnimationsContextData {
  animations: Profiles.Animation[];
  addAnimation: (animation: Profiles.Animation) => void;
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
