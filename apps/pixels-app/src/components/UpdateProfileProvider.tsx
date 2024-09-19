import React from "react";

import { useAppStore } from "~/app/hooks";
import { readProfile, Library } from "~/features/store";
import { AppProfileData } from "~/features/store/library/LibraryData";
import { UpdateProfilesContext } from "~/hooks";

// Use this context to defer updating a profile to the next render cycle
// This is useful when updating a profile from a native event
// as it would update components immediately after updating the redux store
// and thus not leaving the opportunity to update the profile instances
// before the components are rendered
export function UpdateProfileProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const store = useAppStore();
  const [data, setData] = React.useState({
    profileData: undefined as AppProfileData | undefined,
    profilesUuids: [] as string[],
  });
  const updateProfiles = React.useCallback(
    (profileData: AppProfileData, profilesUuid: string[]) =>
      setData({ profileData, profilesUuids: profilesUuid }),
    []
  );
  React.useEffect(() => {
    const { profileData, profilesUuids } = data;
    if (profileData && profilesUuids.length) {
      for (const uuid of profilesUuids) {
        if (uuid.length) {
          const dstProfile = store.getState().library.profiles.entities[uuid];
          store.dispatch(
            Library.Profiles.update({
              ...profileData,
              uuid,
              // Keep source UUID and die type of the original (destination) profile
              sourceUuid: dstProfile?.sourceUuid,
              dieType: dstProfile?.dieType ?? profileData.dieType,
            })
          );
          // Update profile instance
          readProfile(uuid, store.getState().library);
        }
      }
    }
  }, [data, store]);
  return (
    <UpdateProfilesContext.Provider value={{ updateProfiles }}>
      {children}
    </UpdateProfilesContext.Provider>
  );
}
