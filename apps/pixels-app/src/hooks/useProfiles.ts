// import { Serializable } from "@systemic-games/pixels-edit-animation";
import { Profiles } from "@systemic-games/react-native-pixels-connect";
import React from "react";

export interface ProfilesContextData {
  profiles: Profiles.Profile[];
  addProfile: (profile: Profiles.Profile) => void;

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

// import { useAppDispatch, useAppSelector } from "~/app/hooks";
// import { addProfile, removeProfile } from "~/features/store/profilesLibrarySlice";

// // Default profile at index 0
// export function useProfiles(): {
//   profiles: Profiles.Profile[];
//   addProfile: (profile: Profiles.Profile) => void;
//   removeProfile: (profileUuid: string) => void;
// } {
//   const serializedProfiles = useAppSelector((state) => state.profiles.profiles);
//   const profiles = React.useMemo(
//     () =>
//       serializedProfiles.map((p) =>
//         Serializable.toProfile(
//           p,
//           () => undefined,
//           () => undefined
//         )

//       ),
//     [serializedProfiles]
//   );
//   // Actions
//   const appDispatch = useAppDispatch();
//   const add = (profile: Profiles.Profile) =>
//     appDispatch(addProfile({ profile: Serializable.fromProfile(profile) }));
//   const remove = (profileUuid: string) =>
//     appDispatch(removeProfile(profileUuid));
//   return {
//     profiles,
//     addProfile: add,
//     removeProfile: remove,
//   };
// }
