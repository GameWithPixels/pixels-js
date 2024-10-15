import React from "react";

import { AppProfileData } from "~/features/store/library";

export const UpdateProfilesContext = React.createContext({
  updateProfiles: (
    _profileData: AppProfileData,
    _profilesUuids: string[]
  ) => {},
});

export function useUpdateProfiles() {
  return React.useContext(UpdateProfilesContext).updateProfiles;
}
