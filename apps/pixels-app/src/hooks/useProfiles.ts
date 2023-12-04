import { PixelProfile } from "@systemic-games/pixels-core-connect";
import React from "react";

export interface ProfilesContextData {
  profiles: PixelProfile[];
  addProfile: (profile: PixelProfile) => void;
  removeProfile: (profileUuid: string) => void;
}

export const ProfilesContext = React.createContext<ProfilesContextData>({
  profiles: [],
  addProfile: () => {},
  removeProfile: () => {},
});

export function useProfiles(): ProfilesContextData {
  return { ...React.useContext(ProfilesContext) };
}
