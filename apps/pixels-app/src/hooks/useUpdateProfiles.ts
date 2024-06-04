import { Serializable } from "@systemic-games/react-native-pixels-connect";
import React from "react";

export const UpdateProfilesContext = React.createContext({
  updateProfiles: (
    _profileData: Serializable.ProfileData,
    _profilesUuids: string[]
  ) => {},
});

export function useUpdateProfiles() {
  return React.useContext(UpdateProfilesContext).updateProfiles;
}
