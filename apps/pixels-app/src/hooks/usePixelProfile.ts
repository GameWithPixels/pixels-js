import { Pixel } from "@systemic-games/react-native-pixels-connect";
import React from "react";

import { defaultProfile } from "~/data";
import { PixelProfile } from "~/temp";

export interface ActiveProfile {
  pixel: Pixel;
  profile: PixelProfile;
}

export interface ActiveProfilesContextData {
  activeProfiles: ActiveProfile[];
  changeProfile: (pixel: Pixel, profile: PixelProfile) => void;
}

export const ActiveProfilesContext =
  React.createContext<ActiveProfilesContextData>({
    activeProfiles: [],
    changeProfile: () => {},
  });

export function usePixelProfile(pixel?: Pixel): {
  profile: PixelProfile;
  changeProfile: (profile: PixelProfile) => void;
} {
  const { activeProfiles, changeProfile } = React.useContext(
    ActiveProfilesContext
  );
  const profile =
    activeProfiles.find((p) => p.pixel === pixel)?.profile ?? defaultProfile;
  return {
    profile,
    changeProfile: React.useCallback(
      (p: PixelProfile) => pixel && changeProfile(pixel, p),
      [changeProfile, pixel]
    ),
  };
}
